"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

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
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (!r.ok) {
      setErr("Couldn’t wiggle in — try a different profile.");
      return;
    }
    router.replace(next);
    router.refresh();
  }
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow">
      <h1 className="font-display text-2xl font-bold">Choose your treat identity</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">No real passwords. Just a whisker of pretend auth.</p>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium" htmlFor="u">
            Demo user
          </label>
          <select
            id="u"
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          >
            <option value="" disabled>
              Pick a fur-end…
            </option>
            {(users ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} — {u.email}
              </option>
            ))}
          </select>
        </div>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button
          type="submit"
          className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white"
        >
          Trot in
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[var(--muted)]">Litter-boxing the choices…</div>}>
      <LoginForm />
    </Suspense>
  );
}
