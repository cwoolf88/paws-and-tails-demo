"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { SignUpModal } from "@/components/SignUpModal";
import { PLATFORM_NAME } from "@/lib/config";
import {
  invalidatePrimarySessionCache,
  probePrimaryStaffGate,
} from "@/lib/integrations/primarySession";

type DemoUser = {
  id: string;
  fullName: string;
  email: string;
};

type StaffInfo = {
  anemoneUserId: string;
  role: string;
};

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [primaryBaseUrl, setPrimaryBaseUrl] = useState<string | null>(null);
  const [primarySignInUrl, setPrimarySignInUrl] = useState<string | null>(null);
  const [staffChecking, setStaffChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const next = sp.get("next") || "/account/contact";

  const loadOwnedUsers = useCallback(async () => {
    setLoading(true);
    const [usersRes, meRes] = await Promise.all([
      fetch("/api/auth/users"),
      fetch("/api/auth/me"),
    ]);
    if (usersRes.status === 401) {
      setStaff(null);
      setUsers([]);
      setLoading(false);
      return;
    }
    const usersData = (await usersRes.json()) as { users: DemoUser[] };
    const meData = (await meRes.json()) as { user: DemoUser | null };
    setUsers(
      usersData.users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
      })),
    );
    setCurrentUserId(meData.user?.id ?? null);
    setLoading(false);
  }, []);

  const establishStaffSession = useCallback(async () => {
    setStaffChecking(true);
    setErr(null);
    const metaRes = await fetch("/api/auth/staff-session");
    const meta = (await metaRes.json()) as {
      staff: StaffInfo | null;
      primaryBaseUrl: string | null;
      primarySignInUrl: string | null;
    };
    setPrimaryBaseUrl(meta.primaryBaseUrl);
    setPrimarySignInUrl(meta.primarySignInUrl);

    if (meta.staff) {
      setStaff(meta.staff);
      setStaffChecking(false);
      await loadOwnedUsers();
      return;
    }

    if (!meta.primaryBaseUrl) {
      setStaff(null);
      setStaffChecking(false);
      return;
    }

    invalidatePrimarySessionCache();
    const probe = await probePrimaryStaffGate(meta.primaryBaseUrl, { force: true });
    if (probe.staffEligible && probe.staffGateToken) {
      const exchange = await fetch("/api/auth/staff-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ staffGateToken: probe.staffGateToken }),
      });
      if (exchange.ok) {
        const data = (await exchange.json()) as { staff: StaffInfo };
        setStaff(data.staff);
        setStaffChecking(false);
        await loadOwnedUsers();
        return;
      }
      setErr("Could not verify your Anemone staff session. Try signing in again.");
    } else if (probe.signedIn && !probe.staffEligible) {
      setErr(
        `Your ${PLATFORM_NAME} account does not have tenant staff (or higher) permissions needed for this demo.`,
      );
    }
    setStaff(null);
    setStaffChecking(false);
  }, [loadOwnedUsers]);

  useEffect(() => {
    void establishStaffSession();
  }, [establishStaffSession]);

  useEffect(() => {
    if (sp.get("signup") === "1" && staff) setSignUpOpen(true);
  }, [sp, staff]);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordBusy) return;
    setPasswordErr(null);
    setErr(null);
    setPasswordBusy(true);
    if (currentUserId) {
      await fetch("/api/auth/logout", { method: "POST" });
    }
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await r.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };
    if (!r.ok) {
      setPasswordErr(data.error ?? "Could not sign in with that email and password.");
      setPasswordBusy(false);
      return;
    }
    setPassword("");
    router.replace(next);
    router.refresh();
  }

  async function switchToUser(userId: string) {
    if (busyId || userId === currentUserId) return;
    setErr(null);
    setPasswordErr(null);
    setBusyId(userId);
    if (currentUserId) {
      await fetch("/api/auth/logout", { method: "POST" });
    }
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!r.ok) {
      setErr("Could not sign in as that demo user.");
      setBusyId(null);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function deleteUser(user: DemoUser) {
    if (busyId) return;
    const confirmed = window.confirm(`Delete demo user ${user.fullName}? This cannot be undone.`);
    if (!confirmed) return;

    setErr(null);
    setBusyId(user.id);
    const r = await fetch(`/api/auth/users/${encodeURIComponent(user.id)}`, { method: "DELETE" });
    if (!r.ok) {
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      setErr(data.error ?? "Could not delete demo user.");
      setBusyId(null);
      return;
    }
    setBusyId(null);
    await loadOwnedUsers();
  }

  function onSignUpSuccess() {
    setSignUpOpen(false);
    router.replace(next);
    router.refresh();
  }

  return (
    <>
      <div className="mx-auto max-w-md space-y-4">
        <div
          className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow"
          data-testid="password-login-card"
        >
          <h1 className="font-display text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Email and password login is used by Anemone’s browser agent. Wrong passwords stay on
            this page with an error — the agent reports that back so you can retry.
          </p>
          <form className="mt-5 space-y-3" onSubmit={(e) => void signInWithPassword(e)}>
            <div>
              <label className="text-sm font-medium" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                data-testid="login-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--page)] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                data-testid="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--page)] px-3 py-2.5 text-sm"
              />
            </div>
            {passwordErr ? (
              <p className="text-sm text-red-600" data-testid="login-error" role="alert">
                {passwordErr}
              </p>
            ) : null}
            <button
              type="submit"
              data-testid="login-submit"
              disabled={passwordBusy}
              className="btn-primary w-full rounded-xl py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordBusy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow">
          <h2 className="font-display text-xl font-bold">Demo users</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create and switch among demo accounts tied to your {PLATFORM_NAME} staff login (tenant
            staff or above). Other people’s demo accounts stay hidden.
          </p>

          {staffChecking ? (
            <p className="mt-5 text-sm text-[var(--muted)]">Checking {PLATFORM_NAME} staff access…</p>
          ) : !staff ? (
            <div className="mt-5 space-y-3">
              <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--page)] px-4 py-3 text-sm text-[var(--muted)]">
                Sign in to {PLATFORM_NAME} with a staff account to manage demo users.
              </p>
              {primarySignInUrl ? (
                <a
                  href={primarySignInUrl}
                  className="btn-primary inline-flex w-full items-center justify-center rounded-xl py-2.5 text-sm"
                >
                  Sign in to {PLATFORM_NAME}
                </a>
              ) : (
                <p className="text-sm text-red-600">
                  Set ANEMONE_PRIMARY_BASE_URL so this demo can verify {PLATFORM_NAME} staff access.
                </p>
              )}
              {primaryBaseUrl ? (
                <button
                  type="button"
                  onClick={() => void establishStaffSession()}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--page)] py-2.5 text-sm font-semibold"
                >
                  I already signed in — refresh
                </button>
              ) : null}
            </div>
          ) : loading ? (
            <p className="mt-5 text-sm text-[var(--muted)]">Loading your demo users…</p>
          ) : users.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--page)] px-4 py-3 text-sm text-[var(--muted)]">
              No demo users for your account yet. Create one below to get started.
            </p>
          ) : (
            <ul className="mt-5 space-y-2">
              {users.map((user) => {
                const isCurrent = user.id === currentUserId;
                const isBusy = busyId === user.id;
                return (
                  <li
                    key={user.id}
                    className={`rounded-xl border px-3 py-3 ${
                      isCurrent
                        ? "border-[var(--accent-btn-border)] bg-[var(--accent-btn)]/40"
                        : "border-[var(--border)] bg-[var(--page)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--ink)]">{user.fullName}</p>
                        <p className="truncate text-sm text-[var(--muted)]">{user.email}</p>
                        {isCurrent ? (
                          <span className="mt-1 inline-block rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                            Signed in
                          </span>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                        {!isCurrent ? (
                          <button
                            type="button"
                            disabled={!!busyId}
                            onClick={() => void switchToUser(user.id)}
                            className="btn-primary rounded-lg px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "Signing in…" : "Sign in"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => router.replace(next)}
                            className="btn-primary rounded-lg px-3 py-1.5 text-xs"
                          >
                            Continue
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!!busyId}
                          onClick={() => void deleteUser(user)}
                          className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy && !isCurrent ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

          {staff ? (
            <div className="mt-4 border-t border-[var(--border)] pt-4 text-center">
              <button
                type="button"
                onClick={() => setSignUpOpen(true)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--page)] py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--accent-btn)]"
              >
                Sign up
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <SignUpModal open={signUpOpen} onClose={() => setSignUpOpen(false)} onSuccess={onSignUpSuccess} />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[var(--muted)]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
