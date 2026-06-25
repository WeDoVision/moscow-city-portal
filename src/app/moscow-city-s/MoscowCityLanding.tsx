"use client";

import { useEffect, useRef, useState } from "react";
import {
  brand,
  nav,
  partners,
  pillars,
  ecosystem,
  benefits,
  propertyTypes,
  startBlocks,
  featured,
  stats,
  faq,
  footerCols,
} from "./data";

/* Появление секций при скролле */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".mcs-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-3" aria-label={brand.name}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#4da2ff] to-[#66e0ff] text-[#04121d] shadow-[0_6px_20px_rgba(77,162,255,0.45)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 21V8l5-4 5 4v13M9 21v-5h2v5M15 21V11l4 3v7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-[11px] font-bold tracking-[0.28em] text-[#eaf4ff]">{brand.logoTop}</span>
        <span className="block text-[11px] font-medium tracking-[0.28em] text-[#66e0ff]">{brand.logoBottom}</span>
      </span>
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "border-b border-[var(--mcs-line)] bg-[#04101b]/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setMenu(null)}>
          {nav.map((group, i) => (
            <div key={group.label} className="relative" onMouseEnter={() => setMenu(i)}>
              <button className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-[#cfe2f1] transition-colors hover:text-white">
                {group.label}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={`transition-transform ${menu === i ? "rotate-180" : ""}`} aria-hidden>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {menu === i && (
                <div className="absolute left-0 top-full w-72 pt-2">
                  <div className="rounded-2xl border border-[var(--mcs-line)] bg-[#061b2c]/95 p-2 shadow-2xl backdrop-blur-xl">
                    {group.items.map((it) => (
                      <a
                        key={it.label}
                        href={it.href}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-[rgba(102,224,255,0.08)]"
                      >
                        <span className="text-sm font-medium text-white">{it.label}</span>
                        <span className="text-xs text-[#7fa4bd]">{it.note}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={brand.phoneHref} className="text-sm font-semibold text-[#cfe2f1] transition-colors hover:text-white">
            {brand.phone}
          </a>
          <a href="#start" className="mcs-btn-primary px-5 py-2.5 text-sm">
            Подобрать лот
          </a>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--mcs-line)] lg:hidden"
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
        <div className="border-t border-[var(--mcs-line)] bg-[#04101b]/97 px-5 pb-6 pt-2 backdrop-blur-xl lg:hidden">
          {nav.map((group) => (
            <div key={group.label} className="border-b border-[var(--mcs-line)] py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#66e0ff]">{group.label}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.items.map((it) => (
                  <a key={it.label} href={it.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-1.5 text-sm text-[#cfe2f1]">
                    {it.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <a href="#start" onClick={() => setOpen(false)} className="mcs-btn-primary mt-4 block px-5 py-3 text-center text-sm">
            Подобрать лот
          </a>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-36 md:pb-28 md:pt-44">
      <div className="mcs-aurora" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="mcs-grid" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 text-center md:px-8">
        <div className="mcs-chip mx-auto mb-7 inline-flex items-center gap-2 px-4 py-1.5 text-xs text-[#cfe2f1]">
          <span className="h-2 w-2 rounded-full bg-[#7af0cd] shadow-[0_0_10px_#7af0cd]" />
          База лотов обновляется ежедневно — ₽, $, €
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
          Москва-Сити.
          <br />
          <span className="mcs-gradient-text">Жизнь и бизнес на высоте</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--mcs-muted)] md:text-lg">
          Премиальный портал недвижимости делового центра. Апартаменты, офисы, пентхаусы
          и ритейл в семи небоскрёбах — от студий с видом на реку до резиденций выше 300 метров.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#start" className="mcs-btn-primary px-7 py-3.5 text-sm md:text-base">
            Получить подборку
          </a>
          <a href="#towers" className="mcs-btn-ghost px-7 py-3.5 text-sm md:text-base">
            Смотреть башни
          </a>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--mcs-line)] bg-[var(--mcs-line)] md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#061b2c] px-4 py-6">
              <div className="text-2xl font-extrabold text-white md:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs text-[var(--mcs-muted)] md:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Partners() {
  const row = [...partners, ...partners];
  return (
    <section className="border-y border-[var(--mcs-line)] py-10">
      <p className="mb-7 text-center text-xs uppercase tracking-[0.3em] text-[#7fa4bd]">
        Прямые договоры с застройщиками и партнёрами
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="mcs-marquee px-8">
          {row.map((p, i) => (
            <span key={i} className="whitespace-nowrap text-lg font-semibold tracking-wide text-[#9fbdd4]/70">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div className="mcs-reveal grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#66e0ff]">Почему портал</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            Вся недвижимость Сити <span className="mcs-gradient-text">в одном окне</span>
          </h2>
          <p className="mt-5 max-w-lg text-[var(--mcs-muted)]">
            Семь башен, тысячи лотов и команда брокеров Whitewill. Мы держим базу актуальной,
            показываем честные цены и ведём сделку от заявки до ключей.
          </p>
        </div>
        <ul className="space-y-3">
          {pillars.map((p) => (
            <li key={p} className="mcs-card flex items-center gap-4 px-5 py-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[rgba(102,224,255,0.12)] text-[#66e0ff]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm font-medium text-[#eaf4ff] md:text-base">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Ecosystem() {
  return (
    <section id="towers" className="scroll-mt-20 border-t border-[var(--mcs-line)] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mcs-reveal mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#66e0ff]">Башни делового центра</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            Семь небоскрёбов — <span className="mcs-gradient-text">одна экосистема</span>
          </h2>
          <p className="mt-5 text-[var(--mcs-muted)]">
            Каждая башня — свой характер: высота, статус, виды и инфраструктура.
            Выберите ту, что подходит под вашу задачу.
          </p>
        </div>

        <div className="mcs-reveal mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ecosystem.map((t, i) => (
            <a
              key={t.key}
              href="#start"
              className={`mcs-card group relative flex flex-col p-6 ${i === 0 ? "lg:col-span-2" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#66e0ff]">{t.role}</span>
                  <h3 className="mt-1 text-2xl font-bold text-white">{t.name}</h3>
                </div>
                <span className="rounded-full border border-[var(--mcs-line)] px-3 py-1 text-sm font-semibold text-[#7af0cd]">
                  {t.metric}
                </span>
              </div>
              <p className="mt-4 max-w-md text-sm text-[var(--mcs-muted)]">{t.desc}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#66e0ff] opacity-80 transition-opacity group-hover:opacity-100">
                Смотреть лоты
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const cols = [benefits.buyer, benefits.investor];
  return (
    <section id="benefits" className="scroll-mt-20 mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div className="mcs-reveal grid gap-6 md:grid-cols-2">
        {cols.map((c, i) => (
          <div key={c.title} className="mcs-card p-8 md:p-10">
            <span className="text-xs uppercase tracking-[0.3em] text-[#66e0ff]">
              {i === 0 ? "Купить для себя" : "Купить для дохода"}
            </span>
            <h3 className="mt-3 text-2xl font-bold text-white md:text-3xl">{c.title}</h3>
            <ul className="mt-6 space-y-4">
              {c.points.map((p) => (
                <li key={p} className="flex gap-3 text-[var(--mcs-muted)]">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[rgba(122,240,205,0.15)] text-[#7af0cd]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-sm md:text-base">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function PropertyTypes() {
  return (
    <section id="types" className="scroll-mt-20 border-t border-[var(--mcs-line)] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mcs-reveal mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#66e0ff]">Что можно купить</p>
            <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight md:text-5xl">
              Решение под любую <span className="mcs-gradient-text">задачу</span>
            </h2>
          </div>
          <a href="#start" className="mcs-btn-ghost px-6 py-3 text-sm">
            Подобрать под бюджет
          </a>
        </div>
        <div className="mcs-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {propertyTypes.map((t) => (
            <a key={t.title} href={t.href} className="mcs-card flex flex-col p-6">
              <h3 className="text-xl font-bold text-white">{t.title}</h3>
              <p className="mt-3 flex-1 text-sm text-[var(--mcs-muted)]">{t.desc}</p>
              <ul className="mt-5 space-y-1.5">
                {t.stats.map((s) => (
                  <li key={s} className="text-sm font-medium text-[#9fd6ff]">
                    {s}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#66e0ff]">
                Смотреть
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartBlocks() {
  const hrefs = ["#footer", "#footer", "#footer", brand.telegram];
  return (
    <section id="start" className="scroll-mt-20 mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div className="mcs-reveal mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#66e0ff]">С чего начать</p>
        <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
          Один шаг до <span className="mcs-gradient-text">вашего лота</span>
        </h2>
      </div>
      <div className="mcs-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {startBlocks.map((b, i) => (
          <a key={b.title} href={hrefs[i]} className="mcs-card flex flex-col p-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#4da2ff] to-[#66e0ff] text-[#04121d]">
              <span className="text-lg font-extrabold">{i + 1}</span>
            </span>
            <h3 className="mt-5 text-lg font-bold text-white">{b.title}</h3>
            <p className="mt-2 flex-1 text-sm text-[var(--mcs-muted)]">{b.desc}</p>
            <span className="mt-5 text-sm font-semibold text-[#66e0ff]">{b.cta} →</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Featured() {
  return (
    <section id="featured" className="scroll-mt-20 border-t border-[var(--mcs-line)] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mcs-reveal mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#66e0ff]">Полезное о Сити</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            Аналитика и гиды
          </h2>
        </div>
        <div className="mcs-reveal grid gap-4 md:grid-cols-3">
          {featured.map((f) => (
            <a key={f.title} href="#footer" className="mcs-card group flex flex-col overflow-hidden">
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#0a2a44] to-[#04101b]">
                <div className="mcs-grid opacity-60" aria-hidden />
                <div className="absolute left-4 top-4">
                  <span className="mcs-chip px-3 py-1 text-xs text-[#7af0cd]">{f.tag}</span>
                </div>
                <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(102,224,255,0.5),transparent_70%)] blur-xl" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-bold leading-snug text-white">{f.title}</h3>
                <p className="mt-3 flex-1 text-sm text-[var(--mcs-muted)]">{f.desc}</p>
                <span className="mt-5 text-sm font-semibold text-[#66e0ff] opacity-80 transition-opacity group-hover:opacity-100">
                  Читать →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="about" className="scroll-mt-20 mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <div className="mcs-reveal mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#66e0ff]">Вопросы и ответы</p>
        <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">О недвижимости в Сити</h2>
      </div>
      <div className="mcs-reveal space-y-3">
        {faq.map((f, i) => (
          <div key={i} className="mcs-faq mcs-card overflow-hidden" data-open={open === i}>
            <button
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="text-base font-semibold text-white md:text-lg">{f.q}</span>
              <span className="mcs-faq-chevron grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--mcs-line)] text-[#66e0ff]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div className="mcs-faq-a px-6">
              <p className="pb-5 text-sm text-[var(--mcs-muted)] md:text-base">{f.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <div className="mcs-reveal relative overflow-hidden rounded-3xl border border-[var(--mcs-line)] bg-gradient-to-br from-[#0a2a44] to-[#061b2c] px-6 py-14 text-center md:px-12 md:py-20">
        <div className="mcs-grid opacity-50" aria-hidden />
        <div className="absolute left-1/2 top-0 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(77,162,255,0.4),transparent_70%)] blur-2xl" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">
            Подберём лот в Москва-Сити <span className="mcs-gradient-text">за 7 минут</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[var(--mcs-muted)]">
            Оставьте задачу и бюджет — эксперт пришлёт варианты из всех семи башен.
            Подбор и сопровождение бесплатны.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={brand.whatsapp} className="mcs-btn-primary px-7 py-3.5 text-sm md:text-base">
              Написать в WhatsApp
            </a>
            <a href={brand.phoneHref} className="mcs-btn-ghost px-7 py-3.5 text-sm md:text-base">
              {brand.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="footer" className="scroll-mt-20 border-t border-[var(--mcs-line)] pt-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm text-[var(--mcs-muted)]">
              Премиальный портал недвижимости делового центра Москва-Сити.
              Проект Whitewill — официального партнёра застройщиков.
            </p>
            <div className="mt-6 space-y-1.5 text-sm">
              <a href={brand.phoneHref} className="block font-semibold text-white">{brand.phone}</a>
              <a href={`mailto:${brand.email}`} className="block text-[var(--mcs-muted)]">{brand.email}</a>
              <p className="text-[var(--mcs-muted)]">{brand.address}</p>
            </div>
            <div className="mt-6 flex gap-3">
              {[
                { label: "WhatsApp", href: brand.whatsapp },
                { label: "Telegram", href: brand.telegram },
              ].map((s) => (
                <a key={s.label} href={s.href} className="mcs-chip px-4 py-2 text-xs font-semibold text-[#cfe2f1] transition-colors hover:text-white">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerCols.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#66e0ff]">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm text-[var(--mcs-muted)] transition-colors hover:text-white">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-[var(--mcs-line)] py-7 text-xs text-[#7fa4bd] md:flex-row">
          <p>© {brand.name} Sale. Недвижимость делового центра Москва-Сити.</p>
          <p>Информация на сайте не является публичной офертой.</p>
        </div>
      </div>
    </footer>
  );
}

export function MoscowCityLanding() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal();
  return (
    <div className="mcs" ref={ref}>
      <Header />
      <main>
        <Hero />
        <Partners />
        <Pillars />
        <Ecosystem />
        <Benefits />
        <PropertyTypes />
        <StartBlocks />
        <Featured />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
