"use client";

import {
  contactSyncStateFromPrimaryBatch,
  createNextAddressWidget,
  type NextAddressWidgetHandle,
} from "next-address-server-js/embed";
import { armIntegrationSimulationScenario } from "@/lib/integrations/armSimulationScenario";
import { fetchNextAddressConnection } from "@/lib/integrations/fetchNextAddressConnection";
import { runNextAddressBridge } from "@/lib/integrations/primaryBridgePopup";
import { useEffect, useRef } from "react";
import { ContactFormFields } from "./ContactFormFields";
import type { ContactFormValues, ContactPrimaryResult } from "./types";

type Props = {
  form: ContactFormValues;
  onFormChange: (values: ContactFormValues) => void;
  err: string | null;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  primary: ContactPrimaryResult | null;
  onSaveContact: () => Promise<ContactPrimaryResult | null>;
};

export function ContactBasicPanel({
  form,
  onFormChange,
  err,
  saving,
  onSubmit,
  primary,
  onSaveContact,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<NextAddressWidgetHandle | null>(null);
  const saveRef = useRef(onSaveContact);

  useEffect(() => {
    saveRef.current = onSaveContact;
  }, [onSaveContact]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const widget = createNextAddressWidget({
      mount,
      tenantName: "Paws and Tails",
      fetchConnection: () => fetchNextAddressConnection(),
      simulation: { armScenario: armIntegrationSimulationScenario },
      navigateToPrimary: (url, onComplete) => {
        runNextAddressBridge(url, async () => {
          await widgetRef.current?.refresh();
          await onComplete?.();
        });
      },
      theme: "default",
      sync: {
        initialState: { status: "idle" },
        onRetry: async () => {
          const result = await saveRef.current();
          if (result) {
            widget.setSyncState(
              contactSyncStateFromPrimaryBatch(result.results, result.attemptedPrimary),
            );
          }
        },
      },
    });
    widgetRef.current = widget;

    return () => {
      widget.destroy();
      widgetRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!primary || !widgetRef.current) return;
    widgetRef.current.setSyncState(
      contactSyncStateFromPrimaryBatch(primary.results, primary.attemptedPrimary),
    );
  }, [primary]);

  return (
    <div
      id="contact-panel-basic"
      role="tabpanel"
      aria-labelledby="contact-tab-basic"
      className="space-y-4"
    >
      <div ref={mountRef} />
      {primary?.savedLocally && primary.attemptedPrimary && !primary.syncedToNextAddress ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-xs text-[var(--muted)]">
          Your edits were saved in Paws and Tails. Use the sync widget above for NextAddress
          error details or try again.
        </p>
      ) : null}
      <ContactFormFields
        values={form}
        onChange={onFormChange}
        err={err}
        saving={saving}
        onSubmit={onSubmit}
      />
      <p className="text-xs text-[var(--muted)]">
        Connection and sync feedback use{" "}
        <code className="rounded bg-black/[0.04] px-1 py-0.5 font-mono text-[0.7rem]">
          createNextAddressWidget
        </code>{" "}
        from <code className="rounded bg-black/[0.04] px-1 py-0.5 font-mono text-[0.7rem]">next-address-server-js/embed</code>.
      </p>
    </div>
  );
}
