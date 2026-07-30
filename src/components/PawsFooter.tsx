import { PLATFORM_NAME } from "@/lib/config";

export function PawsFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-white/50 py-6 text-[var(--muted)] sm:py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-10">
            <p className="shrink-0 text-sm font-medium text-[var(--ink)]">
              © {new Date().getFullYear()} Paws and Tails
            </p>
            <p className="text-pretty text-xs leading-relaxed md:max-w-sm md:text-right lg:max-w-md">
              Built to show the{" "}
              <code className="break-all rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[0.7rem] text-[var(--ink)] sm:break-normal">
                anemone-server-js
              </code>{" "}
              link between your app and {PLATFORM_NAME}.
            </p>
          </div>
          <p className="border-t border-[var(--border)] pt-4 text-pretty text-xs leading-relaxed">
            Contact updates post to {PLATFORM_NAME} (or mock) server; webhooks re-verify and patch your
            local user row.
          </p>
        </div>
      </div>
    </footer>
  );
}
