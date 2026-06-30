"use client";

import { useState } from "react";
import Link from "next/link";
import { brand, nav, footerCols } from "./data";

/* ──────────────────────────────────────────────────────────────────────
 * Chrome подстраниц портала /moscow-city-p (лоты и башни).
 * Тот же визуальный язык .mcp, что и на лендинге (SuiClone): монохром +
 * синий акцент, прямоугольная геометрия, моноширинные метки. Хедер/футер
 * вынесены сюда, чтобы детальные страницы не дублировали обвес. Навигация
 * ведёт на якоря лендинга (/moscow-city-p#…), т.к. секции живут там.
 * ─────────────────────────────────────────────────────────────────── */

const HOME = "/moscow-city-p";

function Logo() {
  return (
    <Link href={HOME} className="flex items-center gap-2" aria-label={brand.name}>
      <svg width="22" height="26" viewBox="0 0 24 28" fill="none" aria-hidden>
        <path d="M12 1C6 9 3 13 3 18a9 9 0 0018 0c0-5-3-9-9-17z" stroke="#fff" strokeWidth="1.6" />
      </svg>
      <span className="text-xl font-semibold tracking-tight text-white">
        Moscow<span className="text-[#4da2ff]">City</span>
      </span>
    </Link>
  );
}

export function McpHeader() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  // На подстранице якоря ведут на лендинг.
  const hrefOf = (h: string) => (h.startsWith("#") ? `${HOME}${h}` : h);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line-dark)] bg-[#0a0a0b]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between px-2.5">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setMenu(null)}>
          {nav.map((g, i) => (
            <div key={g.label} className="mcp-navitem relative" onMouseEnter={() => setMenu(i)}>
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-lg text-[#d2d7dd] transition-colors hover:text-white">
                {g.label}
                <span className="mcp-plus">+</span>
              </button>
              {menu === i && (
                <div className="absolute left-0 top-full w-64 pt-1">
                  <div className="rounded-xl border border-[var(--line-dark)] bg-[#111214] p-2 shadow-2xl">
                    {g.items.map((it) => (
                      <a
                        key={it.label}
                        href={hrefOf(it.href)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                      >
                        <span className="text-lg text-white">{it.label}</span>
                        <span className="mcp-mono text-[10px] text-[#7d848d]">{it.note}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a href={brand.phoneHref} className="mcp-mono text-sm text-[#d2d7dd] hover:text-white">
            {brand.phone}
          </a>
          <a href={`${HOME}#start`} className="mcp-btn-blue px-4 py-2 text-lg">
            Получить подбор
          </a>
        </div>
        <button
          className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--line-dark)] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-[var(--line-dark)] px-5 pb-5 pt-2 lg:hidden">
          {nav.map((g) => (
            <div key={g.label} className="border-b border-[var(--line-dark)] py-3">
              <p className="mcp-mono mb-2 text-[10px] uppercase tracking-widest text-[#7d848d]">
                {g.label}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {g.items.map((it) => (
                  <a
                    key={it.label}
                    href={hrefOf(it.href)}
                    onClick={() => setOpen(false)}
                    className="rounded px-2 py-1.5 text-lg text-[#d2d7dd]"
                  >
                    {it.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <a
            href={`${HOME}#start`}
            onClick={() => setOpen(false)}
            className="mcp-btn-blue mt-4 block px-4 py-3 text-center text-lg"
          >
            Получить подбор
          </a>
        </div>
      )}
    </header>
  );
}

export function McpFooter() {
  // только реальные каналы из оригинала moscowcitysale.ru: VK, Дзен, WhatsApp
  const social = [
    { label: "VK", href: brand.vk, d: "M3 7h3c.5 4 2 6 3 6V7h3v4c1 0 2-1 3-4h3c-.5 2-2 4-3 5 1 1 3 3 3 5h-3c-1-2-2-3-3-3v3H9C5 19 3 12 3 7z" },
    { label: "Дзен", href: brand.zen, d: "M12 3c0 5 1 6 6 6-5 0-6 1-6 6 0-5-1-6-6-6 5 0 6-1 6-6z" },
    { label: "WhatsApp", href: brand.whatsapp, d: "M4 20l1.5-4A8 8 0 1112 20a8 8 0 01-4-1L4 20z" },
  ];
  return (
    <footer className="mcp-dark border-t border-[var(--line-dark)] pt-16">
      <div className="mx-auto max-w-[1800px] px-2.5">
        <div className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {footerCols.map((col) => (
            <div key={col.title}>
              <p className="mcp-mono mb-4 text-[11px] tracking-wide text-white">{col.title}/</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href={HOME}
                      className="mcp-mono flex items-center gap-1.5 text-[12px] text-[#8b929c] transition-colors hover:text-white"
                    >
                      <span className="text-[#4a5159]">└</span>
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-5 border-t border-[var(--line-dark)] py-7 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            {social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--line-dark)] text-[#8b929c] transition-colors hover:border-[#1aa3ff] hover:text-white"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d={s.d} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>
          <p className="mcp-mono text-[11px] text-[#6b727b]">© Moscow City Sale · {brand.address}</p>
        </div>
      </div>
    </footer>
  );
}
