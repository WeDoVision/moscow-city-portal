"use client";

import { useState } from "react";
import Link from "next/link";
import { brand, nav, footerCols } from "./data";

/* ──────────────────────────────────────────────────────────────────────
 * Chrome подстраниц портала /osobnyaki-c (страницы лотов).
 * Тот же визуальный язык .osb, что и на лендинге. Якорная навигация ведёт на
 * секции лендинга (/osobnyaki-c#…), т.к. секции живут там. Вынесено отдельно,
 * чтобы детальные страницы не дублировали обвес и не зависели от лендинга.
 * ─────────────────────────────────────────────────────────────────── */

const HOME = "/osobnyaki-c";
const hrefOf = (h: string) => (h.startsWith("#") ? `${HOME}${h}` : h);

function Logo() {
  return (
    <Link href={HOME} className="flex items-center gap-3" aria-label={brand.name}>
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--osb-line-strong)] text-[var(--osb-ink)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 21V10l8-6 8 6v11M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-semibold tracking-tight text-[var(--osb-ink)]">
          {brand.logoTop}
          <span className="text-[var(--osb-bronze)]">{brand.logoDot}</span>
        </span>
        <span className="block text-[10px] tracking-[0.18em] text-[var(--osb-muted)]">
          {brand.tagline.toUpperCase()}
        </span>
      </span>
    </Link>
  );
}

export function OsbHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--osb-line)] bg-[var(--osb-paper)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 md:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((group) => (
            <Link
              key={group.label}
              href={hrefOf(group.items[0]?.href ?? "#top")}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--osb-ink-soft)] transition-colors hover:text-[var(--osb-ink)]"
            >
              {group.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <a href={brand.phoneHref} className="text-sm font-semibold text-[var(--osb-ink)] osb-num">
            {brand.phone}
          </a>
          <Link href={`${HOME}#expert`} className="osb-btn osb-btn-primary px-5 py-2.5">
            Заказать звонок
          </Link>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--osb-line-strong)] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-[var(--osb-line)] bg-[var(--osb-paper)]/98 px-5 pb-6 pt-2 backdrop-blur-xl lg:hidden">
          {nav.map((group) => (
            <div key={group.label} className="border-b border-[var(--osb-line)] py-3">
              <p className="osb-kicker mb-2">{group.label}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.items.map((it) => (
                  <a
                    key={it.label}
                    href={hrefOf(it.href)}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-2 py-1.5 text-sm text-[var(--osb-ink-soft)]"
                  >
                    {it.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <a href={brand.phoneHref} className="mt-4 block text-center text-sm font-semibold osb-num">
            {brand.phone}
          </a>
        </div>
      )}
    </header>
  );
}

export function OsbFooter() {
  return (
    <footer className="bg-[var(--osb-ink)] pt-16 text-[var(--osb-surface)]">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <div className="mt-6 space-y-1.5 text-sm">
              <a href={brand.phoneHref} className="block font-semibold osb-num text-[var(--osb-surface)]">{brand.phone}</a>
              <a href={`mailto:${brand.email}`} className="block text-[var(--osb-surface)]/65">{brand.email}</a>
              <p className="text-[var(--osb-surface)]/65">{brand.address}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <a href={brand.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold transition-colors hover:border-[var(--osb-bronze)] hover:text-[var(--osb-bronze-soft)]">
                WhatsApp
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerCols.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--osb-bronze-soft)]">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={hrefOf(l.href)} className="text-sm text-[var(--osb-surface)]/65 transition-colors hover:text-[var(--osb-surface)]">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 border-t border-white/10 py-7">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-[var(--osb-surface)]/50 md:flex-row">
            <p>© 2026 osobnyaki.com · проект Whitewill</p>
            <p>Москва · {brand.found} особняков в каталоге</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
