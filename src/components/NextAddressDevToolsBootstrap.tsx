"use client";

import { useEffect } from "react";
import { armIntegrationSimulationScenario } from "@/lib/integrations/armSimulationScenario";
import { getIntegrationNetworkLog } from "@/lib/integrations/integrationNetworkLog";
import { getIntegrationSimulationLog } from "@/lib/integrations/integrationSimulationLog";
import { isSimulationWidgetEnabled } from "@/lib/config";
import "next-address-server-js/embed/widget.css";

export function NextAddressDevToolsBootstrap() {
  useEffect(() => {
    if (!isSimulationWidgetEnabled()) return;

    let launcher: { destroy: () => void } | null = null;
    let cancelled = false;

    void import("next-address-server-js/embed").then(
      ({ createNextAddressDevToolsLauncher, enableNextAddressDebugMode }) => {
        if (cancelled) return;
        enableNextAddressDebugMode();
        launcher = createNextAddressDevToolsLauncher({
          simulation: {
            actions: { armScenario: armIntegrationSimulationScenario },
            eventLog: getIntegrationSimulationLog(),
          },
          networkActivity: {
            log: getIntegrationNetworkLog(),
            maxEntries: 40,
          },
        });
      },
    );

    return () => {
      cancelled = true;
      launcher?.destroy();
    };
  }, []);

  return null;
}
