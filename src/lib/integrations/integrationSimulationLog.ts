"use client";

import { SimulationEventLog } from "anemone-server-js/embed";

let browserLog: SimulationEventLog | null = null;

export function getIntegrationSimulationLog(): SimulationEventLog {
  if (!browserLog) {
    browserLog = new SimulationEventLog();
  }
  return browserLog;
}
