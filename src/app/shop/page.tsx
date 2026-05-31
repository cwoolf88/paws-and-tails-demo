import { products } from "@/lib/products";
import type { Plan } from "@/lib/products";
import Link from "next/link";

const tag = (p: Plan) => (p === "purr" ? "Feline" : "Canine");

const tone = (p: Plan) =>
  p === "purr" ? "from-amber-50/90 to-rose-50" : "from-sky-50/90 to-emerald-50";

export default function ShopPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Paws-words, delivered. Literally. Figuratively. A little furr-ociously.</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Fictional kibble, real routes: pick a sub-box so your pet can unbox something while you wire up the SDK.
        </p>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2">
        {products.map((p) => (
          <li
            key={p.id}
            className={
              "flex h-full flex-col justify-between rounded-2xl border border-[var(--border)] p-4 shadow-sm ring-1 ring-white/30 bg-gradient-to-b " +
              tone(p.plan)
            }
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase text-[var(--accent)]">
                {tag(p.plan) === "Feline" ? "Cat-a-log pick" : "Bark-itecture pick"}{" "}
                <span
                  className="rounded-lg bg-white/60 px-2 py-0.5 text-2xl ring-1 ring-black/5"
                  role="img"
                  aria-label=""
                >
                  {p.imageEmoji}
                </span>
              </div>
              <h2 className="mt-1 font-display text-lg font-bold">{p.name}</h2>
              <p className="text-sm text-[var(--muted)]">{p.blurb}</p>
              <ul className="mt-3 list-disc pl-4 text-sm text-[var(--ink)]">
                {p.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4 border-t border-black/5 pt-3 text-sm text-[var(--muted)]">
              <span className="text-2xl font-bold text-[var(--ink)]">${p.price}</span> / {p.per}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-center text-sm text-[var(--muted)]">
        Ready to set your shipping address?{" "}
        <Link className="font-semibold text-[var(--accent)] underline decoration-dotted underline-offset-2" href="/account/contact">
          Update contact information
        </Link>{" "}
        (or{" "}
        <Link className="font-semibold" href="/login">
          sign in
        </Link>{" "}
        first).
      </p>
    </div>
  );
}
