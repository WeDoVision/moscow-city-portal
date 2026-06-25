"use client";

import { useEffect, useRef, useState } from "react";
import {
  brand,
  nav,
  stats,
  heroLot,
  districts,
  listings,
  collections,
  team,
  browse,
  magazine,
  posts,
  footerCols,
} from "./data";

/* Появление секций при скролле */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".osb-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.14 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* Картинка с градиент-плейсхолдером: если фото не загрузилось — прячем img,
   остаётся тёплый градиент-подложка из .osb-media. */
function Img({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      className={className}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.opacity = "0";
      }}
    />
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#top" className="flex items-center gap-3" aria-label={brand.name}>
      <span
        className={`grid h-10 w-10 place-items-center rounded-xl border ${
          light ? "border-white/25 text-white" : "border-[var(--osb-line-strong)] text-[var(--osb-ink)]"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 21V10l8-6 8 6v11M9 21v-6h6v6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="leading-tight">
        <span className={`block text-lg font-semibold tracking-tight ${light ? "text-white" : "text-[var(--osb-ink)]"}`}>
          {brand.logoTop}
          <span className="text-[var(--osb-bronze)]">{brand.logoDot}</span>
        </span>
        <span className={`block text-[10px] tracking-[0.18em] ${light ? "text-white/55" : "text-[var(--osb-muted)]"}`}>
          {brand.tagline.toUpperCase()}
        </span>
      </span>
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  const [solid, setSolid] = useState(false);
  const [lang, setLang] = useState<"РУС" | "ENG">("РУС");

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-[var(--osb-line)] bg-[var(--osb-paper)]/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setMenu(null)}>
          {nav.map((group, i) => (
            <div key={group.label} className="relative" onMouseEnter={() => setMenu(i)}>
              <button className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-[var(--osb-ink-soft)] transition-colors hover:text-[var(--osb-ink)]">
                {group.label}
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`transition-transform ${menu === i ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {menu === i && (
                <div className="absolute left-0 top-full w-72 pt-2">
                  <div className="overflow-hidden rounded-2xl border border-[var(--osb-line)] bg-[var(--osb-paper)]/97 p-2 shadow-[var(--osb-shadow-lg)] backdrop-blur-xl">
                    {group.items.map((it) => (
                      <a
                        key={it.label}
                        href={it.href}
                        onClick={() => setMenu(null)}
                        className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--osb-paper-2)]"
                      >
                        <span className="text-sm font-medium text-[var(--osb-ink)]">{it.label}</span>
                        <span className="text-xs text-[var(--osb-muted)]">{it.note}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="flex items-center gap-1 text-xs font-semibold text-[var(--osb-muted)]">
            {(["РУС", "ENG"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-2 py-1 transition-colors ${
                  lang === l ? "text-[var(--osb-ink)]" : "hover:text-[var(--osb-ink-soft)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <a href={brand.phoneHref} className="text-sm font-semibold text-[var(--osb-ink)] osb-num">
            {brand.phone}
          </a>
          <a href="#expert" className="osb-btn osb-btn-primary px-5 py-2.5">
            Заказать звонок
          </a>
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
                    href={it.href}
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
          <a href="#expert" onClick={() => setOpen(false)} className="osb-btn osb-btn-primary mt-3 w-full px-5 py-3">
            Заказать звонок
          </a>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative pt-[112px] md:pt-[132px]">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 pb-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pb-24">
        {/* Левая колонка — заголовок и оффер */}
        <div>
          <div className="osb-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-[var(--osb-ink-soft)]">
            <span className="osb-dot h-2 w-2 rounded-full bg-[var(--osb-bronze)]" />
            {brand.hours}
          </div>
          <h1 className="osb-display mt-6 text-5xl md:text-7xl">
            Купить особняк в Москве
            <br />
            теперь <span className="osb-italic">легко</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--osb-ink-soft)] md:text-xl" style={{ textWrap: "pretty" }}>
            Мы включили в каталог каждое отдельно стоящее здание и особняк в центре
            Москвы. Продажа от собственника — без комиссии для покупателя.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#expert" className="osb-btn osb-btn-primary px-7 py-3.5">
              Заказать подбор особняка
            </a>
            <a href="#catalog" className="osb-btn osb-btn-ghost px-7 py-3.5">
              Смотреть каталог
            </a>
          </div>

          <div className="mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="osb-display osb-num text-3xl text-[var(--osb-ink)] md:text-4xl">{s.value}</div>
                <div className="mt-1 text-xs leading-snug text-[var(--osb-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Правая колонка — карточка «объект месяца» */}
        <div className="osb-card overflow-hidden">
          <div className="osb-media aspect-[4/3]">
            <Img src={heroLot.img} alt={heroLot.title} className="osb-kenburns" />
            <div className="absolute left-4 top-4">
              <span className="osb-badge" data-kind="heritage">
                {heroLot.badge}
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4 p-6">
            <div>
              <h3 className="osb-display text-2xl text-[var(--osb-ink)]">{heroLot.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--osb-muted)]">{heroLot.meta}</p>
            </div>
            <a href="#catalog" className="osb-btn osb-btn-ghost shrink-0 px-5 py-2.5">
              Посмотреть
            </a>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--osb-line)] px-6 py-4">
            <span className="osb-display osb-num text-2xl text-[var(--osb-ink)]">{heroLot.price}</span>
            <span className="osb-num text-sm text-[var(--osb-muted)]">{heroLot.perM}</span>
          </div>
        </div>
      </div>

      {/* Бегущая лента районов */}
      <div className="border-y border-[var(--osb-line)] bg-[var(--osb-paper-2)]/50 py-5">
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="osb-marquee px-6">
            {[...districts, ...districts].map((d, i) => (
              <span key={i} className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-[var(--osb-muted)]">
                <span className="h-1 w-1 rounded-full bg-[var(--osb-bronze)]" />
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Закрытие поповера по клику снаружи */
function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  });
  return ref;
}

const PRICE_OPTS = ["до 200 млн ₽", "200–500 млн ₽", "500 млн – 1 млрд ₽", "от 1 млрд ₽"];
const FLOOR_OPTS = ["1–2 этажа", "3–4 этажа", "от 5 этажей"];

const FILTER_GROUPS = [
  { key: "Назначение", options: browse.purpose.tags },
  { key: "Район", options: browse.district.tags },
  { key: "Тип", options: browse.type.tags },
  { key: "Цена", options: PRICE_OPTS },
  { key: "Этажи", options: FLOOR_OPTS },
];

const SEARCH_SUGGEST = [
  "Особняк под ресторан в центре",
  "ОКН с территорией до 500 млн",
  "Здание под клинику у метро",
  "Усадьба под резиденцию",
];

/* Чевронка */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterPill({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (group: string, opt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(() => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="osb-filter flex items-center gap-2 px-4 py-2 text-sm font-medium"
        data-active={selected.length > 0}
      >
        {label}
        {selected.length > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--osb-bronze)] px-1 text-[11px] font-semibold text-[var(--osb-paper)]">
            {selected.length}
          </span>
        )}
        <Chevron open={open} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-[var(--osb-line)] bg-[var(--osb-paper)] p-3 shadow-[var(--osb-shadow-lg)]">
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => onToggle(label, o)}
                className="osb-filter px-3 py-1.5 text-sm"
                data-active={selected.includes(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Умный поиск — описываешь особняк словами, эксперт понимает запрос */
function CatalogSearch() {
  const [value, setValue] = useState("");
  const [understood, setUnderstood] = useState<string[] | null>(null);

  const run = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setValue(t);
    const low = t.toLowerCase();
    const map: [string, string][] = [
      ["ресторан", "Назначение · ресторан"],
      ["клиник", "Назначение · клиника"],
      ["офис", "Назначение · офис"],
      ["банк", "Назначение · банк"],
      ["отел", "Назначение · отель"],
      ["посольств", "Назначение · посольство"],
      ["окн", "Статус · ОКН"],
      ["памятник", "Статус · ОКН"],
      ["территор", "Тип · с территорией"],
      ["усадьб", "Тип · усадьба"],
      ["без ремонт", "Тип · без ремонта"],
      ["ремонт", "Тип · с ремонтом"],
      ["реконструкц", "Тип · реконструкция"],
      ["резиден", "Под резиденцию"],
    ];
    const found: string[] = [];
    for (const [k, l] of map) if (low.includes(k) && !found.includes(l)) found.push(l);
    for (const d of browse.district.tags) if (low.includes(d.toLowerCase())) found.push(`Район · ${d}`);
    const price = t.match(/(\d[\d\s]*)\s*млн/);
    if (price) found.push(`Цена · до ${price[1].trim()} млн ₽`);
    setUnderstood(found.length ? found : ["Поиск по всему каталогу"]);
    document.getElementById("catalog-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-5 text-[var(--osb-bronze)]" aria-hidden>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M10 1.5 11.8 7 17.5 8.5l-5.7 2L10 16l-1.8-5.5L2.5 8.5 8.2 7 10 1.5zm7 11 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(value)}
          placeholder="Опишите словами: особняк под ресторан с территорией до 500 млн…"
          aria-label="Умный поиск особняка"
          className="w-full rounded-full border border-[var(--osb-line-strong)] bg-[oklch(1_0_0_/_0.6)] py-4 pl-13 pr-32 text-[15px] text-[var(--osb-ink)] placeholder:text-[var(--osb-muted)] focus:border-[var(--osb-bronze)] focus:outline-none"
          style={{ paddingLeft: "3.25rem" }}
        />
        <button onClick={() => run(value)} className="osb-btn osb-btn-primary absolute right-2 px-6 py-2.5">
          Найти
        </button>
      </div>

      {!understood && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SEARCH_SUGGEST.map((s) => (
            <button
              key={s}
              onClick={() => run(s)}
              className="osb-filter px-3.5 py-1.5 text-[13px]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {understood && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span className="text-sm text-[var(--osb-muted)]">Эксперт понял:</span>
          {understood.map((c) => (
            <span key={c} className="rounded-full border border-[var(--osb-bronze)]/40 bg-[var(--osb-bronze-soft)]/30 px-3 py-1 text-[13px] font-medium text-[var(--osb-bronze-deep)]">
              {c}
            </span>
          ))}
          <span className="text-sm text-[var(--osb-muted)]">— подберём точнее за 25 минут</span>
        </div>
      )}
    </div>
  );
}

type Listing = (typeof listings)[number];

function ListingCard({ l }: { l: Listing }) {
  return (
    <a href="#expert" className="osb-cat-card osb-card group flex flex-col overflow-hidden">
      <div className="osb-media aspect-[4/3]">
        <Img src={l.img} alt={l.title} />
        <div className="absolute left-3 top-3">
          <span className="osb-badge">{l.tag}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-[var(--osb-muted)]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 2c3.9 0 7 3 7 6.9 0 4.6-7 12.1-7 12.1S5 13.5 5 8.9C5 5 8.1 2 12 2z" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          {l.metro}
          <span className="osb-num">· №{l.id}</span>
        </div>
        <h3 className="osb-display mt-2 text-2xl leading-snug text-[var(--osb-ink)]">{l.title}</h3>
        <p className="osb-num mt-2 text-[15px] text-[var(--osb-ink-soft)]">
          {l.area} · {l.floors}
        </p>
        <div className="mt-4 flex items-end justify-between border-t border-[var(--osb-line)] pt-4">
          <div>
            <div className="osb-display osb-num text-xl text-[var(--osb-ink)]">{l.price}</div>
            <div className="osb-num mt-0.5 text-xs text-[var(--osb-muted)]">{l.perM}</div>
          </div>
          {l.rent && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-[var(--osb-muted)]">аренда</div>
              <div className="osb-num text-sm font-semibold text-[var(--osb-bronze-deep)]">{l.rent}</div>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

function FiltersPanel() {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const toggle = (group: string, opt: string) =>
    setFilters((prev) => {
      const cur = prev[group] ?? [];
      const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
      return { ...prev, [group]: next };
    });
  const clearAll = () => setFilters({});
  const activeChips = Object.entries(filters).flatMap(([g, opts]) => opts.map((o) => ({ g, o })));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {FILTER_GROUPS.map((g) => (
          <FilterPill key={g.key} label={g.key} options={g.options} selected={filters[g.key] ?? []} onToggle={toggle} />
        ))}
        {activeChips.length > 0 && (
          <button onClick={clearAll} className="osb-link ml-1 text-sm font-medium">
            Сбросить всё
          </button>
        )}
      </div>
      {activeChips.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {activeChips.map(({ g, o }) => (
            <button
              key={g + o}
              onClick={() => toggle(g, o)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--osb-ink)] px-3 py-1.5 text-[13px] font-medium text-[var(--osb-paper)]"
            >
              {o}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/*
 * Лента каталога: непрерывный автоскролл «по кругу» (через scrollLeft, не
 * CSS-анимацией) + ручное листание — колесо, тач-свайп и перетаскивание мышью.
 * Контент утроен; при выходе за пределы одной «копии» прыгаем на копию назад —
 * бесшовно, потому что карточки идентичны.
 */
function CatalogRail() {
  const ref = useRef<HTMLDivElement>(null);
  // «Юнит» = объекты ×2 (шире вьюпорта), лента = юнит ×3 → бесшовный цикл.
  const unit = [...listings, ...listings];
  const loop = [...unit, ...unit, ...unit];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector(".osb-cat-card") as HTMLElement | null;
    const period = () => (card ? (card.offsetWidth + 24) * unit.length : el.scrollWidth / 3);

    el.scrollLeft = period(); // стартуем в средней копии — листать можно в обе стороны

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let paused = reduce ?? false;
    let resumeT: ReturnType<typeof setTimeout>;
    const nudgePause = (ms = 1800) => {
      paused = true;
      clearTimeout(resumeT);
      resumeT = setTimeout(() => {
        if (!reduce) paused = false;
      }, ms);
    };

    // Дробный аккумулятор: scrollLeft в некоторых браузерах округляется до целого,
    // поэтому копим позицию во float и присваиваем целиком (иначе мелкий шаг «теряется»).
    let pos = el.scrollLeft;
    const SPEED = 0.375; // как было (0.5), но на 25% медленнее
    let raf = 0;
    const step = () => {
      const p = period();
      if (!paused) {
        pos += SPEED;
        el.scrollLeft = pos;
      } else {
        pos = el.scrollLeft; // ресинк при ручном листании / паузе
      }
      if (el.scrollLeft >= 2 * p) {
        el.scrollLeft -= p;
        pos = el.scrollLeft;
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft += p;
        pos = el.scrollLeft;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const onEnter = () => {
      if (!reduce) paused = true;
    };
    const onLeave = () => {
      if (!reduce) paused = false;
    };
    const onManual = () => nudgePause();
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("wheel", onManual, { passive: true });
    el.addEventListener("touchmove", onManual, { passive: true });

    // перетаскивание мышью
    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      down = true;
      moved = 0;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      paused = true;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      nudgePause();
    };
    const onClick = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeT);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("wheel", onManual);
      el.removeEventListener("touchmove", onManual);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div ref={ref} className="osb-cat-scroll no-scrollbar">
      <div className="osb-cat-track">
        {loop.map((l, i) => (
          <ListingCard key={`${l.id}-${i}`} l={l} />
        ))}
      </div>
    </div>
  );
}

function Catalog() {
  const [tab, setTab] = useState<"search" | "filters">("search");

  return (
    <section id="catalog" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="osb-reveal mx-auto max-w-3xl text-center">
          <p className="osb-kicker">Каталог · {brand.found} особняков</p>
          <h2 className="osb-display mt-3 text-3xl md:text-5xl">
            Найдите особняк <span className="osb-italic">под задачу</span>
          </h2>
        </div>

        {/* Вкладки: Умный поиск / Фильтры */}
        <div className="osb-reveal mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-[var(--osb-line-strong)] p-1">
            {([
              ["search", "Умный поиск"],
              ["filters", "Фильтры"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                  tab === key ? "bg-[var(--osb-ink)] text-[var(--osb-paper)]" : "text-[var(--osb-ink-soft)] hover:text-[var(--osb-ink)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Контент вкладки */}
        <div className="osb-reveal mx-auto mt-7 max-w-3xl">
          {tab === "search" ? <CatalogSearch /> : <FiltersPanel />}
        </div>
      </div>

      {/* Лента каталога: автоскролл по кругу + ручное листание */}
      <div id="catalog-results" className="osb-reveal scroll-mt-24 mt-14">
        <CatalogRail />
      </div>
    </section>
  );
}

/* WOW-секция: стопка карточек-коллекций со скролл-наездом (pieterkoopt) */
function Collections() {
  return (
    <section id="collections" className="border-t border-[var(--osb-line)] bg-[var(--osb-paper-2)]/40 py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="osb-reveal mx-auto mb-14 max-w-2xl text-center">
          <p className="osb-kicker">Авторские подборки</p>
          <h2 className="osb-display mt-3 text-3xl md:text-5xl">
            Особняки, собранные <span className="osb-italic">по смыслу</span>
          </h2>
          <p className="mt-5 text-lg text-[var(--osb-ink-soft)] md:text-xl" style={{ textWrap: "pretty" }}>
            Тематические подборки от экспертов проекта — под жизнь, ресторан, отель
            или клинику. Прокрутите, чтобы пролистать колоду.
          </p>
        </div>
      </div>

      <div className="osb-stack mx-auto max-w-[1120px] px-5 md:px-8">
        {collections.map((c, i) => (
          <div key={c.title} className="osb-stack-item">
            <div className="osb-card grid overflow-hidden md:grid-cols-2">
              <div className={`osb-media min-h-[320px] md:min-h-[500px] ${i % 2 === 1 ? "md:order-2" : ""}`}>
                <Img src={c.img} alt={c.title} />
                <div className="absolute left-4 top-4">
                  <span className="osb-badge" data-kind="heritage">{c.tag}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center p-9 md:p-14">
                <p className="osb-kicker">{c.kicker}</p>
                <h3 className="osb-display mt-4 text-4xl text-[var(--osb-ink)] md:text-5xl">{c.title}</h3>
                <p className="mt-5 text-lg leading-relaxed text-[var(--osb-ink-soft)] md:text-xl" style={{ textWrap: "pretty" }}>
                  {c.desc}
                </p>
                <div className="mt-8 flex items-center gap-5">
                  <a href="#catalog" className="osb-btn osb-btn-primary px-7 py-3.5 text-base">
                    Смотреть подборку
                  </a>
                  <span className="osb-num text-sm font-semibold text-[var(--osb-bronze-deep)]">{c.count}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* хвостовой запас прокрутки — последняя карточка дольше держится по центру */}
        <div aria-hidden className="h-[70vh]" />
      </div>
    </section>
  );
}

function Expert() {
  return (
    <section id="expert" className="scroll-mt-24 mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
      <div className="osb-reveal relative overflow-hidden rounded-[28px] border border-[var(--osb-line)] bg-[var(--osb-ink)] px-6 py-14 text-center md:px-12 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--osb-bronze-soft), transparent 45%), radial-gradient(circle at 80% 90%, var(--osb-bronze), transparent 45%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <p className="osb-kicker text-[var(--osb-bronze-soft)]">Бесплатный сервис</p>
          <h2 className="osb-display mx-auto mt-4 max-w-3xl text-3xl text-[var(--osb-paper)] md:text-5xl">
            Эксперт проекта за 25 минут подберёт{" "}
            <span className="osb-italic text-[var(--osb-bronze-soft)]">2–5 особняков</span> под вашу задачу
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[var(--osb-paper)]/70" style={{ textWrap: "pretty" }}>
            Расскажите бюджет, район и назначение — пришлём актуальные объекты с фото,
            планами и честными ценами. Подбор и показы бесплатны.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={brand.whatsapp} className="osb-btn bg-[var(--osb-bronze)] px-7 py-3.5 text-[var(--osb-ink)] hover:bg-[var(--osb-bronze-soft)]">
              Заказать подбор особняка
            </a>
            <a
              href="#sell"
              className="osb-btn px-7 py-3.5 text-[var(--osb-paper)] ring-1 ring-inset ring-white/25 hover:ring-[var(--osb-bronze)]"
            >
              Продать особняк
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section id="team" className="scroll-mt-24 border-t border-[var(--osb-line)] py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="osb-reveal mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="osb-kicker">Команда</p>
            <h2 className="osb-display mt-3 max-w-xl text-3xl md:text-5xl">
              Кто ведёт ваш <span className="osb-italic">особняк</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-[var(--osb-ink-soft)]">
            Эксперты проекта особняки.com — часть Whitewill. Знают каждый переулок
            центра и тонкости сделок с памятниками архитектуры.
          </p>
        </div>
        <div className="osb-reveal grid gap-6 sm:grid-cols-3">
          {team.map((m) => (
            <div key={m.name} className="osb-card group overflow-hidden">
              <div className="osb-media aspect-[4/5]">
                <Img src={m.img} alt={m.name} />
              </div>
              <div className="p-6">
                <h3 className="osb-display text-2xl text-[var(--osb-ink)]">{m.name}</h3>
                <p className="mt-1 text-sm font-medium text-[var(--osb-bronze-deep)]">{m.role}</p>
                <p className="mt-2 text-sm text-[var(--osb-muted)]">{m.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Magazine() {
  return (
    <section id="magazine" className="scroll-mt-24 mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
      <div className="osb-reveal grid items-center gap-10 overflow-hidden rounded-[28px] border border-[var(--osb-line)] bg-[var(--osb-paper)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="osb-media aspect-[3/4] max-h-[440px]">
          <Img src={magazine.cover} alt={magazine.title} />
        </div>
        <div className="p-8 md:p-12">
          <p className="osb-kicker">Журнал · PDF</p>
          <h2 className="osb-display mt-3 text-3xl text-[var(--osb-ink)] md:text-4xl">{magazine.title}</h2>
          <p className="mt-4 leading-relaxed text-[var(--osb-ink-soft)]" style={{ textWrap: "pretty" }}>
            {magazine.desc}
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm text-[var(--osb-muted)]">
            <span className="osb-num">{magazine.size}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--osb-bronze)]" />
            <span className="osb-num">{magazine.updated}</span>
          </div>
          <a href="#expert" className="osb-btn osb-btn-primary mt-8 px-7 py-3.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Скачать PDF
          </a>
        </div>
      </div>
    </section>
  );
}

function Blog() {
  return (
    <section id="blog" className="scroll-mt-24 border-t border-[var(--osb-line)] py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="osb-reveal mb-12 flex items-end justify-between">
          <div>
            <p className="osb-kicker">Блог</p>
            <h2 className="osb-display mt-3 text-3xl md:text-5xl">Про особняки Москвы</h2>
          </div>
          <a href="#blog" className="osb-link hidden text-sm font-semibold sm:inline">
            Все статьи →
          </a>
        </div>
        <div className="osb-reveal grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <a key={p.title} href="#blog" className="osb-card group flex flex-col overflow-hidden">
              <div className="osb-media aspect-[16/10]">
                <Img src={p.img} alt={p.title} />
                <div className="absolute left-3 top-3">
                  <span className="osb-chip px-3 py-1 text-xs font-medium text-[var(--osb-ink)]">{p.tag}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="osb-display flex-1 text-xl leading-snug text-[var(--osb-ink)]">{p.title}</h3>
                <div className="mt-4 flex items-center gap-2 text-xs text-[var(--osb-muted)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  <span className="osb-num">{p.views}</span> просмотров
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="footer" className="scroll-mt-24 bg-[var(--osb-ink)] pt-16 text-[var(--osb-paper)]">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[var(--osb-paper)]/60" style={{ textWrap: "pretty" }}>
              Все отдельно стоящие здания и особняки центра Москвы в одном каталоге.
              Проект Whitewill — продажа от собственника без комиссии для покупателя.
            </p>
            <div className="mt-6 space-y-1.5 text-sm">
              <a href={brand.phoneHref} className="block font-semibold osb-num">
                {brand.phone}
              </a>
              <a href={`mailto:${brand.email}`} className="block text-[var(--osb-paper)]/65">
                {brand.email}
              </a>
              <p className="text-[var(--osb-paper)]/65">{brand.address}</p>
            </div>
            <div className="mt-6 flex gap-3">
              {[
                { label: "WhatsApp", href: brand.whatsapp },
                { label: "Telegram", href: brand.telegram },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold transition-colors hover:border-[var(--osb-bronze)] hover:text-[var(--osb-bronze-soft)]"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerCols.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--osb-bronze-soft)]">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm text-[var(--osb-paper)]/65 transition-colors hover:text-[var(--osb-paper)]">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 py-7">
          <p className="text-xs leading-relaxed text-[var(--osb-paper)]/45" style={{ textWrap: "pretty" }}>
            Информация на сайте носит справочный характер и не является публичной офертой,
            определяемой положениями ст. 437 (2) ГК РФ. Все цены и характеристики объектов
            необходимо уточнять у экспертов проекта.
          </p>
          <div className="mt-5 flex flex-col items-center justify-between gap-3 text-xs text-[var(--osb-paper)]/50 md:flex-row">
            <p>© 2026 особняки.com · проект Whitewill</p>
            <p>Москва · центр · {brand.found} особняков в каталоге</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CookieBar() {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl">
      <div className="osb-card flex flex-col items-start gap-3 bg-[var(--osb-paper)]/95 p-4 shadow-[var(--osb-shadow-lg)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <p className="flex-1 text-sm text-[var(--osb-ink-soft)]">
          Этот сайт использует cookie, чтобы каталог особняков работал удобнее. Продолжая
          просмотр, вы соглашаетесь с политикой конфиденциальности.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <a href="#footer" className="osb-link text-sm font-semibold">
            Узнать больше
          </a>
          <button onClick={() => setShow(false)} className="osb-btn osb-btn-primary px-5 py-2.5">
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}

export function OsobnyakiLanding() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal();
  return (
    <div className="osb" ref={ref}>
      <Header />
      <main>
        <Hero />
        <Catalog />
        <Collections />
        <Expert />
        <Team />
        <Magazine />
        <Blog />
      </main>
      <Footer />
      <CookieBar />
    </div>
  );
}
