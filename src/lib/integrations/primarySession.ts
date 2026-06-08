export type PrimarySession = {
  signedIn: boolean;
  email: string | null;
  connected: boolean;
  merchantSettingsPath: string | null;
};

const PRIMARY_SESSION_MESSAGE = "next-address-primary-session";
const PROBE_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 30_000;

function primaryOrigin(primaryBaseUrl: string): string {
  return new URL(primaryBaseUrl.replace(/\/$/, "")).origin;
}

type CacheEntry = { at: number; result: PrimarySession };
const resultCache = new Map<string, CacheEntry>();
let inFlight: Promise<PrimarySession> | null = null;
let inFlightKey = "";

function cacheKey(base: string, connectExternalUserId: string) {
  return `${base}|${connectExternalUserId}|${window.location.origin}`;
}

function readCache(key: string): PrimarySession | null {
  const hit = resultCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    resultCache.delete(key);
    return null;
  }
  return hit.result;
}

function writeCache(key: string, result: PrimarySession) {
  resultCache.set(key, { at: Date.now(), result });
}

/** Invalidate after returning from primary connect/disconnect flows. */
export function invalidatePrimarySessionCache() {
  resultCache.clear();
}

function probeOnce(
  primaryBaseUrl: string,
  connectExternalUserId: string,
): Promise<PrimarySession> {
  const base = primaryBaseUrl.replace(/\/$/, "");
  const origin = primaryOrigin(base);
  const parentOrigin = window.location.origin;

  return new Promise((resolve) => {
    const params = new URLSearchParams({
      parent_origin: parentOrigin,
      external_user_id: connectExternalUserId,
    });

    const iframe = document.createElement("iframe");
    iframe.hidden = true;
    iframe.title = "NextAddress session check";

    let settled = false;
    const timeout = window.setTimeout(finish, PROBE_TIMEOUT_MS);

    function finish(
      result: PrimarySession = {
        signedIn: false,
        email: null,
        connected: false,
        merchantSettingsPath: null,
      },
    ) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      resolve(result);
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== origin) return;
      const data = event.data as {
        type?: string;
        signedIn?: boolean;
        email?: string | null;
        linked?: boolean;
        connected?: boolean;
        merchantSettingsPath?: string | null;
      };
      if (data?.type !== PRIMARY_SESSION_MESSAGE) return;
      finish({
        signedIn: !!data.signedIn,
        email: data.email ?? null,
        connected: !!(data.connected ?? data.linked),
        merchantSettingsPath:
          typeof data.merchantSettingsPath === "string" ? data.merchantSettingsPath : null,
      });
    }

    window.addEventListener("message", onMessage);
    iframe.src = `${base}/auth/embed-session?${params.toString()}`;
    document.body.appendChild(iframe);
  });
}

/** Clerk session lives on the primary origin — probe via a tiny server-rendered iframe. */
export function probePrimaryClerkSession(
  primaryBaseUrl: string,
  connectExternalUserId: string,
  options?: { force?: boolean },
): Promise<PrimarySession> {
  const base = primaryBaseUrl.replace(/\/$/, "");
  const key = cacheKey(base, connectExternalUserId);

  if (!options?.force) {
    const cached = readCache(key);
    if (cached) return Promise.resolve(cached);
    if (inFlight && inFlightKey === key) return inFlight;
  }

  inFlightKey = key;
  inFlight = probeOnce(base, connectExternalUserId)
    .then((result) => {
      writeCache(key, result);
      return result;
    })
    .finally(() => {
      if (inFlightKey === key) {
        inFlight = null;
        inFlightKey = "";
      }
    });

  return inFlight;
}
