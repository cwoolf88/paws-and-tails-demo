import { ContactFormFields } from "./ContactFormFields";
import { CustomAnemoneContactUI } from "./CustomAnemoneContactUI";
import type { ContactFormValues, ContactPrimaryResult } from "./types";

type Props = {
  form: ContactFormValues;
  onFormChange: (values: ContactFormValues) => void;
  err: string | null;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  primary: ContactPrimaryResult | null;
  onSaveContact: () => Promise<ContactPrimaryResult | null>;
};

export function ContactCustomPanel({
  form,
  onFormChange,
  err,
  saving,
  onSubmit,
  primary,
  onSaveContact,
}: Props) {
  return (
    <div
      id="contact-panel-custom"
      role="tabpanel"
      aria-labelledby="contact-tab-custom"
      className="space-y-4"
    >
      <CustomAnemoneContactUI
        primary={primary}
        saving={saving}
        onSaveContact={onSaveContact}
      />
      <ContactFormFields
        values={form}
        onChange={onFormChange}
        err={err}
        saving={saving}
        onSubmit={onSubmit}
      />
      <p className="text-xs text-[var(--muted)]">
        Connection UI is hand-rolled in this demo; sync status uses the same in-widget block as{" "}
        <code className="rounded bg-black/[0.04] px-1 py-0.5 font-mono text-[0.7rem]">
          createAnemoneWidget
        </code>{" "}
        via{" "}
        <code className="rounded bg-black/[0.04] px-1 py-0.5 font-mono text-[0.7rem]">
          renderSyncBlock
        </code>{" "}
        from <code className="rounded bg-black/[0.04] px-1 py-0.5 font-mono text-[0.7rem]">anemone-server-js/embed</code>.
      </p>
    </div>
  );
}
