"use client";

import { useState } from "react";
import { portal } from "@/portal.config";
import { track } from "@/lib/analytics";
import { COMPLEX_OPTIONS, DEVELOPERS, type CatalogQuery } from "@/lib/whitewill/types";

const SUGGESTIONS = [
  "Однушка до 60 млн с отделкой",
  "Видовая квартира на высоком этаже",
  "Без отделки под свой ремонт в ОКО",
  "Что-нибудь на нижних этажах",
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
  if (f.readinessYear?.length) chips.push(`Сдача: ${f.readinessYear.join(", ")}`);
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

type SearchResult = {
  total: number;
  appliedFilters: Partial<CatalogQuery> | null;
};

type Props = {
  onApply: (filters: Partial<CatalogQuery>) => void;
  onReset: () => void;
};

export function SmartSearch({ onApply, onReset }: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState(false);

  const search = async (text: string) => {
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
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
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
    <div className="mb-8">
      {/* Строка поиска */}
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-5 text-gold" aria-hidden>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 1.5 11.8 7 17.5 8.5l-5.7 2L10 16l-1.8-5.5L2.5 8.5 8.2 7 10 1.5zm7 11 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && search(value)}
          placeholder="Опишите, что ищете: однушка до 60 млн в ОКО…"
          aria-label="AI-поиск квартиры"
          className="w-full rounded-full border border-ink-line/60 bg-ink-soft/80 py-4 pl-12 pr-32 text-sm text-paper placeholder:text-muted/60 transition-colors focus:border-gold focus:outline-none"
        />
        {hasResult ? (
          <button
            onClick={clear}
            className="absolute right-2 rounded-full border border-ink-line/60 px-5 py-2 text-sm text-paper/70 transition-colors hover:border-gold hover:text-gold"
          >
            Сбросить
          </button>
        ) : (
          <button
            onClick={() => search(value)}
            disabled={busy || !value.trim()}
            className="absolute right-2 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold-deep disabled:opacity-40"
          >
            {busy ? "Ищу…" : "Найти"}
          </button>
        )}
      </div>

      {/* Подсказки (когда нет результата) */}
      {!hasResult && !busy && !error && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => search(s)}
              className="rounded-full border border-ink-line/60 px-3 py-1.5 text-xs text-paper/70 transition-colors hover:border-gold hover:text-gold"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Лоадинг */}
      {busy && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex gap-1" aria-hidden>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:300ms]" />
          </span>
          подбираю варианты…
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <p className="mt-3 text-xs text-muted">
          Не удалось выполнить поиск — попробуйте ещё раз или{" "}
          <button onClick={clear} className="text-gold hover:underline">
            сбросьте
          </button>
          .
        </p>
      )}

      {/* Результат: чипы с тем, что AI понял */}
      {hasResult && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {chips.length > 0 && (
            <>
              <span className="text-xs text-muted">AI понял:</span>
              {chips.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold"
                >
                  {c}
                </span>
              ))}
              <span className="text-xs text-muted">·</span>
            </>
          )}
          <span className="text-xs text-paper/60">
            {result.total > 0 ? `${result.total} вариантов` : "Ничего не нашлось"}
          </span>
        </div>
      )}
    </div>
  );
}
