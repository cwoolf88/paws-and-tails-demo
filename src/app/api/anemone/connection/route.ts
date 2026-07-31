import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import {
  getAnemoneConnectionBridgeReturnUrl,
  getAnemoneConnectionReturnUrl,
  getPrimaryBaseUrl,
  isPrimaryMockMode,
} from "@/lib/config";
import { getUserById } from "@/lib/db/users";
import {
  buildConnectExternalUserIdForUser,
  buildPrimaryConnectSignInUrlFromToken,
  buildPrimaryConnectUrlFromToken,
  buildPrimaryDisconnectSignInUrlFromToken,
  buildPrimaryDisconnectUrlFromToken,
} from "@/lib/integrations/anemoneConnectionUrls";
import {
  createServerNetworkCollector,
  getAnemoneClientWithNetworkLog,
} from "@/lib/integrations/serverNetworkLog";
import { getAnemoneClientOrNull } from "@/lib/integrations/primaryClient";
import {
  simulationEventsFromConsume,
  type NetworkActivityExchange,
} from "anemone-server-js/embed";
import {
  consumeTenantSimulation,
  tenantSimulationConnectionFetchError,
} from "@/lib/integrations/tenantSimulationArms";

export const runtime = "nodejs";

async function resolveConnectExternalUserId(
  externalUserId: string,
  signingSecret: string,
  primaryBaseUrl: string,
  networkActivity?: NetworkActivityExchange[],
): Promise<string | null> {
  const client =
    networkActivity != null
      ? getAnemoneClientWithNetworkLog(networkActivity)
      : getAnemoneClientOrNull();
  if (client) {
    try {
      const { linkToken } = await client.mintDirectConnectToken({ externalUserId });
      return linkToken;
    } catch {
      // Fall through to locally signed token for dev/mock.
    }
  }
  if (!signingSecret || !primaryBaseUrl) return null;
  return buildConnectExternalUserIdForUser(externalUserId, signingSecret);
}

export async function GET() {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = getUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const connectionSim = consumeTenantSimulation(user.id, "connection_fetch");
  if (connectionSim) {
    const message = tenantSimulationConnectionFetchError(connectionSim).message;
    return NextResponse.json(
      {
        error: message,
        simulationEvents: simulationEventsFromConsume(
          connectionSim,
          "connection_fetch",
          message,
          503,
        ),
      },
      { status: 503 },
    );
  }

  const primaryBaseUrl = getPrimaryBaseUrl();
  const returnUrl = getAnemoneConnectionBridgeReturnUrl();
  const pageReturnUrl = getAnemoneConnectionReturnUrl();
  const externalUserId = user.id;
  const signingSecret = process.env.ANEMONE_WEBHOOK_SECRET?.trim() ?? "";

  const networkActivity = createServerNetworkCollector();
  const connectExternalUserId = primaryBaseUrl
    ? await resolveConnectExternalUserId(
        externalUserId,
        signingSecret,
        primaryBaseUrl,
        networkActivity,
      )
    : null;

  const connectUrl =
    primaryBaseUrl && connectExternalUserId
      ? buildPrimaryConnectUrlFromToken(
          primaryBaseUrl,
          connectExternalUserId,
          returnUrl,
          user.email,
        )
      : null;
  const disconnectUrl =
    primaryBaseUrl && connectExternalUserId
      ? buildPrimaryDisconnectUrlFromToken(primaryBaseUrl, connectExternalUserId, returnUrl)
      : null;
  const connectSignInUrl =
    primaryBaseUrl && connectExternalUserId
      ? buildPrimaryConnectSignInUrlFromToken(
          primaryBaseUrl,
          connectExternalUserId,
          returnUrl,
          user.email,
        )
      : null;
  const disconnectSignInUrl =
    primaryBaseUrl && connectExternalUserId
      ? buildPrimaryDisconnectSignInUrlFromToken(primaryBaseUrl, connectExternalUserId, returnUrl)
      : null;

  return NextResponse.json({
    networkActivity,
    externalUserId,
    tenantUserEmail: user.email,
    connectExternalUserId: connectExternalUserId ?? externalUserId,
    linkExternalUserId: connectExternalUserId,
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
