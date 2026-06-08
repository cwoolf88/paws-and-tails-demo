"use client";

import { useNextAddressConnection } from "@/lib/integrations/useNextAddressConnection";

/** Default packaged-style connection card (used outside the contact tab comparison). */
export function NextAddressConnectionToggle() {
  const {
    info,
    connected,
    signedIntoPrimary,
    primaryEmail,
    loading,
    statusLoading,
    err,
    goToConnectAccount,
    goToDisconnect,
    goToSettings,
  } = useNextAddressConnection();

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading NextAddress…</p>;
  }
  if (!info) {
    return <p className="text-sm text-red-600">{err ?? "NextAddress connection unavailable."}</p>;
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 text-sm shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[var(--ink)]">NextAddress</h2>
          <p className="mt-1 text-[var(--muted)]">
            {connected ? (
              <>Contact updates from Paws and Tails sync through your shared NextAddress profile.</>
            ) : signedIntoPrimary ? (
              <>Connect Paws and Tails to keep your address and contact info in sync across partners.</>
            ) : (
              <>One address profile for everywhere you shop—sign in to connect Paws and Tails.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!info.mockMode && signedIntoPrimary ? (
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
              {primaryEmail ? `Signed in as ${primaryEmail}` : "Signed in"}
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              connected
                ? "bg-emerald-100 text-emerald-800"
                : "bg-[var(--page)] text-[var(--muted)]"
            }`}
          >
            {statusLoading
              ? "Checking connection…"
              : connected
                ? "Connected"
                : "Not connected"}
            {info.mockMode ? " (mock)" : ""}
          </span>
        </div>
      </div>

      {err ? <p className="mt-3 text-red-600">{err}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1">
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
          )}
        </div>
        {info.primaryBaseUrl && !info.mockMode && signedIntoPrimary ? (
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--page)] text-[var(--muted)] shadow-sm hover:bg-white hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Manage your addresses in NextAddress"
            title="Manage your addresses in NextAddress"
            disabled={statusLoading}
            onClick={goToSettings}
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
        ) : null}
      </div>
      {!info.connectSignInUrl && !connected && !signedIntoPrimary ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Set NEXT_ADDRESS_PRIMARY_BASE_URL to enable sign-in.
        </p>
      ) : null}
    </div>
  );
}
