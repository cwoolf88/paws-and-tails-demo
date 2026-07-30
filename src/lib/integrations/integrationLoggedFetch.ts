"use client";

import { loggedFetch } from "anemone-server-js/embed";
import { getIntegrationNetworkLog } from "@/lib/integrations/integrationNetworkLog";
import { getIntegrationSimulationLog } from "@/lib/integrations/integrationSimulationLog";

export function integrationLoggedFetch(
  label: string,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return loggedFetch(input, init, {
    label,
    log: getIntegrationNetworkLog(),
    eventLog: getIntegrationSimulationLog(),
  });
}
