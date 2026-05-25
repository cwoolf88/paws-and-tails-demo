"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  invalidatePrimarySessionCache,
  probePrimaryClerkSession,
} from "@/lib/integrations/primarySession";

type ConnectionInfo = {
  tenantId: string;
  externalUserId: string;
  returnUrl: string;
  primaryBaseUrl: string | null;
  connectUrl: string | null;
  disconnectUrl: string | null;
  connectSignInUrl: string | null;
  disconnectSignInUrl: string | null;
  mockMode: boolean;
};

const VISIBILITY_REFRESH_MS = 2_000;

export function TenantConnectionToggle() {
  const [info, setInfo] = useState<ConnectionInfo | null>(null);
  const [linked, setLinked] = useState(false);
  const [signedIntoPrimary, setSignedIntoPrimary] = useState(false);
  const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const infoRef = useRef<ConnectionInfo | null>(null);

  const applyStatus = useCallback((status: Awaited<ReturnType<typeof probePrimaryClerkSession>>) => {
    setLinked(status.linked);
    setSignedIntoPrimary(status.signedIn);
    setPrimaryEmail(status.email);
  }, []);

  const refreshClerkStatus = useCallback(
    async (connection: ConnectionInfo, force = false) => {
      if (connection.mockMode || !connection.primaryBaseUrl) {
        setLinked(false);
        setSignedIntoPrimary(connection.mockMode);
        setPrimaryEmail(null);
        return;
      }
      setStatusLoading(true);
      try {
        const status = await probePrimaryClerkSession(
          connection.primaryBaseUrl,
          connection.tenantId,
          connection.externalUserId,
          { force },
        );
        applyStatus(status);
      } finally {
        setStatusLoading(false);
      }
    },
    [applyStatus],
  );

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const r = await fetch("/api/tenant/connection");
    if (r.status === 401) {
      setErr("Sign in to the demo app to manage your NextAddress link.");
      setLoading(false);
      return;
    }
    if (!r.ok) {
      setErr("Could not load tenant connection info.");
      setLoading(false);
      return;
    }
    const d = (await r.json()) as ConnectionInfo;
    setInfo(d);
    infoRef.current = d;
    setLoading(false);
    await refreshClerkStatus(d);
  }, [refreshClerkStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const connection = infoRef.current;
      if (!connection) return;
      const hiddenFor = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
      hiddenAtRef.current = null;
      if (hiddenFor < VISIBILITY_REFRESH_MS) return;
      invalidatePrimarySessionCache();
      void refreshClerkStatus(connection, true);
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshClerkStatus]);

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading NextAddress connection…</p>;
  }
  if (!info) {
    return <p className="text-sm text-red-600">{err ?? "Tenant connection unavailable."}</p>;
  }

  function goToSignIn() {
    if (!info?.connectSignInUrl) return;
    invalidatePrimarySessionCache();
    window.location.assign(info.connectSignInUrl);
  }

  function goToConnect() {
    if (!info?.connectUrl || !signedIntoPrimary) return;
    invalidatePrimarySessionCache();
    window.location.assign(info.connectUrl);
  }

  function goToDisconnect() {
    if (!info?.disconnectUrl) return;
    if (!signedIntoPrimary) {
      if (info.disconnectSignInUrl) window.location.assign(info.disconnectSignInUrl);
      return;
    }
    invalidatePrimarySessionCache();
    window.location.assign(info.disconnectUrl);
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 text-sm shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[var(--ink)]">Link to NextAddress</h2>
          <p className="mt-1 text-[var(--muted)]">
            {linked ? (
              <>
                Linked on NextAddress for tenant{" "}
                <code className="rounded bg-[var(--page)] px-1 py-0.5 text-xs">{info.tenantId}</code>{" "}
                as{" "}
                <code className="rounded bg-[var(--page)] px-1 py-0.5 text-xs">
                  {info.externalUserId}
                </code>
                .
              </>
            ) : signedIntoPrimary ? (
              <>
                Signed in to NextAddress via Clerk — ready to connect as{" "}
                <code className="rounded bg-[var(--page)] px-1 py-0.5 text-xs">
                  {info.externalUserId}
                </code>
                .
              </>
            ) : (
              <>Sign in on NextAddress to link this demo account.</>
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
                ? "Checking NextAddress…"
                : signedIntoPrimary
                  ? primaryEmail
                    ? `NextAddress: ${primaryEmail}`
                    : "Signed in to NextAddress"
                  : "Not signed in to NextAddress"}
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              linked
                ? "bg-emerald-100 text-emerald-800"
                : "bg-[var(--page)] text-[var(--muted)] ring-1 ring-[var(--border)]"
            }`}
          >
            {linked ? "Linked" : "Not linked"}
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
            className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--page)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
          >
            {signedIntoPrimary ? "Disconnect on NextAddress" : "Sign in to disconnect"}
          </button>
        ) : signedIntoPrimary ? (
          <button
            type="button"
            disabled={!info.connectUrl || statusLoading}
            onClick={goToConnect}
            className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
          >
            Connect to NextAddress
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={!info.connectSignInUrl || statusLoading}
              onClick={goToSignIn}
              className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
            >
              Sign in to NextAddress
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
