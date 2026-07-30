"use client";

import { useEffect } from "react";
import { ANEMONE_BRIDGE_COMPLETE } from "@/lib/integrations/primaryBridgePopup";

export default function BridgeReturnPage() {
  useEffect(() => {
    const message = { type: ANEMONE_BRIDGE_COMPLETE };
    const origin = window.location.origin;

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, origin);
      window.close();
      return;
    }

    if (window.parent !== window) {
      window.parent.postMessage(message, origin);
      return;
    }

    window.location.replace("/account/contact");
  }, []);

  return (
    <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
      Finishing… you can close this window.
    </p>
  );
}
