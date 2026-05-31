import Link from "next/link";
import { cookies } from "next/headers";
import { getUserById } from "@/lib/db/users";
import { logout } from "@/app/actions";

export async function SiteHeader() {
  const c = await cookies();
  const uid = c.get("paws_user_id")?.value;
  const u = uid ? getUserById(uid) : null;
  return (
    <header className="border-b border-[var(--border)] bg-[var(--header-bg)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" className="group flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-[var(--ink)]">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 text-xl shadow-sm ring-1 ring-black/5 transition group-hover:rotate-2"
            aria-hidden
          >
            🐾
          </span>
          Paws and Tails
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
          <Link
            className="rounded-lg px-3 py-1.5 transition hover:bg-black/[0.04] hover:text-[var(--ink)]"
            href="/shop"
          >
            Shop
          </Link>
          {u ? (
            <Link
              className="rounded-lg px-3 py-1.5 transition hover:bg-black/[0.04] hover:text-[var(--ink)]"
              href="/account/contact"
            >
              Contact
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          {u ? (
            <span className="hidden min-w-0 sm:inline text-[var(--muted)]">
              Hi, <span className="text-[var(--ink)] font-medium">{u.fullName.split(" ")[0]}</span>!
            </span>
          ) : null}
          {u ? (
            <form action={logout} className="inline">
              <button
                type="submit"
                className="rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] shadow-sm hover:bg-[var(--accent-btn)]"
              >
                Logout
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="btn-primary rounded-lg px-3.5 py-1.5 text-sm shadow-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
