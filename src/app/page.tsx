import Image from "next/image";
import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="-mt-4 space-y-8">
      <section className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div>
          <h1 className="font-display text-4xl font-bold leading-[1.12] sm:text-5xl">
            Food so good, your pet might actually stop judging you. For a second.
          </h1>
          <p className="mt-2 text-lg text-[var(--muted)]">
            Paws and Tails is a pretend pet subscription service with a real purpose: showing how a third-party app
            nudges {PLATFORM_NAME} using{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-sm ring-1 ring-[var(--border)]">anemone-server-js</code>{" "}
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
            Tip: sign in to open the contact form and try {PLATFORM_NAME} sync.
          </p>
        </div>
        <div className="relative lg:pt-1">
          <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-amber-200/50 blur-2xl" />
          <div className="absolute -bottom-4 -right-2 h-20 w-20 rounded-full bg-rose-200/40 blur-2xl" />
          <figure className="hero-cat relative mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:mx-0 lg:max-w-[420px]">
            <div className="hero-cat__frame relative aspect-[4/5] w-full">
              <Image
                src="/images/hero-cat.png"
                alt="A playful tabby cat with blue eyes holding a feather toy on a bed"
                fill
                priority
                sizes="(max-width: 640px) 300px, (max-width: 1024px) 360px, 420px"
                className="hero-cat__photo object-cover object-[center_28%]"
              />
              <div className="hero-cat__vignette" aria-hidden />
            </div>
          </figure>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold">The integration tail (SDK bits)</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: `Outward (PATCH to ${PLATFORM_NAME})`,
              text: `When a pet parent saves contact info, we only send the diffs, using AnemoneClient with method PATCH and your configured path.`,
            },
            {
              title: "Webhooks (HMAC, inbound)",
              text: `${PLATFORM_NAME} nudges us on contact.changed; we verify signature, then map the event to our SQLite user with a small callback you can read like plain English.`,
            },
            {
              title: "Outcomes (HTTP status + body)",
              text: `${PLATFORM_NAME} answers with processed, pending, or not-linked vibes — surfaced right next to your form so humans don’t have to read JSON for breakfast.`,
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
