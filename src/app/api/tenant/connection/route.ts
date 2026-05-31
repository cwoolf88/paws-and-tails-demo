import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import {
  getPrimaryBaseUrl,
  getTenantConnectionBridgeReturnUrl,
  getTenantConnectionReturnUrl,
  isPrimaryMockMode,
} from "@/lib/config";
import { getUserById } from "@/lib/db/users";
import {
  buildPrimaryConnectSignInUrl,
  buildPrimaryConnectUrl,
  buildPrimaryDisconnectSignInUrl,
  buildPrimaryDisconnectUrl,
} from "@/lib/integrations/tenantConnectionUrls";

export const runtime = "nodejs";

export async function GET() {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = getUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const primaryBaseUrl = getPrimaryBaseUrl();
  const returnUrl = getTenantConnectionBridgeReturnUrl();
  const pageReturnUrl = getTenantConnectionReturnUrl();
  const tenantId = user.tenantId;
  const externalUserId = user.id;

  const connectUrl = primaryBaseUrl
    ? buildPrimaryConnectUrl(primaryBaseUrl, tenantId, externalUserId, returnUrl)
    : null;
  const disconnectUrl = primaryBaseUrl
    ? buildPrimaryDisconnectUrl(primaryBaseUrl, tenantId, returnUrl)
    : null;
  const connectSignInUrl = primaryBaseUrl
    ? buildPrimaryConnectSignInUrl(primaryBaseUrl, tenantId, externalUserId, returnUrl)
    : null;
  const disconnectSignInUrl = primaryBaseUrl
    ? buildPrimaryDisconnectSignInUrl(primaryBaseUrl, tenantId, returnUrl)
    : null;

  return NextResponse.json({
    tenantId,
    externalUserId,
    returnUrl: pageReturnUrl,
    bridgeReturnUrl: returnUrl,
    primaryBaseUrl: primaryBaseUrl || null,
    connectUrl,
    disconnectUrl,
    connectSignInUrl,
    disconnectSignInUrl,
    mockMode: isPrimaryMockMode(),
  });
}
