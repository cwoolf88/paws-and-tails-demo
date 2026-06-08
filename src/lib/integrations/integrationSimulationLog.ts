"use client";

import { SimulationEventLog } from "next-address-server-js/embed";

let browserLog: SimulationEventLog | null = null;

export function getIntegrationSimulationLog(): SimulationEventLog {
  if (!browserLog) {
    browserLog = new SimulationEventLog();
  }
  return browserLog;
}
