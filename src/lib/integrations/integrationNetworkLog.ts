"use client";

import { NetworkActivityLog } from "next-address-server-js/embed";

let browserLog: NetworkActivityLog | null = null;

export function getIntegrationNetworkLog(): NetworkActivityLog {
  if (!browserLog) {
    browserLog = new NetworkActivityLog();
  }
  return browserLog;
}
