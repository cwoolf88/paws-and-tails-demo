"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navLinkClass(isActive: boolean) {
  return [
    "rounded-lg px-3 py-1.5 transition",
    isActive
      ? "bg-[var(--accent-btn)]/60 font-semibold text-[var(--ink)] ring-1 ring-[var(--accent-btn-border)]"
      : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]",
  ].join(" ");
}

export function SiteHeaderNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  if (!signedIn) return null;

  const shopActive = pathname === "/shop" || pathname.startsWith("/shop/");
  const accountActive = pathname.startsWith("/account");

  return (
    <nav className="flex items-center gap-2 text-sm font-medium">
      <Link
        href="/shop"
        className={navLinkClass(shopActive)}
        aria-current={shopActive ? "page" : undefined}
      >
        Shop
      </Link>
      <Link
        href="/account/contact"
        className={navLinkClass(accountActive)}
        aria-current={accountActive ? "page" : undefined}
      >
        My Account
      </Link>
    </nav>
  );
}
