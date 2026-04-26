export function getTenantId() {
  return process.env.NEXT_ADDRESS_TENANT_ID?.trim() || "demo-tenant";
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
