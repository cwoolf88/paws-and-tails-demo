import type { TenantConnectionInfo } from "next-address-server-js/embed";
import { integrationLoggedFetch } from "@/lib/integrations/integrationLoggedFetch";

export async function fetchNextAddressConnection(): Promise<TenantConnectionInfo> {
  const r = await integrationLoggedFetch("Load connection info", "/api/next-address/connection");
  if (r.status === 401) {
    throw new Error("Sign in to Paws and Tails to manage your NextAddress connection.");
  }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? "Could not load NextAddress connection info.");
  }
  const raw = (await r.json()) as TenantConnectionInfo & {
    linkExternalUserId?: string | null;
  };
  return {
    ...raw,
    connectExternalUserId:
      raw.connectExternalUserId ?? raw.linkExternalUserId ?? raw.externalUserId,
  };
}
