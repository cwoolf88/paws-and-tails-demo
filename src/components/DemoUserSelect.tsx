"use client";

import Select from "react-select";
import { demoSelectStyles, type SelectOption } from "@/lib/react-select-theme";

type Props = {
  id: string;
  options: SelectOption[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DemoUserSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Select a user…",
  disabled = false,
}: Props) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Select<SelectOption, false>
      inputId={id}
      instanceId={id}
      className="demo-select"
      classNamePrefix="demo-select"
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt?.value ?? "")}
      placeholder={placeholder}
      isDisabled={disabled}
      isClearable={false}
      isSearchable={options.length > 4}
      styles={demoSelectStyles()}
      aria-label="Demo user"
    />
  );
}
