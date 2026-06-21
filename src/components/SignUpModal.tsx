"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function SignUpModal({ open, onClose, onSuccess }: Props) {
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email }),
    });
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) {
      setErr(data.error ?? "Sign up failed. Please try again.");
      setSaving(false);
      return;
    }
    setFirstName("");
    setLastName("");
    setEmail("");
    setSaving(false);
    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-xl font-bold text-[var(--ink)]">
            Create demo account
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]"
            aria-label="Close sign up"
          >
            ✕
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="signup-firstName">
                First name
              </label>
              <input
                ref={firstFieldRef}
                id="signup-firstName"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="signup-lastName">
                Last name
              </label>
              <input
                id="signup-lastName"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="signup-email">
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-sm"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
              Tip: with Gmail, add{" "}
              <code className="rounded bg-black/[0.04] px-1 py-0.5 font-mono text-[0.7rem]">
                +&lt;custom-text&gt;
              </code>{" "}
              before the @ (e.g.{" "}
              <code className="rounded bg-black/[0.04] px-1 py-0.5 font-mono text-[0.7rem]">
                example+user1@gmail.com
              </code>
              ) to share one inbox across multiple demo users.
            </p>
          </div>

          {err ? <p className="text-sm text-red-600">{err}</p> : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 rounded-xl py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating account…" : "Create account"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border)] bg-[var(--page)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--accent-btn)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
