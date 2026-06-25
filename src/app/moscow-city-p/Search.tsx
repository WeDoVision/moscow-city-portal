"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { portal } from "@/portal.config";
import {
  CATEGORIES,
  COMPLEX_OPTIONS,
  DECORATION_OPTIONS,
  DEVELOPERS,
  type CatalogCounts,
  type CatalogQuery,
  type LotCard as LotCardType,
  type LotFilterResult,
} from "@/lib/whitewill/types";
import { catalogQueryToParams } from "@/lib/whitewill/query";
import { imageUrl, lotHeadline } from "@/lib/whitewill/client";
import { track } from "@/lib/analytics";

/* ──────────────────────────────────────────────────────────────────────
 * Поиск лотов + AI-поиск для портала /moscow-city-p.
 * Перенесён со старого портала (компоненты Catalog + SmartSearch) и
 * полностью редизайнен под визуальный язык .mcp (sui.io):
 * светлая секция, синий акцент #1aa3ff, прямоугольная геометрия,
 * моноширинные метки. Логика/типы/эндпоинты переиспользованы.
 * URL-синк намеренно убран — блок живёт внутри лендинга, не на
 * отдельном маршруте каталога.
 * ─────────────────────────────────────────────────────────────────── */

const SUGGESTIONS = [
  "Однушка до 60 млн с отделкой",
  "Видовая квартира на высоком этаже",
  "Без отделки под свой ремонт",
  "Двушка с паркингом",
];

const ROOM_OPTIONS = [
  { value: "0", label: "Студия" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4+", label: "4+" },
];

const SORT_OPTIONS = [
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "area_asc", label: "По возрастанию площади" },
  { value: "area_desc", label: "По убыванию площади" },
];

const CAT_LABELS: Record<string, string> = {
  flat: "Квартиры",
  apartment: "Апартаменты",
  office: "Офисы",
  retail: "Ритейл",
};
const ROOM_LABELS: Record<string, string> = {
  "0": "Студия",
  "1": "1 сп.",
  "2": "2 сп.",
  "3": "3 сп.",
  "4+": "4+ сп.",
};
const DECOR_LABELS: Record<string, string> = {
  with_decoration: "С отделкой",
  without_decoration: "Без отделки",
  whitebox: "White box",
};

function fmtMln(n: number | undefined): string {
  if (n == null) return "";
  return n >= 1_000_000 ? String(Math.round(n / 1_000_000)) : String(n);
}

function plural(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "предложение";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "предложения";
  return "предложений";
}

/** человекочитаемые чипы того, что понял AI-поиск */
function buildChips(f: Partial<CatalogQuery>): string[] {
  const chips: string[] = [];
  if (f.deal === "rent") chips.push("Аренда");
  if (f.category) chips.push(CAT_LABELS[f.category] ?? f.category);
  if (f.rooms?.length) chips.push(f.rooms.map((r) => ROOM_LABELS[r] ?? r).join(", "));
  if (f.towers?.length) {
    chips.push(
      f.towers
        .map((id) => portal.towers.find((t) => t.id === id)?.name ?? String(id))
        .join(", "),
    );
  }
  const priceMin = f.priceMin != null ? `от ${Math.round(f.priceMin / 1e6)} млн` : "";
  const priceMax = f.priceMax != null ? `до ${Math.round(f.priceMax / 1e6)} млн` : "";
  if (priceMin || priceMax) chips.push([priceMin, priceMax].filter(Boolean).join(" "));
  const areaMin = f.areaMin != null ? `от ${f.areaMin} м²` : "";
  const areaMax = f.areaMax != null ? `до ${f.areaMax} м²` : "";
  if (areaMin || areaMax) chips.push([areaMin, areaMax].filter(Boolean).join(" "));
  if (f.decoration?.length) chips.push(f.decoration.map((d) => DECOR_LABELS[d] ?? d).join(", "));
  const floorMin = f.floorMin != null ? `этаж от ${f.floorMin}` : "";
  const floorMax = f.floorMax != null ? `до ${f.floorMax}` : "";
  if (floorMin || floorMax) chips.push([floorMin, floorMax].filter(Boolean).join(" "));
  if (f.isSecondary != null) chips.push(f.isSecondary ? "Вторичка" : "Новостройка");
  if (f.isBuilt != null) chips.push(f.isBuilt ? "Сдан" : "Строится");
  if (f.developer?.length) {
    chips.push(
      f.developer.map((id) => DEVELOPERS.find((d) => d.value === id)?.label ?? id).join(", "),
    );
  }
  if (f.complexOption?.length) {
    chips.push(
      f.complexOption.map((id) => COMPLEX_OPTIONS.find((o) => o.value === id)?.label ?? id).join(", "),
    );
  }
  return chips;
}

/* ── классы кнопок-фильтров в светлой mcp-теме ────────────────────────── */
// прямоугольная геометрия гарантируется правилом .mcp [class*="rounded"]→0
const chipBase =
  "shrink-0 border px-4 py-1.5 text-sm transition-colors mcp-mono tracking-tight";
const chipOff =
  "border-[var(--line-light)] text-[var(--on-light-mut)] hover:border-[#0a0a0b] hover:text-[#0a0a0b]";
const chipOn = "border-[#1aa3ff] bg-[#1aa3ff] text-white";

/* ───────────────────────── AI-поиск ─────────────────────────────────── */

type SearchResult = { total: number; appliedFilters: Partial<CatalogQuery> | null };

function SmartSearch({
  onApply,
  onReset,
}: {
  onApply: (filters: Partial<CatalogQuery>) => void;
  onReset: () => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState(false);

  const run = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setValue(clean);
    setBusy(true);
    setResult(null);
    setError(false);
    track("ai_search", { query: clean });
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: clean }] }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const r: SearchResult = {
        total: data.total ?? 0,
        appliedFilters: data.appliedFilters ?? null,
      };
      setResult(r);
      if (r.appliedFilters) {
        onApply(r.appliedFilters);
        document.getElementById("mcp-search-results")?.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setValue("");
    setResult(null);
    setError(false);
    onReset();
  };

  const chips = result?.appliedFilters ? buildChips(result.appliedFilters) : [];
  const hasResult = result && !busy;

  return (
    <div>
      {/* строка AI-поиска */}
      <div className="relative flex items-center border border-[var(--line-light)] bg-white">
        <span className="pointer-events-none absolute left-4 text-[#1aa3ff]" aria-hidden>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 1.5 11.8 7 17.5 8.5l-5.7 2L10 16l-1.8-5.5L2.5 8.5 8.2 7 10 1.5zm7 11 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && run(value)}
          placeholder="Опишите словами: однушка до 60 млн в ОКО…"
          aria-label="AI-поиск квартиры"
          className="w-full bg-transparent py-4 pl-11 pr-32 text-[15px] text-[var(--on-light)] placeholder:text-[var(--on-light-mut)] focus:outline-none"
        />
        {hasResult ? (
          <button
            onClick={clear}
            className="absolute right-1.5 border border-[var(--line-light)] px-5 py-2.5 text-sm text-[var(--on-light-mut)] transition-colors hover:border-[#0a0a0b] hover:text-[#0a0a0b]"
          >
            Сбросить
          </button>
        ) : (
          <button
            onClick={() => run(value)}
            disabled={busy || !value.trim()}
            className="mcp-btn-blue absolute right-1.5 px-6 py-2.5 text-sm disabled:opacity-40"
          >
            {busy ? "Ищу…" : "Найти"}
          </button>
        )}
      </div>

      {/* подсказки */}
      {!hasResult && !busy && !error && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => run(s)}
              className="mcp-mono border border-[var(--line-light)] px-3 py-1.5 text-xs text-[var(--on-light-mut)] transition-colors hover:border-[#1aa3ff] hover:text-[#1aa3ff]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* лоадинг */}
      {busy && (
        <div className="mcp-mono mt-3 flex items-center gap-2 text-xs text-[var(--on-light-mut)]">
          <span className="inline-flex gap-1" aria-hidden>
            <span className="h-1.5 w-1.5 animate-bounce bg-[#1aa3ff] [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce bg-[#1aa3ff] [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce bg-[#1aa3ff] [animation-delay:300ms]" />
          </span>
          подбираю варианты…
        </div>
      )}

      {/* ошибка */}
      {error && (
        <p className="mt-3 text-xs text-[var(--on-light-mut)]">
          Не удалось выполнить поиск — попробуйте ещё раз или{" "}
          <button onClick={clear} className="text-[#1aa3ff] hover:underline">
            сбросьте
          </button>
          .
        </p>
      )}

      {/* что понял AI — без отдельного счётчика: количество показывает
          каталог ниже («Найдено: N»), чтобы не было двух разных цифр */}
      {hasResult && chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="mcp-mono text-xs text-[var(--on-light-mut)]">AI понял:</span>
          {chips.map((c) => (
            <span
              key={c}
              className="mcp-mono border border-[#1aa3ff] bg-[#1aa3ff]/10 px-3 py-1 text-xs text-[#1aa3ff]"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── карточка лота (light) ────────────────────── */

const FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#eef0f3"/><text x="50%" y="50%" fill="#9aa1ab" font-family="sans-serif" font-size="16" text-anchor="middle">Фото скоро появится</text></svg>`,
  );

function McpLotCard({ lot }: { lot: LotCardType }) {
  const [imgIdx, setImgIdx] = useState(0);
  const price = lot.lotCardPriceListDTO.lotCardPriceItemDTOs.find((p) => p.currency === "RUB");
  const transit = lot.lotCardTransitListDTO.lotCardTransitItemDTOs[0];
  const images = lot.images.length ? lot.images : [""];
  const badge = lot.complexTitle ?? lot.address ?? lot.district;

  return (
    <Link
      href={`/lots/${lot.id}`}
      onClick={() => track("lot_card_click", { lotId: lot.id, complex: badge })}
      className="group block overflow-hidden border border-[var(--line-light)] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#1aa3ff]"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden bg-[var(--paper-2)]"
        onMouseMove={(e) => {
          if (images.length < 2) return;
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.min(
            images.length - 1,
            Math.floor(((e.clientX - r.left) / r.width) * images.length),
          );
          if (i !== imgIdx) setImgIdx(i);
        }}
        onMouseLeave={() => setImgIdx(0)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[imgIdx] ? imageUrl(images[imgIdx], 727) : FALLBACK}
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK;
          }}
          alt={lotHeadline(lot)}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {images.length > 1 && (
          <div className="absolute inset-x-3 bottom-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-0.5 flex-1 ${i === imgIdx ? "bg-[#1aa3ff]" : "bg-white/60"}`}
              />
            ))}
          </div>
        )}
        <span className="mcp-mono absolute left-3 top-3 bg-[#0a0a0b]/85 px-3 py-1 text-[11px] tracking-wide text-white backdrop-blur">
          {badge}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold leading-snug text-[var(--on-light)]">{lotHeadline(lot)}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-[var(--on-light-mut)]">{lot.title}</p>

        <p className="mt-3 text-xl font-bold text-[#1aa3ff]">
          {price?.priceFormatted ?? "Цена по запросу"}
        </p>
        {price && price.pricePerAreaFormatted && (
          <p className="mcp-mono mt-0.5 text-xs text-[var(--on-light-mut)]">{price.pricePerAreaFormatted}</p>
        )}

        {transit && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--on-light-mut)]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: transit.color }} />
            {transit.title}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ───────────────────────── основной блок ────────────────────────────── */

export function Search({ initial }: { initial: LotFilterResult }) {
  const towerList = portal.towers;
  const [tab, setTab] = useState<"smart" | "filters">("smart");
  const [query, setQuery] = useState<CatalogQuery>({ deal: "sale", page: 1 });
  const [result, setResult] = useState<LotFilterResult>(initial);
  const [lots, setLots] = useState(initial.moscowLotCardDTOs);
  const [counts, setCounts] = useState<CatalogCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [priceDraft, setPriceDraft] = useState({ min: "", max: "" });
  const [areaDraft, setAreaDraft] = useState({ min: "", max: "" });
  const [floorDraft, setFloorDraft] = useState({ min: "", max: "" });
  const firstRender = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const apply = useCallback((patch: Partial<CatalogQuery>) => {
    setQuery((q) => ({ ...q, ...patch, page: patch.page ?? 1 }));
  }, []);

  // внешние блоки (карточки башен и пр.) применяют фильтры событием —
  // переключаемся на вкладку «Фильтры», чтобы выбор был виден
  useEffect(() => {
    const onApply = (e: Event) => {
      apply((e as CustomEvent).detail as Partial<CatalogQuery>);
      setTab("filters");
    };
    window.addEventListener("portal:applyFilters", onApply);
    return () => window.removeEventListener("portal:applyFilters", onApply);
  }, [apply]);

  // счётчики категорий/башен
  useEffect(() => {
    const p = new URLSearchParams({ deal: query.deal });
    if (query.category) p.set("category", query.category);
    fetch(`/api/counts?${p}`)
      .then((r) => (r.ok ? (r.json() as Promise<CatalogCounts>) : null))
      .then((c) => c && setCounts(c))
      .catch(() => {});
  }, [query.deal, query.category]);

  // запрос лотов при изменении фильтров
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return; // initial с сервера = пустой фильтр
    }
    const params = catalogQueryToParams(query);
    track("filter_change", {
      deal: query.deal,
      category: query.category ?? "all",
      towers: query.towers?.join(",") ?? "all",
      rooms: query.rooms?.join(",") ?? "any",
      sort: query.sort,
    });

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    fetch(`/api/lots?${params}`, { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<LotFilterResult>;
      })
      .then((data) => {
        setResult(data);
        setLots(
          (query.page ?? 1) > 1
            ? (prev) => [...prev, ...data.moscowLotCardDTOs]
            : data.moscowLotCardDTOs,
        );
        setLoading(false);
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setLoading(false);
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const toggleTower = (id: number) => {
    const cur = new Set(query.towers ?? []);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    apply({ towers: [...cur] });
  };
  const toggleRoom = (v: string) => {
    const cur = new Set(query.rooms ?? []);
    cur.has(v) ? cur.delete(v) : cur.add(v);
    apply({ rooms: [...cur] });
  };
  const toggleDecoration = (v: string) => {
    const cur = new Set(query.decoration ?? []);
    cur.has(v) ? cur.delete(v) : cur.add(v);
    apply({ decoration: [...cur] });
  };
  const toggleOption = (v: number) => {
    const cur = new Set(query.complexOption ?? []);
    cur.has(v) ? cur.delete(v) : cur.add(v);
    apply({ complexOption: [...cur] });
  };
  const setTri = (key: "isSecondary" | "isBuilt", v: boolean) =>
    apply({ [key]: query[key] === v ? undefined : v } as Partial<CatalogQuery>);

  const commitPrice = () => {
    const mln = (s: string) => {
      const n = parseFloat(s.replace(",", "."));
      return Number.isNaN(n) ? undefined : Math.round(n * 1_000_000);
    };
    apply({ priceMin: mln(priceDraft.min), priceMax: mln(priceDraft.max) });
  };
  const commitArea = () => {
    const int = (s: string) => {
      const n = parseInt(s, 10);
      return Number.isNaN(n) ? undefined : n;
    };
    apply({ areaMin: int(areaDraft.min), areaMax: int(areaDraft.max) });
  };
  const commitFloor = () => {
    const int = (s: string) => {
      const n = parseInt(s, 10);
      return Number.isNaN(n) ? undefined : n;
    };
    apply({ floorMin: int(floorDraft.min), floorMax: int(floorDraft.max) });
  };

  const isResidential = !query.category || query.category === "flat" || query.category === "apartment";

  const hasFilters = useMemo(
    () =>
      Boolean(
        query.category ||
          query.towers?.length ||
          query.rooms?.length ||
          query.priceMin != null ||
          query.priceMax != null ||
          query.areaMin != null ||
          query.areaMax != null ||
          query.decoration?.length ||
          query.floorMin != null ||
          query.floorMax != null ||
          query.deal === "rent" ||
          query.sort,
      ),
    [query],
  );

  const cnt = (n: number | undefined) =>
    counts && n != null ? <span className="ml-1.5 text-xs opacity-50">{n}</span> : null;

  const resetAll = () => {
    setPriceDraft({ min: "", max: "" });
    setAreaDraft({ min: "", max: "" });
    setFloorDraft({ min: "", max: "" });
    setQuery({ deal: "sale", page: 1 });
  };

  const onSmartApply = (f: Partial<CatalogQuery>) => {
    if (f.priceMin != null || f.priceMax != null) {
      setPriceDraft({ min: fmtMln(f.priceMin), max: fmtMln(f.priceMax) });
    }
    if (f.areaMin != null || f.areaMax != null) {
      setAreaDraft({ min: f.areaMin?.toString() ?? "", max: f.areaMax?.toString() ?? "" });
    }
    apply(f);
  };

  // подсветка башен на 3D-карте (если присутствует на странице) — как в Catalog
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("portal:resultTowers", { detail: { towers: query.towers ?? [] } }),
    );
  }, [query.towers]);

  const inputCls =
    "w-14 bg-transparent text-sm text-[var(--on-light)] placeholder:text-[var(--on-light-mut)] focus:outline-none";

  return (
    <section id="search" className="mcp-light scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        {/* заголовок секции в стиле mcp */}
        <div className="mcp-reveal mb-10 text-center">
          <p className="mcp-mono mb-4 text-xs uppercase tracking-[0.3em] text-[#1aa3ff]">Каталог /</p>
          <h2 className="text-5xl font-bold tracking-tight md:text-6xl">Найдите свой лот</h2>
          <p className="mt-5 inline-flex items-center gap-2 text-lg text-[var(--on-light-mut)]">
            <span className="h-2 w-2 bg-[#1aa3ff]" />
            Живая база семи башен — опишите словами или соберите фильтрами
          </p>
        </div>

        {/* переключатель: умный поиск ↔ фильтры */}
        <div className="mcp-reveal mb-6 flex justify-center">
          <div className="inline-flex border border-[var(--line-light)] bg-white">
            {([
              ["smart", "Умный поиск"],
              ["filters", "Фильтры"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors ${
                  tab === id
                    ? "bg-[#1aa3ff] text-white"
                    : "text-[var(--on-light-mut)] hover:text-[#0a0a0b]"
                }`}
              >
                {id === "smart" ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d="M10 1.5 11.8 7 17.5 8.5l-5.7 2L10 16l-1.8-5.5L2.5 8.5 8.2 7 10 1.5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                    <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── умный поиск ──────────────────────────────────────────── */}
        <div className={tab === "smart" ? "" : "hidden"}>
          <SmartSearch onApply={onSmartApply} onReset={resetAll} />
        </div>

        {/* ── панель фильтров ───────────────────────────────────────── */}
        <div
          className={`${tab === "filters" ? "" : "hidden"} border border-[var(--line-light)] bg-[var(--paper-2)] p-5 md:p-6`}
        >
          {/* сделка + категории */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex border border-[var(--line-light)]" role="group" aria-label="Тип сделки">
              {(["sale", "rent"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => apply({ deal: d })}
                  aria-pressed={query.deal === d}
                  className={`mcp-mono px-5 py-1.5 text-sm transition-colors ${
                    query.deal === d ? "bg-[#1aa3ff] text-white" : "text-[var(--on-light-mut)] hover:text-[#0a0a0b]"
                  }`}
                >
                  {d === "sale" ? "Купить" : "Снять"}
                </button>
              ))}
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Категория">
              <button
                onClick={() => apply({ category: undefined })}
                aria-pressed={!query.category}
                className={`${chipBase} ${!query.category ? chipOn : chipOff}`}
              >
                Все{cnt(counts?.categories.all)}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => apply({ category: query.category === c.value ? undefined : c.value })}
                  aria-pressed={query.category === c.value}
                  className={`${chipBase} ${query.category === c.value ? chipOn : chipOff}`}
                >
                  {c.label}
                  {cnt(counts?.categories[c.value])}
                </button>
              ))}
            </div>
          </div>

          {/* башни */}
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto" role="group" aria-label="Башни">
            {towerList.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTower(t.id)}
                aria-pressed={query.towers?.includes(t.id) ?? false}
                className={`${chipBase} ${query.towers?.includes(t.id) ? chipOn : chipOff}`}
              >
                {t.name}
                {cnt(counts?.towers[t.id])}
              </button>
            ))}
          </div>

          {/* диапазоны + спальни + отделка + сортировка */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border border-[var(--line-light)] px-4 py-1.5">
              <span className="mcp-mono text-xs text-[var(--on-light-mut)]">Цена, млн ₽</span>
              <input
                inputMode="decimal"
                placeholder="от"
                value={priceDraft.min}
                onChange={(e) => setPriceDraft((p) => ({ ...p, min: e.target.value }))}
                onBlur={commitPrice}
                onKeyDown={(e) => e.key === "Enter" && commitPrice()}
                className={inputCls}
                aria-label="Цена от, млн рублей"
              />
              <span className="text-[var(--on-light-mut)]">—</span>
              <input
                inputMode="decimal"
                placeholder="до"
                value={priceDraft.max}
                onChange={(e) => setPriceDraft((p) => ({ ...p, max: e.target.value }))}
                onBlur={commitPrice}
                onKeyDown={(e) => e.key === "Enter" && commitPrice()}
                className={inputCls}
                aria-label="Цена до, млн рублей"
              />
            </div>

            <div className="flex items-center gap-2 border border-[var(--line-light)] px-4 py-1.5">
              <span className="mcp-mono text-xs text-[var(--on-light-mut)]">Площадь, м²</span>
              <input
                inputMode="numeric"
                placeholder="от"
                value={areaDraft.min}
                onChange={(e) => setAreaDraft((p) => ({ ...p, min: e.target.value }))}
                onBlur={commitArea}
                onKeyDown={(e) => e.key === "Enter" && commitArea()}
                className={inputCls}
                aria-label="Площадь от, м²"
              />
              <span className="text-[var(--on-light-mut)]">—</span>
              <input
                inputMode="numeric"
                placeholder="до"
                value={areaDraft.max}
                onChange={(e) => setAreaDraft((p) => ({ ...p, max: e.target.value }))}
                onBlur={commitArea}
                onKeyDown={(e) => e.key === "Enter" && commitArea()}
                className={inputCls}
                aria-label="Площадь до, м²"
              />
            </div>

            <div className="flex items-center gap-2 border border-[var(--line-light)] px-4 py-1.5">
              <span className="mcp-mono text-xs text-[var(--on-light-mut)]">Этаж</span>
              <input
                inputMode="numeric"
                placeholder="от"
                value={floorDraft.min}
                onChange={(e) => setFloorDraft((p) => ({ ...p, min: e.target.value }))}
                onBlur={commitFloor}
                onKeyDown={(e) => e.key === "Enter" && commitFloor()}
                className={`${inputCls} w-12`}
                aria-label="Этаж от"
              />
              <span className="text-[var(--on-light-mut)]">—</span>
              <input
                inputMode="numeric"
                placeholder="до"
                value={floorDraft.max}
                onChange={(e) => setFloorDraft((p) => ({ ...p, max: e.target.value }))}
                onBlur={commitFloor}
                onKeyDown={(e) => e.key === "Enter" && commitFloor()}
                className={`${inputCls} w-12`}
                aria-label="Этаж до"
              />
            </div>

            {isResidential && (
              <div className="flex items-center gap-1 border border-[var(--line-light)] p-1" role="group" aria-label="Спальни">
                <span className="mcp-mono pl-3 pr-1 text-xs text-[var(--on-light-mut)]">Спальни</span>
                {ROOM_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => toggleRoom(r.value)}
                    aria-pressed={query.rooms?.includes(r.value) ?? false}
                    className={`mcp-mono min-w-9 px-3 py-1.5 text-sm transition-colors ${
                      query.rooms?.includes(r.value)
                        ? "bg-[#1aa3ff] text-white"
                        : "text-[var(--on-light-mut)] hover:text-[#0a0a0b]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {isResidential && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Отделка">
                {DECORATION_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => toggleDecoration(d.value)}
                    aria-pressed={query.decoration?.includes(d.value) ?? false}
                    className={`${chipBase} ${query.decoration?.includes(d.value) ? chipOn : chipOff}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 border border-[var(--line-light)] p-1" role="group" aria-label="Тип и готовность">
              {([
                ["isSecondary", false, "Новостройка"],
                ["isSecondary", true, "Вторичка"],
                ["isBuilt", true, "Сдан"],
              ] as const).map(([key, val, label]) => (
                <button
                  key={label}
                  onClick={() => setTri(key, val)}
                  aria-pressed={query[key] === val}
                  className={`mcp-mono px-3 py-1.5 text-sm transition-colors ${
                    query[key] === val ? "bg-[#1aa3ff] text-white" : "text-[var(--on-light-mut)] hover:text-[#0a0a0b]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={query.sort ?? "price_asc"}
              onChange={(e) => apply({ sort: e.target.value })}
              aria-label="Сортировка"
              className="mcp-mono border border-[var(--line-light)] bg-white px-4 py-2 text-sm text-[var(--on-light)] focus:outline-none"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={resetAll}
                className="mcp-mono text-sm text-[var(--on-light-mut)] underline-offset-4 transition-colors hover:text-[#1aa3ff] hover:underline"
              >
                Сбросить
              </button>
            )}
          </div>

          {/* особенности комплекса */}
          {isResidential && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Особенности комплекса">
              {COMPLEX_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => toggleOption(o.value)}
                  aria-pressed={query.complexOption?.includes(o.value) ?? false}
                  className={`mcp-mono shrink-0 border px-3 py-1 text-xs transition-colors ${
                    query.complexOption?.includes(o.value) ? chipOn : chipOff
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── результаты ────────────────────────────────────────────── */}
        <div id="mcp-search-results" className="mt-8 flex items-baseline justify-between scroll-mt-16">
          <p className="mcp-mono text-sm text-[var(--on-light-mut)]" aria-live="polite">
            {loading ? "Обновляем…" : `Найдено: ${result.total} ${plural(result.total)}`}
          </p>
        </div>

        <div
          className={`mt-4 grid gap-5 transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-3 ${
            loading ? "opacity-50" : ""
          }`}
        >
          {lots.map((lot) => (
            <McpLotCard key={`${lot.id}-${lot.domainEntity}`} lot={lot} />
          ))}
        </div>

        {lots.length === 0 && !loading && (
          <div className="py-20 text-center">
            <p className="text-2xl font-semibold text-[var(--on-light)]">Ничего не найдено</p>
            <p className="mt-2 text-sm text-[var(--on-light-mut)]">
              Попробуйте смягчить фильтры — например, убрать ограничение по цене.
            </p>
          </div>
        )}

        {result.hasMorePages && lots.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={() => apply({ page: (query.page ?? 1) + 1 })}
              disabled={loading}
              className="mcp-btn-black px-8 py-3 text-sm tracking-wide disabled:opacity-50"
            >
              {loading ? "Загружаем…" : "Показать ещё"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
