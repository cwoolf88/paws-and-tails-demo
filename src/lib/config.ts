export function getTenantId() {
  return process.env.NEXT_ADDRESS_TENANT_ID?.trim() || "demo-tenant";
}

export function getPrimaryBaseUrl() {
  return process.env.NEXT_ADDRESS_PRIMARY_BASE_URL?.trim().replace(/\/$/, "") ?? "";
}

export function getPrimarySignInUrl(redirectUrl?: string) {
  const base = getPrimaryBaseUrl();
  if (!base) return "";
  if (!redirectUrl) return `${base}/sign-in`;
  return `${base}/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;
}

function demoBaseUrl() {
  return (
    process.env.NEXT_ADDRESS_DEMO_BASE_URL?.trim().replace(/\/$/, "") ||
    "http://127.0.0.1:3001"
  );
}

/** Full contact page (legacy / non-popup flows). */
export function getTenantConnectionReturnUrl() {
  const explicit = process.env.NEXT_ADDRESS_CONNECT_RETURN_URL?.trim();
  if (explicit) return explicit;
  return `${demoBaseUrl()}/account/contact`;
}

/** Minimal page that closes the bridge popup and refreshes the opener widget only. */
export function getTenantConnectionBridgeReturnUrl() {
  return `${demoBaseUrl()}/account/contact/bridge-return`;
}

export function getWebhookSecret() {
  return process.env.NEXT_ADDRESS_WEBHOOK_SECRET?.trim() ?? "";
}

export function getUpdatePath() {
  return process.env.NEXT_ADDRESS_UPDATE_PATH?.trim() || "/api/v1/contacts/update";
}

export function isPrimaryMockMode() {
  if (process.env.NEXT_ADDRESS_USE_MOCK === "1") return true;
  if (!process.env.NEXT_ADDRESS_PRIMARY_BASE_URL?.trim()) return true;
  if (!process.env.NEXT_ADDRESS_API_KEY?.trim()) return true;
  return false;
}

/** When mock primary is on: set to 1 to cycle idempotency-keyed demo outcomes (OK / pending / rejected). */
export function isMockRotatingOutcomes() {
  return process.env.NEXT_ADDRESS_MOCK_ROTATE_OUTCOMES === "1";
}
