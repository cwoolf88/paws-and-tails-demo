/** Prefix embedded in signed connect tokens (falls back for local mock). */
export function getApiKeyPrefix() {
  const explicit = process.env.NEXT_ADDRESS_API_KEY_PREFIX?.trim();
  if (explicit) return explicit;
  const apiKey = process.env.NEXT_ADDRESS_API_KEY?.trim();
  if (apiKey) {
    const dot = apiKey.indexOf(".");
    if (dot > 0) return apiKey.slice(0, dot);
    const under = apiKey.indexOf("_");
    if (under > 0) return apiKey.slice(0, under);
  }
  return "demo";
}
