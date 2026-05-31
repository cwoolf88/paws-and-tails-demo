"use client";

import { useTenantConnection } from "@/lib/integrations/useTenantConnection";

/** Default packaged-style connection card (used outside the contact tab comparison). */
export function TenantConnectionToggle() {
  const {
    info,
    linked,
    signedIntoPrimary,
    primaryEmail,
    loading,
    statusLoading,
    err,
    goToSignIn,
    goToConnect,
    goToDisconnect,
  } = useTenantConnection();

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading account status…</p>;
  }
  if (!info) {
    return <p className="text-sm text-red-600">{err ?? "Tenant connection unavailable."}</p>;
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 text-sm shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[var(--ink)]">NextAddress account</h2>
          <p className="mt-1 text-[var(--muted)]">
            {linked ? (
              <>Your Paws and Tails account is linked to NextAddress.</>
            ) : signedIntoPrimary ? (
              <>You are signed in to NextAddress. Link your account to sync contact updates.</>
            ) : (
              <>Sign in to NextAddress to link your account.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!info.mockMode ? (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                signedIntoPrimary
                  ? "bg-sky-100 text-sky-800"
                  : "bg-[var(--page)] text-[var(--muted)] ring-1 ring-[var(--border)]"
              }`}
            >
              {statusLoading
                ? "Checking sign-in…"
                : signedIntoPrimary
                  ? primaryEmail
                    ? `Signed in as ${primaryEmail}`
                    : "Signed in"
                  : "Not signed in"}
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              linked
                ? "bg-emerald-100 text-emerald-800"
                : "bg-[var(--page)] text-[var(--muted)] ring-1 ring-[var(--border)]"
            }`}
          >
            {linked ? "Connected" : "Not connected"}
            {info.mockMode ? " (mock)" : ""}
          </span>
        </div>
      </div>

      {err ? <p className="mt-3 text-red-600">{err}</p> : null}

      <div className="mt-4">
        {linked ? (
          <button
            type="button"
            disabled={!info.disconnectUrl || (!signedIntoPrimary && !info.disconnectSignInUrl)}
            onClick={goToDisconnect}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--page)] py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--accent-btn)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
          >
            {signedIntoPrimary ? "Unlink account" : "Sign in to unlink"}
          </button>
        ) : signedIntoPrimary ? (
          <button
            type="button"
            disabled={!info.connectUrl || statusLoading}
            onClick={goToConnect}
            className="btn-primary w-full rounded-xl py-2.5 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
          >
            Link account
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={!info.connectSignInUrl || statusLoading}
              onClick={goToSignIn}
              className="btn-primary w-full rounded-xl py-2.5 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
            >
              Sign in
            </button>
            {!info.connectSignInUrl ? (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Set NEXT_ADDRESS_PRIMARY_BASE_URL to enable sign-in.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
