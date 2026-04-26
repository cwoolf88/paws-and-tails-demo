"use client";

import { useCallback, useEffect, useState } from "react";

type User = {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
  };
};

type Primary = {
  patches: unknown[];
  results: { status: string; message?: string; error?: string }[];
  attemptedPrimary: boolean;
};

export default function ContactPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [primary, setPrimary] = useState<Primary | null>(null);
  const [f, setF] = useState({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    countryCode: "",
  });

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const r = await fetch("/api/user/contact", { method: "GET" });
    if (r.status === 401) {
      setUser(null);
      setLoading(false);
      return;
    }
    if (!r.ok) {
      setErr("Could not load your profile");
      setLoading(false);
      return;
    }
    const d = (await r.json()) as { user: User };
    setUser(d.user);
    setF({
      fullName: d.user.fullName,
      email: d.user.email,
      phone: d.user.phone,
      line1: d.user.address.line1,
      line2: d.user.address.line2,
      city: d.user.address.city,
      region: d.user.address.region,
      postalCode: d.user.address.postalCode,
      countryCode: d.user.address.countryCode,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setErr(null);
    setSaving(true);
    setPrimary(null);
    const r = await fetch("/api/user/contact", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Save flopped. Try again, champion.");
      setSaving(false);
      return;
    }
    const d = (await r.json()) as { user: User; primary: Primary };
    setUser(d.user);
    setPrimary(d.primary);
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Lifting the litter of your profile…</p>;
  }
  if (!user) {
    return <p className="text-sm text-red-600">Not signed in — the door’s locked like a well-fed house cat.</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-3xl font-bold">Paws-words: where your kibble really ships</h1>
      <p className="text-sm text-[var(--muted)]">
        This form writes to the local user row and emits PATCHes (mock or real) for only the contact slices that
        actually changed, via <code>next-address-server-js</code>.
      </p>
      <p className="text-xs text-[var(--muted)]">
        <span className="font-mono">externalUserId</span> in the SDK = your demo user id{" "}
        <span className="font-mono">{user.id}</span> &middot; tenant: <span className="font-mono">{user.tenantId}</span>
      </p>
      <form className="space-y-3 rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow" onSubmit={onSave}>
        {["fullName", "email", "phone"].map((k) => (
          <div key={k}>
            <label className="text-sm font-medium capitalize" htmlFor={k}>
              {k === "fullName" ? "Full name" : k}
            </label>
            <input
              id={k}
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
              value={(f as Record<string, string>)[k] ?? ""}
              onChange={(e) => setF((o) => ({ ...o, [k]: e.target.value }))}
            />
          </div>
        ))}
        <h2 className="pt-2 text-sm font-semibold text-[var(--ink)]">Address</h2>
        {(["line1", "line2", "city", "region", "postalCode", "countryCode"] as const).map((k) => (
          <div key={k}>
            <label className="text-sm font-medium" htmlFor={k}>
              {k}
            </label>
            <input
              id={k}
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
              value={f[k] ?? ""}
              onChange={(e) => setF((o) => ({ ...o, [k]: e.target.value }))}
            />
          </div>
        ))}
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Hailing the primary (or mock) purr-vider…" : "Save & nudge the primary"}
        </button>
      </form>
      {primary && !primary.attemptedPrimary ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] bg-amber-50/60 p-4 text-sm text-[var(--muted)]">
          You didn&rsquo;t change anything, so we didn&rsquo;t yowl at the primary. Tweak a field, then try again.
        </p>
      ) : null}
      {primary && primary.attemptedPrimary && primary.results.length > 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--page)] p-4 text-sm">
          <h2 className="font-semibold text-[var(--ink)]">What the primary said (most recent first)</h2>
          <ul className="mt-2 list-disc pl-4 text-[var(--muted)]">
            {primary.results.map((r, i) => (
              <li key={i}>
                <code className="text-[var(--ink)]">{r.status}</code>
                {r.message ? <span> — {r.message}</span> : null}
                {r.error ? <span> ({r.error})</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
