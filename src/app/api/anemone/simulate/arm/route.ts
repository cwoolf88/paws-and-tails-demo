import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/users";
import { armTenantSimulation } from "@/lib/integrations/tenantSimulationArms";
import {
  createServerNetworkCollector,
  getAnemoneClientWithNetworkLog,
} from "@/lib/integrations/serverNetworkLog";
import {
  isIntegrationSimulationScenario,
  isTenantLocalSimulationScenario,
} from "anemone-server-js";
import type { ArmIntegrationSimulationResponse } from "anemone-server-js";
import { PLATFORM_NAME } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = getUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as {
    scenario?: unknown;
  } | null;
  const scenario = body?.scenario;
  if (!isIntegrationSimulationScenario(scenario)) {
    return NextResponse.json({ error: "Unknown simulation scenario" }, { status: 400 });
  }

  const networkActivity = createServerNetworkCollector();

  if (isTenantLocalSimulationScenario(scenario)) {
    const armed = armTenantSimulation(user.id, scenario);
    const response: ArmIntegrationSimulationResponse = {
      status: "armed",
      scenario,
      message: armed.message,
      hint: armed.hint,
    };
    return NextResponse.json({ ...response, networkActivity: [] });
  }

  const client = getAnemoneClientWithNetworkLog(networkActivity);
  if (!client) {
    if (scenario === "security_hold") {
      return NextResponse.json(
        {
          error: `Security hold simulation requires a live ${PLATFORM_NAME} primary connection.`,
        },
        { status: 503 },
      );
    }
    const armed = armTenantSimulation(user.id, "network_error");
    return NextResponse.json({
      status: "armed",
      scenario,
      message: armed.message,
      hint: armed.hint,
      networkActivity,
    } satisfies ArmIntegrationSimulationResponse & {
      networkActivity: typeof networkActivity;
    });
  }

  try {
    const result = await client.armIntegrationSimulation({
      externalUserId: user.id,
      scenario,
    });
    return NextResponse.json({ ...result, networkActivity });
  } catch (e) {
    const message =
      e instanceof Error && e.message === "Invalid JSON in response"
        ? `${PLATFORM_NAME} primary returned a non-JSON response. Ensure partner API routes (including /api/v1/simulate/arm) are exempt from session auth on primary.`
        : e instanceof Error
          ? e.message
          : "Simulation failed";
    return NextResponse.json({ error: message, networkActivity }, { status: 502 });
  }
}
