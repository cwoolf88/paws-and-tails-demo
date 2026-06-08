import type { GroupBase, StylesConfig } from "react-select";

export type SelectOption = { value: string; label: string };

export function demoSelectStyles<
  Option extends SelectOption,
  IsMulti extends boolean = false,
>(): StylesConfig<Option, IsMulti, GroupBase<Option>> {
  return {
    control: (base, state) => ({
      ...base,
      minHeight: "2.625rem",
      borderRadius: "0.75rem",
      borderColor: state.isFocused ? "var(--accent-btn-border)" : "var(--border)",
      backgroundColor: "var(--page)",
      boxShadow: state.isFocused ? "0 0 0 2px color-mix(in srgb, var(--accent) 18%, transparent)" : "none",
      cursor: "pointer",
      "&:hover": {
        borderColor: "var(--accent-btn-border)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "2px 12px",
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--ink)",
      fontSize: "0.875rem",
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--muted)",
      fontSize: "0.875rem",
    }),
    input: (base) => ({
      ...base,
      color: "var(--ink)",
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "var(--muted)",
      paddingRight: "10px",
      "&:hover": {
        color: "var(--ink)",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "0.75rem",
      overflow: "hidden",
      border: "1px solid var(--border)",
      boxShadow: "0 8px 24px rgba(19, 64, 50, 0.12)",
      zIndex: 50,
    }),
    menuList: (base) => ({
      ...base,
      padding: "4px",
    }),
    option: (base, state) => ({
      ...base,
      fontSize: "0.875rem",
      borderRadius: "0.5rem",
      cursor: "pointer",
      color: "var(--ink)",
      backgroundColor: state.isSelected
        ? "var(--accent-btn)"
        : state.isFocused
          ? "color-mix(in srgb, var(--accent-btn) 55%, var(--page))"
          : "transparent",
      "&:active": {
        backgroundColor: "var(--accent-btn-hover)",
      },
    }),
  };
}
