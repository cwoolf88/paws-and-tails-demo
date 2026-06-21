import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { PawsFooter } from "@/components/PawsFooter";
import { NextAddressDevToolsBootstrap } from "@/components/NextAddressDevToolsBootstrap";

const body = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Paws and Tails — Paws-words, delivered with purr-ision",
  description: "A whimsical subscription service demo with real contact sync via next-address-server-js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-dvh bg-[var(--page)] text-[var(--ink)] antialiased">
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-5">{children}</main>
          <PawsFooter />
          <NextAddressDevToolsBootstrap />
        </div>
      </body>
    </html>
  );
}
