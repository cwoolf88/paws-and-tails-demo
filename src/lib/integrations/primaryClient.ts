import { NextAddressClient } from "next-address-server-js";
import { getUpdatePath, isPrimaryMockMode } from "@/lib/config";

export function getNextAddressClientOrNull() {
  if (isPrimaryMockMode()) return null;
  const baseUrl = process.env.NEXT_ADDRESS_PRIMARY_BASE_URL!.replace(/\/$/, "");
  const apiKey = process.env.NEXT_ADDRESS_API_KEY!.trim();
  return new NextAddressClient({
    baseUrl,
    apiKey,
    allowInsecureLocalhost: true,
  });
}

export function getContactUpdatePath() {
  return getUpdatePath();
}
