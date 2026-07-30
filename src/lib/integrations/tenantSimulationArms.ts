import type { IntegrationSimulationScenario } from "anemone-server-js";
import { AnemoneError } from "anemone-server-js";
import { PLATFORM_NAME } from "@/lib/config";

export type TenantSimulationConsumeContext = "connection_fetch" | "contact_push";

const arms = new Map<string, IntegrationSimulationScenario>();

function armKey(userId: string, context: TenantSimulationConsumeContext): string {
  return `${userId}:${context}`;
}

export function armTenantSimulation(
  userId: string,
  scenario: IntegrationSimulationScenario,
): { message: string; hint: string } {
  if (scenario === "network_error") {
    arms.set(armKey(userId, "contact_push"), scenario);
    return {
      message: `Simulated failure: network connection lost while syncing to ${PLATFORM_NAME}.`,
      hint: "Save contact info in your app to trigger.",
    };
  }
  if (scenario === "connection_fetch_failure") {
    arms.set(armKey(userId, "connection_fetch"), scenario);
    return {
      message: `Simulated failure: could not load ${PLATFORM_NAME} connection info from your backend.`,
      hint: `Refresh the ${PLATFORM_NAME} widget or reload connection info to trigger.`,
    };
  }
  throw new Error(`Scenario ${scenario} is not handled locally on the tenant`);
}

export function consumeTenantSimulation(
  userId: string,
  context: TenantSimulationConsumeContext,
): IntegrationSimulationScenario | null {
  const key = armKey(userId, context);
  const scenario = arms.get(key);
  if (!scenario) return null;
  arms.delete(key);
  return scenario;
}

export function tenantSimulationContactPushError(
  scenario: IntegrationSimulationScenario,
): never {
  if (scenario === "network_error") {
    throw new AnemoneError(
      `Simulated failure: network connection lost while syncing to ${PLATFORM_NAME}.`,
      "TRANSPORT_ERROR",
    );
  }
  throw new AnemoneError("Simulated tenant contact push failure", "TRANSPORT_ERROR");
}

export function tenantSimulationConnectionFetchError(
  scenario: IntegrationSimulationScenario,
): Error {
  if (scenario === "connection_fetch_failure") {
    return new Error(
      `Simulated failure: could not load ${PLATFORM_NAME} connection info from your backend.`,
    );
  }
  return new Error("Simulated connection fetch failure");
}
