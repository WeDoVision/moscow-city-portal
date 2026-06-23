"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { portal } from "@/portal.config";
import {
  CATEGORIES,
  COMPLEX_OPTIONS,
  DECORATION_OPTIONS,
  type CatalogCounts,
  type CatalogQuery,
  type LotFilterResult,
} from "@/lib/whitewill/types";
import { catalogQueryToParams, parseCatalogQuery } from "@/lib/whitewill/query";
import { track } from "@/lib/analytics";
import { LotCard } from "./LotCard";
import { SmartSearch } from "./SmartSearch";

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

function fmtMln(n: number | undefined): string {
  if (n == null) return "";
  return n >= 1_000_000 ? String(Math.round(n / 1_000_000)) : String(n);
}

/**
 * Динамический каталог: фильтры ↔ URL ↔ /api/lots (прокси whitewill).
 * Набор фильтров повторяет старый портал: сделка, категория (со счётчиками),
 * башня (со счётчиками), цена, площадь + спальни/сортировка как на whitewill.
 */
export function Catalog({
  initial,
  basePath = "/",
  towers,
  portalSlug,
}: {
  initial: LotFilterResult;
  /** куда синкать URL фильтров (по умолчанию корень эталонного сайта) */
  basePath?: string;
  /** список башен для фильтра (по умолчанию башни эталонного Москва-Сити) */
  towers?: { id: number; name: string }[];
  /** slug портала — карточки лотов получат ?portal=<slug> для наследования темы */
  portalSlug?: string;
}) {
  const towerList = towers ?? portal.towers;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<CatalogQuery>(() => parseCatalogQuery(searchParams));
  const [result, setResult] = useState<LotFilterResult>(initial);
  const [lots, setLots] = useState(initial.moscowLotCardDTOs);
  const [counts, setCounts] = useState<CatalogCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [priceDraft, setPriceDraft] = useState({ min: fmtMln(query.priceMin), max: fmtMln(query.priceMax) });
  const [areaDraft, setAreaDraft] = useState({
    min: query.areaMin?.toString() ?? "",
    max: query.areaMax?.toString() ?? "",
  });
  const [floorDraft, setFloorDraft] = useState({
    min: query.floorMin?.toString() ?? "",
    max: query.floorMax?.toString() ?? "",
  });
  const firstRender = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const apply = useCallback((patch: Partial<CatalogQuery>) => {
    setQuery((q) => ({ ...q, ...patch, page: patch.page ?? 1 }));
  }, []);

  // внешние компоненты (3D-карта, AI-агент) применяют фильтры событием
  useEffect(() => {
    const onApply = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<CatalogQuery>;
      apply({ ...detail });
    };
    window.addEventListener("portal:applyFilters", onApply);
    return () => window.removeEventListener("portal:applyFilters", onApply);
  }, [apply]);

  // двусторонняя связка с 3D-картой: какие башни сейчас в фокусе фильтров
  // (выбраны вручную или применены AI-поиском) — карта их подсвечивает
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("portal:resultTowers", { detail: { towers: query.towers ?? [] } }),
    );
  }, [query.towers]);

  // счётчики категорий/башен — отдельный, более редкий запрос
  useEffect(() => {
    const p = new URLSearchParams({ deal: query.deal });
    if (query.category) p.set("category", query.category);
    fetch(`/api/counts?${p}`)
      .then((r) => (r.ok ? (r.json() as Promise<CatalogCounts>) : null))
      .then((c) => c && setCounts(c))
      .catch(() => {});
  }, [query.deal, query.category]);

  // запрос при изменении фильтров + синк URL
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      // initial с сервера соответствует пустому фильтру; если в URL уже есть
      // параметры (прямая ссылка на выдачу) — сразу перезапрашиваем
      if ([...searchParams.keys()].length === 0) return;
    }
    const params = catalogQueryToParams(query);
    router.replace(`${basePath}?${params}#catalog`, { scroll: false });
    track("filter_change", {
      deal: query.deal,
      category: query.category ?? "all",
      towers: query.towers?.join(",") ?? "all",
      rooms: query.rooms?.join(",") ?? "any",
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      areaMin: query.areaMin,
      areaMax: query.areaMax,
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
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    apply({ towers: [...cur] });
  };

  const toggleRoom = (v: string) => {
    const cur = new Set(query.rooms ?? []);
    if (cur.has(v)) cur.delete(v);
    else cur.add(v);
    apply({ rooms: [...cur] });
  };

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

  const toggleDecoration = (v: string) => {
    const cur = new Set(query.decoration ?? []);
    if (cur.has(v)) cur.delete(v);
    else cur.add(v);
    apply({ decoration: [...cur] });
  };

  const toggleOption = (v: number) => {
    const cur = new Set(query.complexOption ?? []);
    if (cur.has(v)) cur.delete(v);
    else cur.add(v);
    apply({ complexOption: [...cur] });
  };
  /** тумблер «значение ↔ выкл» для tri-state булевых фильтров */
  const setTri = (key: "isSecondary" | "isBuilt", v: boolean) =>
    apply({ [key]: query[key] === v ? undefined : v } as Partial<CatalogQuery>);

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
    counts && n != null ? <span className="ml-1.5 text-xs opacity-60">{n}</span> : null;

  const resetAll = () => {
    setPriceDraft({ min: "", max: "" });
    setAreaDraft({ min: "", max: "" });
    setFloorDraft({ min: "", max: "" });
    setQuery({ deal: "sale", page: 1 });
  };

  return (
    <div>
      <SmartSearch
        onApply={(f) => {
          if (f.priceMin != null || f.priceMax != null) {
            setPriceDraft({ min: fmtMln(f.priceMin), max: fmtMln(f.priceMax) });
          }
          if (f.areaMin != null || f.areaMax != null) {
            setAreaDraft({ min: f.areaMin?.toString() ?? "", max: f.areaMax?.toString() ?? "" });
          }
          apply(f);
        }}
        onReset={resetAll}
      />

      {/* ── Панель фильтров ─────────────────────────────────────────── */}
      <div className="rounded-sm border border-ink-line/40 bg-ink-soft/60 p-5 backdrop-blur md:p-6">
        {/* сделка + категории */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full border border-ink-line/60 p-1" role="group" aria-label="Тип сделки">
            {(["sale", "rent"] as const).map((d) => (
              <button
                key={d}
                onClick={() => apply({ deal: d })}
                aria-pressed={query.deal === d}
                className={`rounded-full px-5 py-1.5 text-sm transition-colors ${
                  query.deal === d ? "bg-gold text-ink" : "text-paper/70 hover:text-paper"
                }`}
              >
                {d === "sale" ? "Купить" : "Снять"}
              </button>
            ))}
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Категория недвижимости">
            <button
              onClick={() => apply({ category: undefined })}
              aria-pressed={!query.category}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                !query.category
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-ink-line/60 text-paper/70 hover:border-paper/40 hover:text-paper"
              }`}
            >
              Все{cnt(counts?.categories.all)}
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => apply({ category: query.category === c.value ? undefined : c.value })}
                aria-pressed={query.category === c.value}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  query.category === c.value
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-ink-line/60 text-paper/70 hover:border-paper/40 hover:text-paper"
                }`}
              >
                {c.label}
                {cnt(counts?.categories[c.value])}
              </button>
            ))}
          </div>
        </div>

        {/* башни со счётчиками */}
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto" role="group" aria-label="Башни">
          {towerList.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTower(t.id)}
              aria-pressed={query.towers?.includes(t.id) ?? false}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                query.towers?.includes(t.id)
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-ink-line/60 text-paper/70 hover:border-paper/40 hover:text-paper"
              }`}
            >
              {t.name}
              {cnt(counts?.towers[t.id])}
            </button>
          ))}
        </div>

        {/* диапазоны и сортировка */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-ink-line/60 px-4 py-1.5">
            <span className="text-xs text-muted">Цена, млн ₽</span>
            <input
              inputMode="decimal"
              placeholder="от"
              value={priceDraft.min}
              onChange={(e) => setPriceDraft((p) => ({ ...p, min: e.target.value }))}
              onBlur={commitPrice}
              onKeyDown={(e) => e.key === "Enter" && commitPrice()}
              className="w-14 bg-transparent text-sm text-paper placeholder:text-muted/60 focus:outline-none"
              aria-label="Цена от, млн рублей"
            />
            <span className="text-muted">—</span>
            <input
              inputMode="decimal"
              placeholder="до"
              value={priceDraft.max}
              onChange={(e) => setPriceDraft((p) => ({ ...p, max: e.target.value }))}
              onBlur={commitPrice}
              onKeyDown={(e) => e.key === "Enter" && commitPrice()}
              className="w-14 bg-transparent text-sm text-paper placeholder:text-muted/60 focus:outline-none"
              aria-label="Цена до, млн рублей"
            />
          </div>

          <div className="flex items-center gap-2 rounded-full border border-ink-line/60 px-4 py-1.5">
            <span className="text-xs text-muted">Площадь, м²</span>
            <input
              inputMode="numeric"
              placeholder="от"
              value={areaDraft.min}
              onChange={(e) => setAreaDraft((p) => ({ ...p, min: e.target.value }))}
              onBlur={commitArea}
              onKeyDown={(e) => e.key === "Enter" && commitArea()}
              className="w-14 bg-transparent text-sm text-paper placeholder:text-muted/60 focus:outline-none"
              aria-label="Площадь от, м²"
            />
            <span className="text-muted">—</span>
            <input
              inputMode="numeric"
              placeholder="до"
              value={areaDraft.max}
              onChange={(e) => setAreaDraft((p) => ({ ...p, max: e.target.value }))}
              onBlur={commitArea}
              onKeyDown={(e) => e.key === "Enter" && commitArea()}
              className="w-14 bg-transparent text-sm text-paper placeholder:text-muted/60 focus:outline-none"
              aria-label="Площадь до, м²"
            />
          </div>

          <div className="flex items-center gap-2 rounded-full border border-ink-line/60 px-4 py-1.5">
            <span className="text-xs text-muted">Этаж</span>
            <input
              inputMode="numeric"
              placeholder="от"
              value={floorDraft.min}
              onChange={(e) => setFloorDraft((p) => ({ ...p, min: e.target.value }))}
              onBlur={commitFloor}
              onKeyDown={(e) => e.key === "Enter" && commitFloor()}
              className="w-12 bg-transparent text-sm text-paper placeholder:text-muted/60 focus:outline-none"
              aria-label="Этаж от"
            />
            <span className="text-muted">—</span>
            <input
              inputMode="numeric"
              placeholder="до"
              value={floorDraft.max}
              onChange={(e) => setFloorDraft((p) => ({ ...p, max: e.target.value }))}
              onBlur={commitFloor}
              onKeyDown={(e) => e.key === "Enter" && commitFloor()}
              className="w-12 bg-transparent text-sm text-paper placeholder:text-muted/60 focus:outline-none"
              aria-label="Этаж до"
            />
          </div>

          {isResidential && (
            <div className="flex items-center gap-1 rounded-full border border-ink-line/60 p-1" role="group" aria-label="Спальни">
              <span className="pl-3 pr-1 text-xs text-muted">Спальни</span>
              {ROOM_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => toggleRoom(r.value)}
                  aria-pressed={query.rooms?.includes(r.value) ?? false}
                  className={`min-w-9 rounded-full px-3 py-1.5 text-sm transition-colors ${
                    query.rooms?.includes(r.value)
                      ? "bg-gold text-ink"
                      : "text-paper/70 hover:text-paper"
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
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    query.decoration?.includes(d.value)
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-ink-line/60 text-paper/70 hover:border-paper/40 hover:text-paper"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* новостройка/вторичка + готовность */}
          <div className="flex items-center gap-1 rounded-full border border-ink-line/60 p-1" role="group" aria-label="Тип и готовность">
            {([
              ["isSecondary", false, "Новостройка"],
              ["isSecondary", true, "Вторичка"],
              ["isBuilt", true, "Сдан"],
            ] as const).map(([key, val, label]) => (
              <button
                key={label}
                onClick={() => setTri(key, val)}
                aria-pressed={query[key] === val}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  query[key] === val ? "bg-gold text-ink" : "text-paper/70 hover:text-paper"
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
            className="rounded-full border border-ink-line/60 bg-ink-soft px-4 py-2 text-sm text-paper/80 focus:outline-none"
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
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-gold hover:underline"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* особенности комплекса (инфраструктура) */}
        {isResidential && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Особенности комплекса">
            {COMPLEX_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => toggleOption(o.value)}
                aria-pressed={query.complexOption?.includes(o.value) ?? false}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
                  query.complexOption?.includes(o.value)
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-ink-line/60 text-paper/70 hover:border-paper/40 hover:text-paper"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Результаты ──────────────────────────────────────────────── */}
      <div className="mt-6 flex items-baseline justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {loading ? "Обновляем…" : `Найдено: ${result.total} ${plural(result.total)}`}
        </p>
      </div>

      <div
        className={`mt-4 grid gap-5 transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-3 ${
          loading ? "opacity-50" : ""
        }`}
      >
        {lots.map((lot) => (
          <LotCard key={`${lot.id}-${lot.domainEntity}`} lot={lot} portalSlug={portalSlug} />
        ))}
      </div>

      {lots.length === 0 && !loading && (
        <div className="py-20 text-center">
          <p className="font-display text-2xl text-paper/80">Ничего не найдено</p>
          <p className="mt-2 text-sm text-muted">Попробуйте смягчить фильтры — например, убрать ограничение по цене.</p>
        </div>
      )}

      {result.hasMorePages && lots.length > 0 && (
        <div className="mt-10 text-center">
          <button
            onClick={() => apply({ page: (query.page ?? 1) + 1 })}
            disabled={loading}
            className="rounded-full border border-gold/60 px-8 py-3 text-sm tracking-wide text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
          >
            {loading ? "Загружаем…" : "Показать ещё"}
          </button>
        </div>
      )}
    </div>
  );
}

function plural(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "предложение";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "предложения";
  return "предложений";
}
