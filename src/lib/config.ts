export const TENANT_NAME = "Paws and Tails";

export const PLATFORM_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Anemone";

export const platformBrand = {
  productName: PLATFORM_NAME,
} as const;

export function getPrimaryBaseUrl() {
  return process.env.ANEMONE_PRIMARY_BASE_URL?.trim().replace(/\/$/, "") ?? "";
}

export function getPrimarySignInUrl(redirectUrl?: string) {
  const base = getPrimaryBaseUrl();
  if (!base) return "";
  if (!redirectUrl) return `${base}/sign-in`;
  return `${base}/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;
}

function demoBaseUrl() {
  return (
    process.env.ANEMONE_DEMO_BASE_URL?.trim().replace(/\/$/, "") ||
    "http://127.0.0.1:3001"
  );
}

/** Full contact page (legacy / non-popup flows). */
export function getAnemoneConnectionReturnUrl() {
  const explicit = process.env.ANEMONE_CONNECT_RETURN_URL?.trim();
  if (explicit) return explicit;
  return `${demoBaseUrl()}/account/contact`;
}

/** Minimal page that closes the bridge popup and refreshes the opener widget only. */
export function getAnemoneConnectionBridgeReturnUrl() {
  return `${demoBaseUrl()}/account/contact/bridge-return`;
}

export function getWebhookSecret() {
  return process.env.ANEMONE_WEBHOOK_SECRET?.trim() ?? "";
}

export function getUpdatePath() {
  return process.env.ANEMONE_UPDATE_PATH?.trim() || "/api/v1/contacts/update";
}

export function isPrimaryMockMode() {
  if (process.env.ANEMONE_USE_MOCK === "1") return true;
  if (!process.env.ANEMONE_PRIMARY_BASE_URL?.trim()) return true;
  if (!process.env.ANEMONE_API_KEY?.trim()) return true;
  return false;
}

/** When mock primary is on: set to 1 to cycle idempotency-keyed demo outcomes (OK / pending / rejected). */
export function isMockRotatingOutcomes() {
  return process.env.ANEMONE_MOCK_ROTATE_OUTCOMES === "1";
}

/** Dev tools (simulation + network activity panels). On in development unless explicitly disabled. */
export function isSimulationWidgetEnabled() {
  const flag = process.env.NEXT_PUBLIC_SHOW_ANEMONE_SIMULATIONS?.trim();
  if (flag === "0") return false;
  if (flag === "1") return true;
  return process.env.NODE_ENV === "development";
}
