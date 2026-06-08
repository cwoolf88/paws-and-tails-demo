"use client";

import { useEffect, useRef } from "react";
import { createNextAddressNetworkActivityWidget } from "next-address-server-js/embed";
import { getIntegrationNetworkLog } from "@/lib/integrations/integrationNetworkLog";
import "next-address-server-js/embed/widget.css";

export function ContactNetworkActivityPanel() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const widget = createNextAddressNetworkActivityWidget({
      mount,
      log: getIntegrationNetworkLog(),
      injectStyles: true,
      maxEntries: 40,
      defaultExpanded: false,
    });

    return () => widget.destroy();
  }, []);

  return <div ref={mountRef} />;
}
