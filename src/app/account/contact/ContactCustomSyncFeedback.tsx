"use client";

import {
  contactSyncStateFromPrimaryBatch,
  type ContactSyncDisplayState,
} from "next-address-server-js/embed";
import { NextAddressSyncCard } from "next-address-server-js/ui";
import { useMemo } from "react";
import type { ContactPrimaryResult } from "./types";

type Props = {
  primary: ContactPrimaryResult | null;
  saving: boolean;
  onRetry: () => void | Promise<unknown>;
};

export function ContactCustomSyncFeedback({ primary, saving, onRetry }: Props) {
  const syncState = useMemo((): ContactSyncDisplayState => {
    if (saving) return { status: "syncing" };
    if (!primary) return { status: "idle" };
    return contactSyncStateFromPrimaryBatch(primary.results, primary.attemptedPrimary);
  }, [primary, saving]);

  if (syncState.status === "idle") return null;

  return (
    <div className="space-y-3">
      <NextAddressSyncCard
        state={syncState}
        onRetry={() => void onRetry()}
        retryDisabled={saving}
      />
      {primary?.savedLocally && primary.attemptedPrimary && !primary.syncedToNextAddress ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-xs text-[var(--muted)]">
          Your edits were saved in Paws and Tails. Use the sync status above for NextAddress
          error details or try again.
        </p>
      ) : null}
    </div>
  );
}
