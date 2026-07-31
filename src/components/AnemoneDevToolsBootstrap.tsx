"use client";

import { useEffect } from "react";
import { armIntegrationSimulationScenario } from "@/lib/integrations/armSimulationScenario";
import { getIntegrationNetworkLog } from "@/lib/integrations/integrationNetworkLog";
import { getIntegrationSimulationLog } from "@/lib/integrations/integrationSimulationLog";
import { isSimulationWidgetEnabled, PLATFORM_NAME } from "@/lib/config";
import "anemone-server-js/embed/widget.css";

export function AnemoneDevToolsBootstrap() {
  useEffect(() => {
    if (!isSimulationWidgetEnabled()) return;

    let launcher: { destroy: () => void } | null = null;
    let cancelled = false;

    void import("anemone-server-js/embed").then(
      ({ createAnemoneDevToolsLauncher, enableAnemoneDebugMode }) => {
        if (cancelled) return;
        enableAnemoneDebugMode();
        launcher = createAnemoneDevToolsLauncher({
          productName: PLATFORM_NAME,
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
