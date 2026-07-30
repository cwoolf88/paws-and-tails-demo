import { AnemoneClient } from "anemone-server-js";
import { getUpdatePath, isPrimaryMockMode } from "@/lib/config";

export function getAnemoneClientOrNull() {
  if (isPrimaryMockMode()) return null;
  const baseUrl = process.env.ANEMONE_PRIMARY_BASE_URL!.replace(/\/$/, "");
  const apiKey = process.env.ANEMONE_API_KEY!.trim();
  return new AnemoneClient({
    baseUrl,
    apiKey,
    allowInsecureLocalhost: true,
  });
}

export function getContactUpdatePath() {
  return getUpdatePath();
}
