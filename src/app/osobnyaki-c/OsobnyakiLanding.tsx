"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";
import {
  brand,
  nav,
  stats,
  heroLot,
  districts,
  collections,
  team,
  magazine,
  posts,
  footerCols,
} from "./data";
import type { CatalogData, Mansion } from "@/lib/osobnyaki/lots";

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

/* 3D-модель особняка (GLB) через web-компонент <model-viewer>.
   poster = фото — показывается мгновенно, пока модель подгружается.
   Камера не крутится на 360°, а покачивается на 90°: фронт = 0°, старт
   на -45°, плавно до +45° и обратно (косинус). На ховере качание ставится
   на паузу, чтобы можно было покрутить модель вручную. */
function ModelViewer({
  src,
  poster,
  alt,
  phase = 0,
}: {
  src: string;
  poster: string;
  alt: string;
  phase?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current as unknown as HTMLElement & { setAttribute: (k: string, v: string) => void };
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.setAttribute("camera-orbit", "-45deg 78deg auto");
      return;
    }
    const T = 11000; // период полного качания (туда-обратно), мс — как прежняя скорость
    const AMP = 45; // амплитуда: -45°..+45°
    let raf = 0;
    let startT = 0;
    let paused = false;
    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
      startT = 0; // ресинк, чтобы продолжить с -45° без рывка (model-viewer сгладит)
    };
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    const tick = (ts: number) => {
      if (!startT) startT = ts - phase * T;
      if (!paused) {
        const t = (ts - startT) / T;
        const theta = -AMP * Math.cos(2 * Math.PI * t); // -45 → +45 → -45
        el.setAttribute("camera-orbit", `${theta.toFixed(2)}deg 78deg auto`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [phase]);

  return createElement("model-viewer" as unknown as "div", {
    ref,
    src,
    poster,
    alt,
    "camera-controls": true,
    "interaction-prompt": "none",
    "disable-zoom": true,
    "camera-orbit": "-45deg 78deg auto",
    "shadow-intensity": "0.7",
    "environment-image": "neutral",
    exposure: "1.05",
    // eager — модель грузится сразу при открытии сайта, а не при появлении
    // в зоне видимости, чтобы не было резкой подмены фото на модель при скролле
    loading: "eager",
    reveal: "auto",
    style: { width: "100%", height: "100%", backgroundColor: "transparent" },
  } as Record<string, unknown>);
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
                  <div className="overflow-hidden rounded-2xl border border-[var(--osb-line)] bg-[var(--osb-surface)]/97 p-2 shadow-[var(--osb-shadow-lg)] backdrop-blur-xl">
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
            Мы включили в каталог отдельно стоящие здания и особняки Москвы.
            Продажа от собственника — без комиссии для покупателя.
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

        {/* Правая колонка — карточка «Предложение недели» */}
        <div className="osb-card overflow-hidden">
          <div className="osb-media aspect-[4/3]">
            {heroLot.model ? (
              <ModelViewer src={heroLot.model} poster={heroLot.img} alt={heroLot.title} phase={0.5} />
            ) : (
              <Img src={heroLot.img} alt={heroLot.title} className="osb-kenburns" />
            )}
            <div className="pointer-events-none absolute left-4 top-4">
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

/* ───────────────────────── Каталог: реальные особняки ─────────────────────────
 * Данные тянем один раз с /api/osobnyaki/lots (сегмент mansions API whitewill).
 * Фильтры и умный поиск работают на клиенте поверх полного списка (429 лотов).
 */

const PRICE_BANDS = [
  { key: "до 200 млн ₽", min: 0, max: 200_000_000 },
  { key: "200–500 млн ₽", min: 200_000_000, max: 500_000_000 },
  { key: "500 млн – 1 млрд ₽", min: 500_000_000, max: 1_000_000_000 },
  { key: "от 1 млрд ₽", min: 1_000_000_000, max: Infinity },
] as const;

const FLOOR_BANDS = [
  { key: "1–2 этажа", min: 1, max: 2 },
  { key: "3–4 этажа", min: 3, max: 4 },
  { key: "от 5 этажей", min: 5, max: Infinity },
] as const;

const SORTS = [
  { value: "featured", label: "Сначала «Выбор Whitewill»" },
  { value: "price_asc", label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
  { value: "area_desc", label: "Больше площадь" },
  { value: "area_asc", label: "Меньше площадь" },
] as const;

const SEARCH_SUGGEST = [
  "Особняк под ресторан",
  "Здание под клинику до 500 млн",
  "Аренда особняка под офис",
  "Резиденция в Хамовниках",
];

type Filters = {
  deal: "sale" | "rent" | null;
  purpose: string[];
  district: string[];
  price: string[];
  floors: string[];
};

const EMPTY_FILTERS: Filters = { deal: null, purpose: [], district: [], price: [], floors: [] };

const filtersActive = (f: Filters, text: string) =>
  f.deal != null ||
  f.purpose.length > 0 ||
  f.district.length > 0 ||
  f.price.length > 0 ||
  f.floors.length > 0 ||
  text.trim().length > 0;

const dealLabel = (d: "sale" | "rent") => (d === "rent" ? "Аренда" : "Продажа");

function priceInBand(price: number, key: string): boolean {
  const b = PRICE_BANDS.find((x) => x.key === key);
  if (!b) return false;
  return price >= b.min && (b.max === Infinity || price < b.max);
}
function floorInBand(floors: number, key: string): boolean {
  const b = FLOOR_BANDS.find((x) => x.key === key);
  if (!b) return false;
  return floors >= b.min && (b.max === Infinity || floors <= b.max);
}

/** Единое правило отбора: structured-фильтры (AND между группами, OR внутри) + полнотекст */
function lotMatches(l: Mansion, f: Filters, text: string): boolean {
  if (f.deal && l.deal !== f.deal) return false;
  if (f.purpose.length && !f.purpose.includes(l.purpose)) return false;
  if (f.district.length && !f.district.includes(l.district)) return false;
  if (f.price.length) {
    if (l.price == null) return false;
    if (!f.price.some((k) => priceInBand(l.price!, k))) return false;
  }
  if (f.floors.length) {
    if (l.floors == null) return false;
    if (!f.floors.some((k) => floorInBand(l.floors!, k))) return false;
  }
  const t = text.trim().toLowerCase();
  if (t) {
    const hay = `${l.title} ${l.address} ${l.district} ${l.purpose} ${l.description}`.toLowerCase();
    for (const tok of t.split(/\s+/).filter(Boolean)) if (!hay.includes(tok)) return false;
  }
  return true;
}

function sortLots(lots: Mansion[], sort: string): Mansion[] {
  const arr = [...lots];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    case "price_desc":
      return arr.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    case "area_desc":
      return arr.sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
    case "area_asc":
      return arr.sort((a, b) => (a.area ?? Infinity) - (b.area ?? Infinity));
    default:
      return arr.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

/* Назначение по ключевым словам — значения совпадают с реальной таксономией API */
const PURPOSE_KEYWORDS: [RegExp, string][] = [
  [/ресторан|кафе|общепит|\bбар\b/i, "ресторан"],
  [/клиник|медиц|стоматолог|бьюти|космет/i, "медицинский центр / клиника"],
  [/банк/i, "банк"],
  [/представит|посольств|штаб|консульств/i, "представительство / штаб-квартира"],
  [/офис|бизнес[\s-]?центр|\bбц\b/i, "офис / бизнес-центр"],
  [/отел|гостиниц/i, "отель / гостиница"],
  [/хостел/i, "хостел"],
  [/резиден|жил|для жизни|усадьб|особняк для себя/i, "жилой особняк / резиденция"],
  [/реконструкц/i, "под реконструкцию"],
  [/редевелоп/i, "редевелопмент"],
  [/образоват|школ|универ|колледж|детский сад|садик|гимназ/i, "образовательное учреждение"],
  [/арендн|готовый бизнес/i, "арендный бизнес"],
];

/** Разбор свободного запроса → структурные фильтры + чипы «Эксперт понял» */
function parseSearch(
  raw: string,
  facets: { districts: string[]; purposes: string[] },
): { filters: Filters; text: string; chips: string[] } | null {
  const text = raw.trim();
  if (!text) return null;
  const low = text.toLowerCase();

  let deal: "sale" | "rent" | null = null;
  if (/аренд|снять|сним|в аренду/.test(low)) deal = "rent";
  else if (/куп|продаж|покупк|приобрес|приобрет/.test(low)) deal = "sale";

  const purpose: string[] = [];
  for (const [re, value] of PURPOSE_KEYWORDS) {
    if (re.test(low) && facets.purposes.includes(value) && !purpose.includes(value)) purpose.push(value);
  }

  // Район: точное вхождение + сопоставление по основе, чтобы ловить падежи
  // («в Хамовниках» → Хамовники, «на Арбате» → Арбат).
  const tokens = low.split(/[^a-zа-яё0-9]+/i).filter(Boolean);
  const district = facets.districts.filter((d) => {
    const dl = d.toLowerCase();
    if (low.includes(dl)) return true;
    if (dl.includes(" ") || dl.includes("-")) return false; // составные — только точно
    const stem = dl.slice(0, Math.max(4, dl.length - 2));
    return tokens.some((t) => t.startsWith(stem) && Math.abs(t.length - dl.length) <= 3);
  });

  const num = (re: RegExp): number | undefined => {
    const m = low.match(re);
    if (!m) return undefined;
    const n = parseFloat(m[1].replace(/\s/g, "").replace(",", "."));
    if (Number.isNaN(n)) return undefined;
    return n * (m[2].startsWith("млрд") ? 1e9 : 1e6);
  };
  let pmax = num(/до\s*([\d\s.,]+)\s*(млрд|млн)/);
  const pmin = num(/от\s*([\d\s.,]+)\s*(млрд|млн)/);
  if (pmax == null && pmin == null) {
    const any = num(/([\d\s.,]+)\s*(млрд|млн)/);
    if (any != null) pmax = any;
  }
  let price: string[] = [];
  if (pmax != null || pmin != null) {
    price = PRICE_BANDS.filter(
      (b) =>
        (pmax == null || b.min < pmax) &&
        (pmin == null || b.max === Infinity || b.max > pmin),
    ).map((b) => b.key);
  }

  const structured = !!deal || purpose.length > 0 || district.length > 0 || price.length > 0;
  const filters: Filters = { deal, purpose, district, price, floors: [] };

  const chips: string[] = [];
  if (deal) chips.push(`Сделка · ${dealLabel(deal)}`);
  purpose.forEach((p) => chips.push(`Назначение · ${p}`));
  district.forEach((d) => chips.push(`Район · ${d}`));
  price.forEach((p) => chips.push(`Цена · ${p}`));
  // если ничего структурного — ищем по тексту, иначе текст не дублируем в фильтр
  if (!structured) chips.push(`Поиск · «${text}»`);

  return { filters, text: structured ? "" : text, chips };
}

/** Хук загрузки каталога особняков */
function useMansions() {
  const [data, setData] = useState<CatalogData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    fetch("/api/osobnyaki/lots")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: CatalogData) => {
        if (alive) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);
  return { data, error, loading };
}

/* Чевронка */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Мультивыбор в выпадашке (назначение / район / цена / этажи) */
function MultiPill({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (opt: string) => void;
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
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--osb-bronze)] px-1 text-[11px] font-semibold text-[var(--osb-surface)]">
            {selected.length}
          </span>
        )}
        <Chevron open={open} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-72 w-72 overflow-auto rounded-2xl border border-[var(--osb-line)] bg-[var(--osb-surface)] p-3 shadow-[var(--osb-shadow-lg)]">
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => onToggle(o)}
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

/** Карточка реального особняка — ведёт на страницу лота whitewill.ru.
 *  rail=true — фиксированная ширина для авто-ленты; иначе тянется по ячейке грида. */
function MansionCard({ l, rail = false }: { l: Mansion; rail?: boolean }) {
  return (
    <a
      href={l.lotLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`osb-card group flex flex-col overflow-hidden ${rail ? "osb-cat-card" : ""}`}
    >
      <div className="osb-media aspect-[4/3]">
        <Img src={l.image} alt={l.title} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="osb-badge">{dealLabel(l.deal)}</span>
          {l.featured && (
            <span className="osb-badge" data-kind="heritage">
              Выбор Whitewill
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs text-[var(--osb-muted)]">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: l.metroColor ?? "var(--osb-bronze)" }}
            aria-hidden
          />
          <span className="truncate">{l.metro ?? l.district ?? "Центр Москвы"}</span>
          {l.metro && l.district && <span className="shrink-0">· {l.district}</span>}
        </div>
        <h3 className="osb-display mt-2 text-2xl leading-snug text-[var(--osb-ink)]">{l.title}</h3>
        <p className="osb-num mt-2 text-[15px] text-[var(--osb-ink-soft)]">
          {[l.areaLabel, l.floorsLabel].filter(Boolean).join(" · ")}
        </p>
        {l.purpose && <p className="mt-1 text-[13px] text-[var(--osb-muted)]">{l.purpose}</p>}
        <div className="mt-4 flex items-end justify-between border-t border-[var(--osb-line)] pt-4">
          <div>
            <div className="osb-display osb-num text-xl text-[var(--osb-ink)]">{l.priceLabel}</div>
            {l.perMLabel && <div className="osb-num mt-0.5 text-xs text-[var(--osb-muted)]">{l.perMLabel}</div>}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[var(--osb-muted)]">№{l.id}</span>
        </div>
      </div>
    </a>
  );
}

/* Карточка-скелет на время загрузки */
function CardSkeleton() {
  return (
    <div className="osb-card flex flex-col overflow-hidden">
      <div className="osb-media aspect-[4/3] osb-skel" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="osb-skel h-3 w-24 rounded" />
        <div className="osb-skel h-6 w-3/4 rounded" />
        <div className="osb-skel h-4 w-1/2 rounded" />
        <div className="osb-skel mt-4 h-6 w-2/3 rounded" />
      </div>
    </div>
  );
}

/**
 * Витрина-лента «Выбор Whitewill»: непрерывный автоскролл по кругу + ручное
 * листание. Показывается, пока не заданы фильтры/поиск.
 */
function FeaturedRail({ lots }: { lots: Mansion[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const base = lots.length ? lots : [];
  const unit = base.length < 6 ? [...base, ...base, ...base] : [...base, ...base];
  const loop = [...unit, ...unit, ...unit];

  useEffect(() => {
    const el = ref.current;
    if (!el || !base.length) return;
    const card = el.querySelector(".osb-cat-card") as HTMLElement | null;
    const period = () => (card ? (card.offsetWidth + 24) * unit.length : el.scrollWidth / 3);

    el.scrollLeft = period();

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

    let pos = el.scrollLeft;
    const SPEED = 0.375;
    let raf = 0;
    const step = () => {
      const p = period();
      if (!paused) {
        pos += SPEED;
        el.scrollLeft = pos;
      } else {
        pos = el.scrollLeft;
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
  }, [lots.length]);

  if (!base.length) return null;

  return (
    <div ref={ref} className="osb-cat-scroll no-scrollbar">
      <div className="osb-cat-track">
        {loop.map((l, i) => (
          <MansionCard key={`${l.deal}-${l.id}-${i}`} l={l} rail />
        ))}
      </div>
    </div>
  );
}

const PER_PAGE = 12;

/** Временно скрыли авто-скроллящуюся витрину «Выбор Whitewill».
 *  Поставь true, чтобы вернуть ленту над сеткой каталога. */
const SHOW_FEATURED_RAIL = false;

function Catalog() {
  const { data, loading, error } = useMansions();
  const [tab, setTab] = useState<"search" | "filters">("search");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [understood, setUnderstood] = useState<string[] | null>(null);
  const [sort, setSort] = useState<string>("featured");
  const [limit, setLimit] = useState(PER_PAGE);

  const facets = data?.facets ?? { districts: [], purposes: [] };
  const active = filtersActive(filters, text);

  const results = useMemo(() => {
    if (!data) return [];
    return sortLots(
      data.lots.filter((l) => lotMatches(l, filters, text)),
      sort,
    );
  }, [data, filters, text, sort]);

  const featured = useMemo(() => {
    if (!data) return [];
    const f = data.lots.filter((l) => l.featured && l.image);
    const pool = (f.length >= 8 ? f : data.lots.filter((l) => l.image)).slice(0, 16);
    return pool;
  }, [data]);

  useEffect(() => {
    setLimit(PER_PAGE);
  }, [filters, text, sort]);

  const toggle = (group: keyof Filters, opt: string) =>
    setFilters((prev) => {
      const cur = (prev[group] as string[]) ?? [];
      const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
      return { ...prev, [group]: next };
    });

  const setDeal = (d: "sale" | "rent" | null) => setFilters((prev) => ({ ...prev, deal: d }));

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setText("");
    setQuery("");
    setUnderstood(null);
  };

  const runSearch = (raw: string) => {
    const parsed = parseSearch(raw, facets);
    if (!parsed) {
      setText("");
      setFilters(EMPTY_FILTERS);
      setUnderstood(null);
      return;
    }
    setFilters({ ...EMPTY_FILTERS, ...parsed.filters });
    setText(parsed.text);
    setUnderstood(parsed.chips);
    setQuery(raw);
    requestAnimationFrame(() =>
      document.getElementById("catalog-results")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const activeChips: { group: keyof Filters; opt: string }[] = [
    ...(filters.deal ? [{ group: "deal" as const, opt: dealLabel(filters.deal) }] : []),
    ...filters.purpose.map((o) => ({ group: "purpose" as const, opt: o })),
    ...filters.district.map((o) => ({ group: "district" as const, opt: o })),
    ...filters.price.map((o) => ({ group: "price" as const, opt: o })),
    ...filters.floors.map((o) => ({ group: "floors" as const, opt: o })),
  ];

  const removeChip = (group: keyof Filters, opt: string) => {
    if (group === "deal") setDeal(null);
    else toggle(group, opt);
  };

  return (
    <section id="catalog" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="osb-reveal mx-auto max-w-3xl text-center">
          <p className="osb-kicker">
            Каталог · {data ? data.counts.total : brand.found} особняков
          </p>
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
                  tab === key ? "bg-[var(--osb-ink)] text-[var(--osb-surface)]" : "text-[var(--osb-ink-soft)] hover:text-[var(--osb-ink)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Контент вкладки */}
        <div className="osb-reveal mx-auto mt-7 max-w-3xl">
          {tab === "search" ? (
            <div>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-5 text-[var(--osb-bronze)]" aria-hidden>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path d="M10 1.5 11.8 7 17.5 8.5l-5.7 2L10 16l-1.8-5.5L2.5 8.5 8.2 7 10 1.5zm7 11 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
                  </svg>
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
                  placeholder="Опишите словами: особняк под ресторан до 500 млн…"
                  aria-label="Умный поиск особняка"
                  className="w-full rounded-full border border-[var(--osb-line-strong)] bg-[var(--osb-surface)] py-4 pr-32 text-[15px] text-[var(--osb-ink)] placeholder:text-[var(--osb-muted)] focus:border-[var(--osb-ink)] focus:outline-none"
                  style={{ paddingLeft: "3.25rem" }}
                />
                <button onClick={() => runSearch(query)} className="osb-btn osb-btn-primary absolute right-2 px-6 py-2.5">
                  Найти
                </button>
              </div>

              {!understood ? (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {SEARCH_SUGGEST.map((s) => (
                    <button key={s} onClick={() => runSearch(s)} className="osb-filter px-3.5 py-1.5 text-[13px]">
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                  <span className="text-sm text-[var(--osb-muted)]">Эксперт понял:</span>
                  {understood.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-[var(--osb-bronze)]/40 bg-[var(--osb-bronze-soft)]/30 px-3 py-1 text-[13px] font-medium text-[var(--osb-bronze-deep)]"
                    >
                      {c}
                    </span>
                  ))}
                  <button onClick={clearAll} className="osb-link text-sm font-medium">
                    сбросить
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <MultiPill label="Назначение" options={facets.purposes} selected={filters.purpose} onToggle={(o) => toggle("purpose", o)} />
                <MultiPill label="Район" options={facets.districts} selected={filters.district} onToggle={(o) => toggle("district", o)} />
                <MultiPill label="Цена" options={PRICE_BANDS.map((b) => b.key)} selected={filters.price} onToggle={(o) => toggle("price", o)} />
                <MultiPill label="Этажи" options={FLOOR_BANDS.map((b) => b.key)} selected={filters.floors} onToggle={(o) => toggle("floors", o)} />
                {active && (
                  <button onClick={clearAll} className="osb-link ml-1 text-sm font-medium">
                    Сбросить всё
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Тулбар: тип сделки · кол-во · сортировка */}
      <div className="mx-auto mt-10 max-w-[1280px] px-5 md:px-8">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-[var(--osb-line)] pb-5 md:flex-row">
          <div className="inline-flex rounded-full border border-[var(--osb-line-strong)] p-1">
            {([
              [null, "Все"],
              ["sale", "Продажа"],
              ["rent", "Аренда"],
            ] as const).map(([key, label]) => (
              <button
                key={label}
                onClick={() => setDeal(key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filters.deal === key ? "bg-[var(--osb-ink)] text-[var(--osb-surface)]" : "text-[var(--osb-ink-soft)] hover:text-[var(--osb-ink)]"
                }`}
              >
                {label}
                {key && data ? <span className="osb-num ml-1.5 text-xs opacity-60">{data.counts[key]}</span> : null}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="osb-num text-sm text-[var(--osb-muted)]">
              {loading ? "Загружаем…" : active ? `Найдено: ${results.length}` : `Всего: ${data?.counts.total ?? 0}`}
            </span>
            <label className="flex items-center gap-2 text-sm text-[var(--osb-muted)]">
              <span className="hidden sm:inline">Сортировка</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-full border border-[var(--osb-line-strong)] bg-[var(--osb-surface)] px-3 py-1.5 text-sm font-medium text-[var(--osb-ink)] focus:border-[var(--osb-ink)] focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Активные чипы */}
        {activeChips.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {activeChips.map(({ group, opt }) => (
              <button
                key={group + opt}
                onClick={() => removeChip(group, opt)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--osb-ink)] px-3 py-1.5 text-[13px] font-medium text-[var(--osb-surface)]"
              >
                {opt}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Результаты */}
      <div id="catalog-results" className="scroll-mt-24 mt-10">
        {error ? (
          <div className="mx-auto max-w-[1280px] px-5 text-center md:px-8">
            <p className="text-[var(--osb-ink-soft)]">
              Не удалось загрузить объекты. Обновите страницу или{" "}
              <a href="#expert" className="osb-link font-medium">
                закажите подбор у эксперта
              </a>
              .
            </p>
          </div>
        ) : loading ? (
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-5 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Витрина «Выбор Whitewill» — авто-лента-showcase, пока нет фильтров/поиска */}
            {SHOW_FEATURED_RAIL && !active && featured.length > 0 && (
              <div className="mb-14">
                <FeaturedRail lots={featured} />
              </div>
            )}
            {results.length === 0 ? (
              <div className="mx-auto max-w-xl px-5 text-center md:px-8">
                <p className="osb-display text-2xl text-[var(--osb-ink)]">Ничего не нашлось</p>
                <p className="mt-3 text-[var(--osb-ink-soft)]">
                  Под такие параметры объектов нет. Сбросьте часть фильтров или закажите подбор —
                  эксперт найдёт варианты за 25 минут.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button onClick={clearAll} className="osb-btn osb-btn-ghost px-6 py-3">
                    Сбросить фильтры
                  </button>
                  <a href="#expert" className="osb-btn osb-btn-primary px-6 py-3">
                    Заказать подбор
                  </a>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-[1280px] px-5 md:px-8">
                {!active && (
                  <p className="osb-kicker mb-6 text-center">Все особняки в каталоге</p>
                )}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {results.slice(0, limit).map((l) => (
                    <MansionCard key={`${l.deal}-${l.id}`} l={l} />
                  ))}
                </div>
                {results.length > limit && (
                  <div className="mt-10 flex justify-center">
                    <button onClick={() => setLimit((n) => n + PER_PAGE)} className="osb-btn osb-btn-ghost px-7 py-3.5">
                      Показать ещё {Math.min(PER_PAGE, results.length - limit)} из {results.length}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
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
            Особняки, собранные <span className="osb-italic">экспертами</span>
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
                {c.model ? (
                  <ModelViewer src={c.model} poster={c.img} alt={c.title} phase={i * 0.18} />
                ) : (
                  <Img src={c.img} alt={c.title} />
                )}
                <div className="pointer-events-none absolute left-4 top-4">
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
          <p className="osb-kicker" style={{ color: "var(--osb-bronze-soft)" }}>Бесплатный сервис</p>
          <h2 className="osb-display mx-auto mt-4 max-w-3xl text-3xl text-[var(--osb-surface)] md:text-5xl">
            Эксперт проекта за 25 минут подберёт{" "}
            <span className="osb-italic" style={{ color: "var(--osb-bronze-soft)" }}>2–5 особняков</span> под вашу задачу
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[var(--osb-surface)]/70" style={{ textWrap: "pretty" }}>
            Расскажите бюджет, район и назначение — пришлём актуальные объекты с фото,
            планами и честными ценами. Подбор и показы бесплатны.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={brand.whatsapp} className="osb-btn bg-[var(--osb-paper)] px-7 py-3.5 text-[var(--osb-ink)] hover:bg-[var(--osb-paper-2)]">
              Заказать подбор особняка
            </a>
            <a
              href="#sell"
              className="osb-btn px-7 py-3.5 text-[var(--osb-surface)] ring-1 ring-inset ring-white/30 hover:ring-white/70"
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
            Эксперты проекта osobnyaki.com — часть Whitewill. Знают переулки
            Москвы и тонкости сделок с памятниками архитектуры.
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
      <div className="osb-reveal grid items-center gap-10 overflow-hidden rounded-[28px] border border-[var(--osb-line)] bg-[var(--osb-surface)] md:grid-cols-[0.9fr_1.1fr]">
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
          <a href="https://osobnyaki.com/blog" target="_blank" rel="noopener noreferrer" className="osb-link hidden text-sm font-semibold sm:inline">
            Все статьи →
          </a>
        </div>
        <div className="osb-reveal grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <a key={p.title} href={p.href} target="_blank" rel="noopener noreferrer" className="osb-card group flex flex-col overflow-hidden">
              <div className="osb-media aspect-[16/10]">
                <Img src={p.img} alt={p.title} />
                <div className="absolute left-3 top-3">
                  <span className="osb-chip px-3 py-1 text-xs font-medium text-[var(--osb-ink)]">{p.tag}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="osb-display flex-1 text-xl leading-snug text-[var(--osb-ink)]">{p.title}</h3>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[var(--osb-bronze-deep)]">
                  Читать на osobnyaki.com →
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
    <footer id="footer" className="scroll-mt-24 bg-[var(--osb-ink)] pt-16 text-[var(--osb-surface)]">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[var(--osb-surface)]/60" style={{ textWrap: "pretty" }}>
              Отдельно стоящие здания и особняки Москвы в одном каталоге.
              Проект Whitewill — продажа от собственника без комиссии для покупателя.
            </p>
            <div className="mt-6 space-y-1.5 text-sm">
              <a href={brand.phoneHref} className="block font-semibold osb-num">
                {brand.phone}
              </a>
              <a href={`mailto:${brand.email}`} className="block text-[var(--osb-surface)]/65">
                {brand.email}
              </a>
              <p className="text-[var(--osb-surface)]/65">{brand.address}</p>
            </div>
            <div className="mt-6 flex gap-3">
              {[
                { label: "WhatsApp", href: brand.whatsapp },
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
                      <a href={l.href} className="text-sm text-[var(--osb-surface)]/65 transition-colors hover:text-[var(--osb-surface)]">
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
          <p className="text-xs leading-relaxed text-[var(--osb-surface)]/45" style={{ textWrap: "pretty" }}>
            Информация на сайте носит справочный характер и не является публичной офертой,
            определяемой положениями ст. 437 (2) ГК РФ. Все цены и характеристики объектов
            необходимо уточнять у экспертов проекта.
          </p>
          <div className="mt-5 flex flex-col items-center justify-between gap-3 text-xs text-[var(--osb-surface)]/50 md:flex-row">
            <p>© 2026 osobnyaki.com · проект Whitewill</p>
            <p>Москва · {brand.found} особняков в каталоге</p>
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
      <div className="osb-card flex flex-col items-start gap-3 bg-[var(--osb-surface)]/95 p-4 shadow-[var(--osb-shadow-lg)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
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
  // Регистрируем web-компонент <model-viewer> только на клиенте.
  useEffect(() => {
    import("@google/model-viewer").catch(() => {});
  }, []);
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
