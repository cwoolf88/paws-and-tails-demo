"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { DemoUserSelect } from "@/components/DemoUserSelect";

type User = {
  id: string;
  fullName: string;
  email: string;
};

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [users, setUsers] = useState<User[] | null>(null);
  const [id, setId] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const next = sp.get("next") || "/account/contact";
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/auth/users");
      const d = (await r.json()) as { users: User[] };
      setUsers(d.users);
      if (d.users[0]) setId((p) => p || d.users[0].id);
    })();
  }, []);
  const userOptions = useMemo(
    () =>
      (users ?? []).map((u) => ({
        value: u.id,
        label: `${u.fullName} — ${u.email}`,
      })),
    [users],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) {
      setErr("Select a user to continue.");
      return;
    }
    setErr(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (!r.ok) {
      setErr("Sign in failed. Try a different user.");
      return;
    }
    router.replace(next);
    router.refresh();
  }
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow">
      <h1 className="font-display text-2xl font-bold">Sign in</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Demo sign-in only. No password required.</p>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium" htmlFor="u">
            Demo user
          </label>
          <div className="mt-1.5">
            <DemoUserSelect
              id="u"
              options={userOptions}
              value={id}
              onChange={setId}
              disabled={!users?.length}
            />
          </div>
        </div>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button
          type="submit"
          disabled={!id || !users?.length}
          className="btn-primary w-full rounded-xl py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[var(--muted)]">Loading users…</div>}>
      <LoginForm />
    </Suspense>
  );
}
