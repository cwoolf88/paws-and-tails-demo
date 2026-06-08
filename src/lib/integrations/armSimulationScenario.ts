import type {
  ArmIntegrationSimulationResponse,
  IntegrationSimulationScenario,
} from "next-address-server-js";
import { integrationLoggedFetch } from "@/lib/integrations/integrationLoggedFetch";

export async function armIntegrationSimulationScenario(
  scenario: IntegrationSimulationScenario,
): Promise<ArmIntegrationSimulationResponse> {
  const r = await integrationLoggedFetch("Arm simulation", "/api/next-address/simulate/arm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  const data = (await r.json().catch(() => ({}))) as ArmIntegrationSimulationResponse & {
    error?: string;
  };
  if (!r.ok) {
    throw new Error(data.error ?? "Simulation request failed");
  }
  return data;
}
