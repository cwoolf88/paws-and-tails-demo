"use client";

import { PhoneNumberField } from "@/components/PhoneNumberField";
import type { Country } from "react-phone-number-input";
import { PLATFORM_NAME } from "@/lib/config";
import type { ContactFormValues } from "./types";

type Props = {
  values: ContactFormValues;
  onChange: (values: ContactFormValues) => void;
  err: string | null;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

function phoneDefaultCountry(countryCode: string): Country {
  const code = countryCode.trim().toUpperCase();
  if (code.length === 2) return code as Country;
  return "US";
}

const ADDRESS_FIELD_LABELS: Record<
  "line1" | "line2" | "city" | "region" | "postalCode" | "countryCode",
  string
> = {
  line1: "Street address",
  line2: "Apartment, suite, etc.",
  city: "City",
  region: "State / province",
  postalCode: "ZIP / postal code",
  countryCode: "Country code",
};

export function ContactFormFields({ values, onChange, err, saving, onSubmit }: Props) {
  function setField<K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form className="space-y-3 rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium" htmlFor="contact-fullName">
          Full name
        </label>
        <input
          id="contact-fullName"
          className="mt-1.5 w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
          value={values.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="contact-email">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          readOnly
          aria-readonly="true"
          className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-[var(--border)] bg-[var(--page)] px-3 py-2.5 text-sm text-[var(--muted)]"
          value={values.email}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)]">
          Email is set when the demo account is created and is used to match this user with {PLATFORM_NAME}.
        </p>
      </div>
      <PhoneNumberField
        id="contact-phone"
        value={values.phone}
        onChange={(phone) => setField("phone", phone)}
        defaultCountry={phoneDefaultCountry(values.countryCode)}
      />
      <h2 className="pt-2 text-sm font-semibold text-[var(--ink)]">Address</h2>
      {(["line1", "line2", "city", "region", "postalCode", "countryCode"] as const).map((k) => (
        <div key={k}>
          <label className="text-sm font-medium" htmlFor={`contact-${k}`}>
            {ADDRESS_FIELD_LABELS[k]}
          </label>
          <input
            id={`contact-${k}`}
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
            value={values[k]}
            onChange={(e) => setField(k, e.target.value)}
          />
        </div>
      ))}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full rounded-xl py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
