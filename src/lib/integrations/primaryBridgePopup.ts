import { invalidatePrimarySessionCache } from "@/lib/integrations/primarySession";
import { openPrimarySettingsTab } from "anemone-server-js/embed";
import { PLATFORM_NAME } from "@/lib/config";

export const ANEMONE_BRIDGE_COMPLETE = "anemone-bridge-complete";

const POPUP_NAME = "anemone-bridge";
const POPUP_FEATURES = "width=520,height=720";
const HIDDEN_FRAME_TIMEOUT_MS = 30_000;

function isBridgeSignInUrl(url: string): boolean {
  try {
    return new URL(url).pathname.startsWith("/sign-in");
  } catch {
    return url.includes("/sign-in");
  }
}

/**
 * Runs connect/disconnect on the primary platform inside a hidden iframe. Requires an
 * existing Clerk session on the primary origin; the host page stays put.
 */
export function runAnemoneBridgeInHiddenFrame(
  url: string,
  onComplete: () => void | Promise<void>,
): void {
  invalidatePrimarySessionCache();

  const iframe = document.createElement("iframe");
  iframe.hidden = true;
    iframe.title = `${PLATFORM_NAME} account link`;

  let done = false;
  const timeout = window.setTimeout(() => void finish(), HIDDEN_FRAME_TIMEOUT_MS);

  function teardown() {
    window.clearTimeout(timeout);
    window.removeEventListener("message", onMessage);
    iframe.remove();
  }

  async function finish() {
    if (done) return;
    done = true;
    teardown();
    invalidatePrimarySessionCache();
    await onComplete();
  }

  function onMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) return;
    const data = event.data as { type?: string } | null;
    if (data?.type !== ANEMONE_BRIDGE_COMPLETE) return;
    void finish();
  }

  window.addEventListener("message", onMessage);
  iframe.src = url;
  document.body.appendChild(iframe);
}

function openAnemonePopup(
  url: string,
  onComplete: () => void | Promise<void>,
): void {
  invalidatePrimarySessionCache();

  const opened = window.open(url, POPUP_NAME, POPUP_FEATURES);
  if (!opened) {
    window.location.assign(url);
    return;
  }
  const bridgePopup = opened;

  let done = false;

  function cleanup() {
    window.removeEventListener("message", onMessage);
    window.clearInterval(pollTimer);
  }

  async function finish() {
    if (done) return;
    done = true;
    cleanup();
    try {
      bridgePopup.close();
    } catch {
      /* already closed */
    }
    invalidatePrimarySessionCache();
    await onComplete();
  }

  function onMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) return;
    const data = event.data as { type?: string } | null;
    if (data?.type !== ANEMONE_BRIDGE_COMPLETE) return;
    void finish();
  }

  const pollTimer = window.setInterval(() => {
    if (bridgePopup.closed) void finish();
  }, 400);

  window.addEventListener("message", onMessage);
}

/**
 * Opens primary platform sign-in in a popup. When the flow finishes, the popup
 * lands on /account/contact/bridge-return and notifies the opener.
 */
export function openAnemoneBridgeFlow(
  url: string,
  onComplete: () => void | Promise<void>,
): void {
  openAnemonePopup(url, onComplete);
}

function isBridgeConnectOrDisconnectUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return path.startsWith("/connect") || path.startsWith("/disconnect");
  } catch {
    return url.includes("/connect") || url.includes("/disconnect");
  }
}

/** Sign-in uses a popup; connect/disconnect use a hidden iframe; settings use a new tab. */
export function runAnemoneBridge(
  url: string,
  onComplete: () => void | Promise<void>,
): void {
  if (isBridgeSignInUrl(url)) {
    openAnemoneBridgeFlow(url, onComplete);
    return;
  }
  if (isBridgeConnectOrDisconnectUrl(url)) {
    runAnemoneBridgeInHiddenFrame(url, onComplete);
    return;
  }
  openPrimarySettingsTab(url);
  void onComplete();
}
