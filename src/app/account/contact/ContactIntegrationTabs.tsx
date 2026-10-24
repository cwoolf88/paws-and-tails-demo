import type { ContactIntegrationTab } from "./types";

type Props = {
  active: ContactIntegrationTab;
  onChange: (tab: ContactIntegrationTab) => void;
};

const tabs: { id: ContactIntegrationTab; label: string; hint: string }[] = [
  {
    id: "basic",
    label: "Basic integration",
    hint: "SDK account card and sync UI from anemone-server-js",
  },
  {
    id: "custom",
    label: "Custom integration",
    hint: "Hand-rolled connection UI with the same sync states and retry flow as the SDK widget",
  },
];

export function ContactIntegrationTabs({ active, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div
        className="inline-flex w-full max-w-xl flex-row gap-1 rounded-xl border border-[var(--border)] bg-white/80 p-1"
        role="tablist"
        aria-label="Integration style"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`contact-panel-${tab.id}`}
            id={`contact-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-center text-xs font-semibold transition sm:px-3 sm:text-sm ${
              active === tab.id
                ? "bg-[var(--accent-btn)] text-[var(--ink)] shadow-sm ring-1 ring-[var(--accent-btn-border)]"
                : "text-[var(--muted)] hover:bg-[var(--page)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--muted)]">
        {tabs.find((t) => t.id === active)?.hint}
      </p>
    </div>
  );
}
