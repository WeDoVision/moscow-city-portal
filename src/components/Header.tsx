"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { portal } from "@/portal.config";
import { track } from "@/lib/analytics";

const NAV = [
  { href: "/#catalog", label: "Каталог" },
  { href: "/towers", label: "Башни" },
  { href: "/#about", label: "О портале" },
  { href: "/#faq", label: "Вопросы" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "bg-ink/90 backdrop-blur-md border-b border-ink-line/50"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="group flex items-baseline gap-2" aria-label={portal.brand.name}>
          <span className="font-display text-lg tracking-[0.18em] text-paper">
            {portal.brand.logo[0]}
          </span>
          <span className="text-xs font-semibold tracking-[0.35em] text-gold">
            {portal.brand.logo[1]}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Основная навигация">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm text-paper/80 transition-colors hover:text-gold"
            >
              {n.label}
            </Link>
          ))}
          <a
            href={portal.brand.phoneHref}
            onClick={() => track("cta_click", { cta: "header_phone" })}
            className="rounded-full border border-gold/60 px-5 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
          >
            {portal.brand.phone}
          </a>
        </nav>

        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className={`h-px w-6 bg-paper transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
          <span className={`h-px w-6 bg-paper transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="border-t border-ink-line/50 px-5 pb-6 pt-2 md:hidden" aria-label="Мобильная навигация">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-base text-paper/90"
            >
              {n.label}
            </Link>
          ))}
          <a
            href={portal.brand.phoneHref}
            onClick={() => track("cta_click", { cta: "header_phone" })}
            className="mt-3 inline-block rounded-full border border-gold/60 px-5 py-2 text-sm text-gold"
          >
            {portal.brand.phone}
          </a>
        </nav>
      )}
    </header>
  );
}
