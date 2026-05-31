import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)] ring-1 ring-[var(--border)]">
            Paws-words, delivered with purr-ision
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Food so good, your pet might actually stop judging you. For a second.
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)]">
            Paws and Tails is a pretend pet subscription service with a real purpose: showing how a third-party app
            nudges NextAddress using{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-sm ring-1 ring-[var(--border)]">next-address-server-js</code>{" "}
            — PATCHing contact deltas from your UI, then accepting verified webhooks when the network purrs back.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="btn-primary rounded-xl px-5 py-2.5 text-sm shadow-md shadow-[var(--glow)]"
            >
              Browse products
            </Link>
            <Link
              href="/account/contact"
              className="rounded-xl border border-[var(--border)] bg-[var(--page)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--accent-btn)]"
            >
              Edit contact info
            </Link>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Tip: sign in to open the contact form and try NextAddress sync.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-amber-200/50 blur-2xl" />
          <div className="absolute -bottom-4 -right-2 h-24 w-24 rounded-full bg-rose-200/40 blur-2xl" />
          <div className="relative rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl">
            <div className="text-sm text-[var(--muted)]">Today’s very serious metrics</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between rounded-xl bg-[var(--page)] px-3 py-2">
                <span>Treat-to-tail ratio</span> <span className="font-semibold text-[var(--accent)]">Optimal</span>
              </li>
              <li className="flex justify-between rounded-xl bg-[var(--page)] px-3 py-2">
                <span>Paws-itive customer vibes</span> <span className="font-semibold">Max</span>
              </li>
              <li className="flex justify-between rounded-xl bg-[var(--page)] px-3 py-2">
                <span>Boxes opened before photo op</span> <span className="font-semibold text-[var(--accent2)]">0</span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-[var(--muted)]">*(Metrics are 100% fictional; enthusiasm is 100% real.)</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold">The integration tail (SDK bits)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Outward (PATCH to NextAddress)",
              text: "When a pet parent saves contact info, we only send the diffs, using NextAddressClient with method PATCH and your configured path.",
            },
            {
              title: "Webhooks (HMAC, inbound)",
              text: "NextAddress nudges us on contact.changed; we verify signature, then map the event to our SQLite user with a small callback you can read like plain English.",
            },
            {
              title: "Outcomes (HTTP status + body)",
              text: "NextAddress answers with processed, pending, or not-linked vibes — surfaced right next to your form so humans don’t have to read JSON for breakfast.",
            },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-[var(--border)] bg-white/90 p-4">
              <h3 className="text-sm font-semibold text-[var(--ink)]">{b.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{b.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
