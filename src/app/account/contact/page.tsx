"use client";

import { useCallback, useEffect, useState } from "react";
import { ContactBasicPanel } from "./ContactBasicPanel";
import { ContactCustomPanel } from "./ContactCustomPanel";
import { ContactIntegrationTabs } from "./ContactIntegrationTabs";
import { integrationLoggedFetch } from "@/lib/integrations/integrationLoggedFetch";
import { getIntegrationSimulationLog } from "@/lib/integrations/integrationSimulationLog";
import { readSimulationEventsField } from "next-address-server-js/embed";
import type {
  ContactFormValues,
  ContactIntegrationTab,
  ContactPrimaryResult,
  ContactUser,
} from "./types";

function formFromUser(user: ContactUser): ContactFormValues {
  return {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    line1: user.address.line1,
    line2: user.address.line2,
    city: user.address.city,
    region: user.address.region,
    postalCode: user.address.postalCode,
    countryCode: user.address.countryCode,
  };
}

export default function ContactPage() {
  const [user, setUser] = useState<ContactUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [primary, setPrimary] = useState<ContactPrimaryResult | null>(null);
  const [tab, setTab] = useState<ContactIntegrationTab>("basic");
  const [form, setForm] = useState<ContactFormValues>({
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
    const d = (await r.json()) as { user: ContactUser };
    setUser(d.user);
    setForm(formFromUser(d.user));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveContact = useCallback(async (): Promise<ContactPrimaryResult | null> => {
    if (!user) return null;
    setErr(null);
    setSaving(true);
    setPrimary(null);
    const r = await integrationLoggedFetch("Save contact + sync", "/api/user/contact", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        previousAddress: user.address,
      }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Save failed. Please try again.");
      setSaving(false);
      return null;
    }
    const d = (await r.json()) as {
      user: ContactUser;
      primary: ContactPrimaryResult;
    };
    getIntegrationSimulationLog().append(readSimulationEventsField(d));
    setUser(d.user);
    setForm(formFromUser(d.user));
    setPrimary(d.primary);
    setSaving(false);
    return d.primary;
  }, [form, user]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    await saveContact();
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading your profile…</p>;
  }
  if (!user) {
    return <p className="text-sm text-red-600">Not signed in.</p>;
  }

  const panelProps = {
    form,
    onFormChange: setForm,
    err,
    saving,
    onSubmit: onSave,
    primary,
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-3xl font-bold">My account</h1>
      <p className="text-sm text-[var(--muted)]">
        Compare the packaged NextAddress UI with a hand-rolled integration. Both paths save to
        Paws and Tails and PATCH changed contact fields to NextAddress via{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-sm ring-1 ring-[var(--border)]">
          next-address-server-js
        </code>
        .
      </p>
      <p className="text-xs text-[var(--muted)]">
        Signed-in user id: <span className="font-mono">{user.id}</span>
      </p>

      <ContactIntegrationTabs active={tab} onChange={setTab} />

      {tab === "basic" ? (
        <ContactBasicPanel {...panelProps} onSaveContact={saveContact} />
      ) : (
        <ContactCustomPanel {...panelProps} onSaveContact={saveContact} />
      )}
    </div>
  );
}
