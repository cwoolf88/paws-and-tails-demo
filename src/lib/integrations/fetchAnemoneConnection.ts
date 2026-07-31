import type { TenantConnectionInfo } from "anemone-server-js/embed";
import { integrationLoggedFetch } from "@/lib/integrations/integrationLoggedFetch";
import { PLATFORM_NAME, TENANT_NAME } from "@/lib/config";

export async function fetchAnemoneConnection(): Promise<TenantConnectionInfo> {
  const r = await integrationLoggedFetch("Load connection info", "/api/anemone/connection");
  if (r.status === 401) {
    throw new Error(`Sign in to ${TENANT_NAME} to manage your ${PLATFORM_NAME} connection.`);
  }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `Could not load ${PLATFORM_NAME} connection info.`);
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
