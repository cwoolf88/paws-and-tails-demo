"use client";

import { useEffect, useRef } from "react";
import { createNextAddressSimulationWidget } from "next-address-server-js/embed";
import { armIntegrationSimulationScenario } from "@/lib/integrations/armSimulationScenario";
import { getIntegrationSimulationLog } from "@/lib/integrations/integrationSimulationLog";
import "next-address-server-js/embed/widget.css";

export function ContactSimulationPanel() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const widget = createNextAddressSimulationWidget({
      mount,
      actions: { armScenario: armIntegrationSimulationScenario },
      eventLog: getIntegrationSimulationLog(),
      injectStyles: true,
      defaultExpanded: false,
    });

    return () => widget.destroy();
  }, []);

  return <div ref={mountRef} />;
}
