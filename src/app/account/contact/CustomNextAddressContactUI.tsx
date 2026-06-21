"use client";

import {
  contactSyncStateFromPrimaryBatch,
  injectWidgetStyles,
  renderSyncBlock,
  sessionPollRefreshLabel,
} from "next-address-server-js/embed";
import { useNextAddressConnection } from "@/lib/integrations/useNextAddressConnection";
import { useEffect, useRef } from "react";
import type { ContactPrimaryResult } from "./types";

const APP_NAME = "Paws and Tails";

type Props = {
  primary: ContactPrimaryResult | null;
  saving: boolean;
  onSaveContact: () => Promise<ContactPrimaryResult | null>;
};

function connectionSubtitle(
  connected: boolean,
  signedIntoPrimary: boolean,
  appName: string,
): string {
  const app = appName || "your app";
  if (connected) {
    return `Contact updates from ${app} sync through your shared NextAddress profile.`;
  }
  if (signedIntoPrimary) {
    return `Connect ${app} to keep your address and contact info in sync across partners.`;
  }
  return `One address profile for everywhere you shop—sign in to connect ${app}.`;
}

function connectionStatusTooltip(
  connected: boolean,
  statusLoading: boolean,
  mockMode: boolean,
): string {
  if (statusLoading) {
    return "Checking connection status with NextAddress…";
  }
  if (connected) {
    return mockMode
      ? "Connected (mock). Changes you save sync to your NextAddress profile."
      : "Connected. Changes you save in this app sync to your NextAddress profile.";
  }
  return mockMode
    ? "Not connected (mock). Connect to sync contact and address updates."
    : "Not connected. Connect to send contact and address updates to NextAddress.";
}

function ConnectionStatusIcon({
  connected,
  statusLoading,
  mockMode,
}: {
  connected: boolean;
  statusLoading: boolean;
  mockMode: boolean;
}) {
  const tooltip = connectionStatusTooltip(connected, statusLoading, mockMode);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full p-1.5 ${
        statusLoading
          ? "bg-sky-50 text-sky-600"
          : connected
            ? "bg-emerald-50 text-emerald-700"
            : "bg-[var(--page)] text-[var(--muted)]"
      }`}
      tabIndex={0}
      role="status"
      title={tooltip}
      aria-label={tooltip}
    >
      {statusLoading ? (
        <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
          <span className="absolute h-4 w-4 animate-ping rounded-full bg-sky-300/60" />
          <span className="relative h-2 w-2 rounded-full bg-sky-500" />
        </span>
      ) : (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </span>
  );
}

function SettingsGearButton({
  signedIntoPrimary,
  statusLoading,
  onClick,
}: {
  signedIntoPrimary: boolean;
  statusLoading: boolean;
  onClick: () => void;
}) {
  const label = signedIntoPrimary
    ? "Manage your addresses in NextAddress"
    : "Sign in to manage your addresses in NextAddress";

  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--page)] text-[var(--muted)] shadow-sm hover:bg-white hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={label}
      title={label}
      disabled={!signedIntoPrimary || statusLoading}
      onClick={onClick}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}

function ConnectionLoadingSkeleton() {
  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 text-sm shadow"
      aria-busy="true"
      aria-label="NextAddress"
    >
      <div className="animate-pulse space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-[var(--page)]" />
            <div className="h-4 w-full max-w-sm rounded bg-[var(--page)]" />
          </div>
          <div className="h-7 w-7 rounded-full bg-[var(--page)]" />
        </div>
        <div className="h-9 w-32 rounded-full bg-[var(--page)]" />
        <div className="h-10 w-full rounded-xl bg-[var(--page)]" />
      </div>
      <span className="sr-only">Loading NextAddress…</span>
    </section>
  );
}

export function CustomNextAddressContactUI({ primary, saving, onSaveContact }: Props) {
  const {
    info,
    connected,
    signedIntoPrimary,
    primaryEmail,
    loading,
    statusLoading,
    err,
    syncState,
    syncBusy,
    sessionPoll,
    isSessionPollRefreshVisible,
    retryConnectSession,
    goToConnectAccount,
    goToDisconnect,
    goToSettings,
    setSyncState,
    bindSyncRetry,
    sync,
  } = useNextAddressConnection({ enableSync: true });
  const syncMountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    injectWidgetStyles();
  }, []);

  useEffect(() => {
    bindSyncRetry(async () => {
      await onSaveContact();
    });
  }, [bindSyncRetry, onSaveContact]);

  useEffect(() => {
    if (saving) {
      setSyncState({ status: "syncing" });
      return;
    }
    if (!primary) {
      setSyncState({ status: "idle" });
      return;
    }
    setSyncState(contactSyncStateFromPrimaryBatch(primary.results, primary.attemptedPrimary));
  }, [primary, saving, setSyncState]);

  useEffect(() => {
    const mount = syncMountRef.current;
    if (!mount) return;
    renderSyncBlock(mount, syncState, {
      onRetry: () => void sync(),
      retryDisabled: syncBusy || saving,
    });
  }, [syncState, syncBusy, saving, sync]);

  if (loading) {
    return <ConnectionLoadingSkeleton />;
  }

  if (!info) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {err ?? "NextAddress connection unavailable."}
      </p>
    );
  }

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 text-sm shadow"
      aria-label="NextAddress"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-[var(--ink)]">NextAddress</h2>
          <p className="mt-1 text-[var(--muted)]">
            {connectionSubtitle(connected, signedIntoPrimary, APP_NAME)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ConnectionStatusIcon
            connected={connected}
            statusLoading={statusLoading}
            mockMode={info.mockMode}
          />
          {isSessionPollRefreshVisible() ? (
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--page)] text-[var(--muted)] shadow-sm hover:bg-white hover:text-[var(--ink)]"
              aria-label={sessionPollRefreshLabel(sessionPoll.phase)}
              title={sessionPollRefreshLabel(sessionPoll.phase)}
              onClick={() => void retryConnectSession()}
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {!info.mockMode && signedIntoPrimary ? (
        <span className="mt-3 inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
          {primaryEmail ? `Signed in as ${primaryEmail}` : "Signed in"}
        </span>
      ) : null}

      {err ? (
        <p className="mt-3 text-red-600" role="alert">
          {err}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {connected ? (
            <button
              type="button"
              disabled={!info.disconnectUrl || (!signedIntoPrimary && !info.disconnectSignInUrl)}
              onClick={goToDisconnect}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--page)] py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--accent-btn)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
            >
              {!signedIntoPrimary && info.disconnectSignInUrl
                ? "Sign in to disconnect"
                : "Disconnect account"}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={
                  (signedIntoPrimary ? !info.connectUrl : !info.connectSignInUrl) ||
                  statusLoading
                }
                onClick={goToConnectAccount}
                className="btn-primary w-full rounded-xl py-2.5 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
              >
                Connect account
              </button>
              {!info.connectSignInUrl ? (
                <p className="text-xs text-[var(--muted)]">
                  Set NEXT_ADDRESS_PRIMARY_BASE_URL to enable sign-in.
                </p>
              ) : null}
            </>
          )}
        </div>

        {info.primaryBaseUrl && !info.mockMode && signedIntoPrimary ? (
          <SettingsGearButton
            signedIntoPrimary={signedIntoPrimary}
            statusLoading={statusLoading}
            onClick={goToSettings}
          />
        ) : null}
      </div>

      <div ref={syncMountRef} className="na-widget-host" />

      {primary?.savedLocally && primary.attemptedPrimary && !primary.syncedToNextAddress ? (
        <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-xs text-[var(--muted)]">
          Your edits were saved in Paws and Tails. See sync status above for NextAddress error
          details or try again.
        </p>
      ) : null}
    </section>
  );
}
