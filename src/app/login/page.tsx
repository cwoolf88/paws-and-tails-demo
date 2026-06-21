"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { SignUpModal } from "@/components/SignUpModal";

type DemoUser = {
  id: string;
  fullName: string;
  email: string;
};

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const next = sp.get("next") || "/account/contact";

  const loadUsers = useCallback(async () => {
    const [usersRes, meRes] = await Promise.all([
      fetch("/api/auth/users"),
      fetch("/api/auth/me"),
    ]);
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

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (sp.get("signup") === "1") setSignUpOpen(true);
  }, [sp]);

  async function switchToUser(userId: string) {
    if (busyId || userId === currentUserId) return;
    setErr(null);
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
    await loadUsers();
  }

  function onSignUpSuccess() {
    setSignUpOpen(false);
    router.replace(next);
    router.refresh();
  }

  return (
    <>
      <div className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow">
        <h1 className="font-display text-2xl font-bold">Demo users</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pick an existing demo account or create a new one. Switching signs out the current user first.
        </p>

        {loading ? (
          <p className="mt-5 text-sm text-[var(--muted)]">Loading demo users…</p>
        ) : users.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--page)] px-4 py-3 text-sm text-[var(--muted)]">
            No demo users yet. Create one below to get started.
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

        <div className="mt-4 border-t border-[var(--border)] pt-4 text-center">
          <button
            type="button"
            onClick={() => setSignUpOpen(true)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--page)] py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--accent-btn)]"
          >
            Sign up
          </button>
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
