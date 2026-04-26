export function PawsFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-white/50 py-8 text-sm text-[var(--muted)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Paws and Tails — a demo, not a vet. (But we are very supportive.)</p>
          <p className="text-xs">
            Built to show the{" "}
            <code className="rounded bg-black/[0.04] px-1 py-0.5">next-address-server-js</code> link between your app and
            a primary address hub.
          </p>
        </div>
        <p className="mt-3 text-xs">
          Contact updates post to the primary (or mock) server; webhooks re-verify and patch your local user row. Purr-iod.
        </p>
      </div>
    </footer>
  );
}
