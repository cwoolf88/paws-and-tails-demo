"use client";

import PhoneInput, { type Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

type Props = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** ISO 3166-1 alpha-2, e.g. from address countryCode */
  defaultCountry?: Country;
};

export function PhoneNumberField({
  id,
  label = "Phone",
  value,
  onChange,
  defaultCountry = "US",
}: Props) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <PhoneInput
        id={id}
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value || undefined}
        onChange={(next) => onChange(next ?? "")}
        className="phone-input-field"
        numberInputProps={{ autoComplete: "tel" }}
      />
    </div>
  );
}
