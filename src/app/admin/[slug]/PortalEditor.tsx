"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Block, BlockType, Brand, Card, PortalSchema, Theme } from "@/lib/portal/schema";
import { BLOCK_META, BLOCK_TYPES } from "@/lib/portal/blocks-meta";
import {
  SLOTS,
  SORTS,
  SOURCES,
  VIEWS,
  isSourceId,
  resolveFields,
  type SourceId,
} from "@/lib/portal/sources";
import { FONT_OPTIONS, familiesFromFontUrl } from "@/lib/portal/fonts";

/**
 * Редактор портала (KRE-124). Гибридная модель: админ управляет UI/UX —
 * состав/порядок блоков, тексты, тему, плюс может менять портал текстом через
 * ИИ. Логика (scope данных, 3D, интеграции) не редактируется здесь.
 */

const COLOR_FIELDS: { key: keyof Theme; label: string }[] = [
  { key: "ink", label: "Фон" },
  { key: "inkSoft", label: "Фон (мягкий)" },
  { key: "inkLine", label: "Линии" },
  { key: "paper", label: "Текст" },
  { key: "gold", label: "Акцент" },
  { key: "goldDeep", label: "Акцент (тёмный)" },
  { key: "muted", label: "Приглушённый" },
];

const RADIUS_PRESETS: { value: string; label: string }[] = [
  { value: "0", label: "Острые углы" },
  { value: "0.125rem", label: "Лёгкое скругление" },
  { value: "0.5rem", label: "Среднее" },
  { value: "1rem", label: "Скруглённое" },
  { value: "1.5rem", label: "Очень мягкое" },
];

/**
 * Любой CSS-цвет (oklch/hex/rgb) → hex для нативной пипетки (только в браузере).
 * Растеризуем 1 пиксель и читаем его getImageData — это даёт реальный RGB
 * после отрисовки, минуя сериализацию (движок возвращает oklch обратно строкой).
 */
function toHex(color: string): string {
  if (typeof document === "undefined") return "#000000";
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return "#000000";
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

/** Поле цвета: только сам цвет (пипетка) + hex для понятности. */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [hex, setHex] = useState("#000000");
  useEffect(() => setHex(toHex(value)), [value]);
  return (
    <div className="text-[13px] text-paper/70">
      {label}
      <label className="mt-1.5 flex cursor-pointer items-center gap-2.5">
        <span
          className="h-9 w-9 shrink-0 rounded-md border border-ink-line/60 shadow-inner"
          style={{ background: value }}
        />
        <span className="font-mono text-xs uppercase text-paper/50">{hex}</span>
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          aria-label={label}
        />
      </label>
    </div>
  );
}

/** Поля цветов карты (блок city3d) с указанием, какой токен темы наследуется. */
const MAP_COLOR_FIELDS: { key: string; label: string; themeKey: keyof Theme }[] = [
  { key: "background", label: "Фон / земля", themeKey: "ink" },
  { key: "building", label: "Застройка", themeKey: "inkSoft" },
  { key: "tower", label: "Башни", themeKey: "inkLine" },
  { key: "accent", label: "Грани / свет", themeKey: "gold" },
  { key: "accentDeep", label: "Свечение", themeKey: "goldDeep" },
];

/** Цвета 3D-карты: по умолчанию наследуются из темы, можно задать свои. */
function MapColorsEditor({
  colors,
  theme,
  onChange,
}: {
  colors: Record<string, string> | null;
  theme: Theme;
  onChange: (v: Record<string, string> | undefined) => void;
}) {
  const custom = !!colors;
  return (
    <div className="mt-3 rounded-lg border border-ink-line/30 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-paper/70">
        <input
          type="checkbox"
          checked={custom}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? Object.fromEntries(MAP_COLOR_FIELDS.map((f) => [f.key, theme[f.themeKey]]))
                : undefined,
            )
          }
          className="accent-gold"
        />
        Свои цвета карты (иначе наследуются из темы)
      </label>
      {custom && (
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {MAP_COLOR_FIELDS.map((f) => (
            <ColorField
              key={f.key}
              label={f.label}
              value={colors?.[f.key] || theme[f.themeKey]}
              onChange={(v) => onChange({ ...colors, [f.key]: v })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Параметры камеры 3D-карты (city3d) ── */
function CameraEditor({
  camera,
  onChange,
}: {
  camera: Record<string, unknown> | null;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const cam = camera ?? {};
  const azimuth = typeof cam.azimuth === "number" ? cam.azimuth : -0.65;
  const elevation = typeof cam.elevation === "number" ? cam.elevation : 0.55;
  const autoRotate = cam.autoRotate === true;
  const set = (patch: Record<string, unknown>) => onChange({ ...cam, ...patch });
  return (
    <div className="mt-3 rounded-lg border border-ink-line/30 p-3">
      <div className="text-[13px] font-medium text-paper/70">Камера</div>
      <label className="mt-3 block text-[12px] text-paper/60">
        Поворот (угол): {azimuth.toFixed(2)}
        <input
          type="range"
          min={-3.14}
          max={3.14}
          step={0.01}
          value={azimuth}
          onChange={(e) => set({ azimuth: Number(e.target.value) })}
          className="mt-1 w-full accent-gold"
        />
      </label>
      <label className="mt-3 block text-[12px] text-paper/60">
        Удаление / высота: {elevation.toFixed(2)}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={elevation}
          onChange={(e) => set({ elevation: Number(e.target.value) })}
          className="mt-1 w-full accent-gold"
        />
      </label>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12px] text-paper/60">
        <input
          type="checkbox"
          checked={autoRotate}
          onChange={(e) => set({ autoRotate: e.target.checked })}
          className="accent-gold"
        />
        Автоповорот
      </label>
    </div>
  );
}

/* ── Редактор блока «Данные»: источник × вид × маппинг полей ── */
function DataBlockEditor({
  props,
  setMany,
}: {
  props: Record<string, unknown>;
  setMany: (patch: Record<string, unknown>) => void;
}) {
  const source: SourceId = isSourceId(props.source) ? props.source : "lots";
  const view = typeof props.view === "string" ? props.view : "cards";
  const sort = typeof props.sort === "string" ? props.sort : "default";
  const fields = resolveFields(source, props.fields);
  const columns = Array.isArray(props.columns) ? (props.columns as string[]) : [];
  const srcFields = SOURCES[source].fields;

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-ink-line/30 p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block text-[12px] text-paper/60">
          Источник
          <select
            value={source}
            onChange={(e) => setMany({ source: e.target.value, fields: undefined, columns: undefined })}
            className={`mt-1 ${SELECT}`}
          >
            {(Object.keys(SOURCES) as SourceId[]).map((id) => (
              <option key={id} value={id}>
                {SOURCES[id].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12px] text-paper/60">
          Вид
          <select value={view} onChange={(e) => setMany({ view: e.target.value })} className={`mt-1 ${SELECT}`}>
            {VIEWS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12px] text-paper/60">
          Сортировка
          <select value={sort} onChange={(e) => setMany({ sort: e.target.value })} className={`mt-1 ${SELECT}`}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {view === "table" ? (
        <div className="text-[12px] text-paper/60">
          Колонки таблицы
          <div className="mt-2 flex flex-wrap gap-1.5">
            {srcFields
              .filter((f) => f.key !== "image")
              .map((f) => {
                const on = columns.length ? columns.includes(f.key) : false;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() =>
                      setMany({
                        columns: on ? columns.filter((c) => c !== f.key) : [...columns, f.key],
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      on ? "border-gold bg-gold/10 text-paper" : "border-ink-line/50 text-paper/60 hover:border-paper/40"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
          </div>
          <p className="mt-1.5 text-[11px] text-paper/40">Пусто — первые 5 полей.</p>
        </div>
      ) : (
        <div className="text-[12px] text-paper/60">
          Что показывать (поле → место в карточке)
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SLOTS.map((s) => (
              <label key={s.id} className="block text-[11px] text-paper/50">
                {s.label}
                <select
                  value={fields[s.id] || ""}
                  onChange={(e) => setMany({ fields: { ...fields, [s.id]: e.target.value } })}
                  className={`mt-1 ${SELECT}`}
                >
                  <option value="">—</option>
                  {srcFields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Скругление: крупные визуальные превью с подписями. */
function RadiusField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="text-[13px] text-paper/70">
      Скругление
      <div className="mt-2 flex flex-wrap gap-3">
        {RADIUS_PRESETS.map((p) => {
          const sel = value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              title={p.label}
              className={`flex h-20 w-20 items-center justify-center rounded-lg border transition ${
                sel ? "border-gold bg-gold/10" : "border-ink-line/50 hover:border-paper/40"
              }`}
            >
              <span
                className={`h-12 w-12 border-2 ${sel ? "border-gold" : "border-paper/60"}`}
                style={{ borderRadius: p.value }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Поле JSON-конструктора (для произвольной секции): textarea + валидация. */
function JsonField({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const pretty = (v: unknown) => JSON.stringify(v ?? [], null, 2);
  const [text, setText] = useState(() => pretty(value));
  const [err, setErr] = useState<string | null>(null);

  // подхватываем внешние изменения (правка через ИИ), не мешая ручному вводу
  useEffect(() => {
    let same = false;
    try {
      same = JSON.stringify(JSON.parse(text)) === JSON.stringify(value);
    } catch {
      same = false;
    }
    if (!same) setText(pretty(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <>
      <textarea
        rows={10}
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setErr(null);
          } catch {
            setErr("Некорректный JSON");
          }
        }}
        className="mt-1 w-full rounded-md border border-ink-line/50 bg-ink px-3 py-2 font-mono text-xs text-paper focus:border-gold focus:outline-none"
      />
      {err && <span className="text-xs text-red-400">{err}</span>}
    </>
  );
}

/* ───────────────── Дружелюбные редакторы списков/конструктора ───────────────── */

const FLD =
  "w-full rounded-md border border-ink-line/50 bg-ink px-3 py-2 text-sm text-paper placeholder:text-paper/30 focus:border-gold focus:outline-none";
const SELECT = FLD + " cursor-pointer";

/**
 * Выбор шрифта: одно поле-выпадашка (набор + «Другой по ссылке»). При выборе
 * «Другой по ссылке» появляется поле URL; название шрифта берётся из ссылки само.
 */
function FontPicker({
  label,
  value,
  defaultKey,
  fontUrl,
  onChange,
  onUrl,
}: {
  label: string;
  value: string | undefined;
  defaultKey: string;
  /** общая ссылка темы на шрифты (Google Fonts и т.п.) */
  fontUrl: string | undefined;
  /** выбор шрифта из набора */
  onChange: (v: string) => void;
  /** установить ссылку + имя семейства из неё одним изменением */
  onUrl: (url: string, family: string) => void;
}) {
  const curated = FONT_OPTIONS.some((o) => o.key === value);
  const [linkMode, setLinkMode] = useState(!!value && !curated);
  return (
    <label className="block text-[13px] text-paper/70">
      {label}
      <select
        value={linkMode ? "__url" : value || defaultKey}
        onChange={(e) => {
          if (e.target.value === "__url") {
            setLinkMode(true);
            onChange(familiesFromFontUrl(fontUrl)[0] ?? "");
          } else {
            setLinkMode(false);
            onChange(e.target.value);
          }
        }}
        className={`mt-1.5 ${SELECT}`}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
        <option value="__url">Другой по ссылке…</option>
      </select>
      {linkMode && (
        <div className="mt-2 space-y-1">
          <input
            type="text"
            value={fontUrl ?? ""}
            onChange={(e) => onUrl(e.target.value, familiesFromFontUrl(e.target.value)[0] ?? "")}
            placeholder="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600&display=swap"
            className={FLD}
          />
          <p className="text-[11px] leading-snug text-paper/40">
            {value
              ? `Шрифт: ${value}`
              : "Вставьте ссылку с fonts.google.com — название возьмётся из неё само."}
          </p>
        </div>
      )}
    </label>
  );
}

/** Кнопки управления элементом списка: вверх/вниз/удалить. */
function RowControls({
  onUp,
  onDown,
  onRemove,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 text-paper/50">
      <button type="button" onClick={onUp} title="Выше" className="rounded px-1.5 py-0.5 hover:bg-ink hover:text-paper">↑</button>
      <button type="button" onClick={onDown} title="Ниже" className="rounded px-1.5 py-0.5 hover:bg-ink hover:text-paper">↓</button>
      <button type="button" onClick={onRemove} title="Удалить" className="rounded px-1.5 py-0.5 hover:bg-ink hover:text-red-400">✕</button>
    </div>
  );
}

function moveItem<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const t = i + dir;
  if (t < 0 || t >= list.length) return list;
  const n = [...list];
  [n[i], n[t]] = [n[t], n[i]];
  return n;
}

/** Список строк (напр. абзацы). */
function StringListField({ value, onChange }: { value: unknown; onChange: (v: string[]) => void }) {
  const list = Array.isArray(value) ? value.map((x) => (typeof x === "string" ? x : "")) : [];
  return (
    <div className="mt-1.5 space-y-2">
      {list.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          <textarea
            rows={2}
            value={v}
            onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))}
            className={`flex-1 ${FLD}`}
          />
          <RowControls
            onUp={() => onChange(moveItem(list, i, -1))}
            onDown={() => onChange(moveItem(list, i, 1))}
            onRemove={() => onChange(list.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...list, ""])}
        className="rounded-full border border-ink-line/50 px-3 py-1 text-xs text-paper/70 hover:border-gold hover:text-paper"
      >
        + Добавить абзац
      </button>
    </div>
  );
}

/** Список объектов с под-полями (статистика, FAQ). */
function ObjectListField({
  value,
  item,
  addLabel,
  onChange,
}: {
  value: unknown;
  item: { key: string; label: string; kind: "text" | "textarea" }[];
  addLabel: string;
  onChange: (v: Record<string, unknown>[]) => void;
}) {
  const list: Record<string, unknown>[] = Array.isArray(value)
    ? value.map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    : [];
  return (
    <div className="mt-1.5 space-y-3">
      {list.map((row, i) => (
        <div key={i} className="rounded-lg border border-ink-line/40 bg-ink/40 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-paper/40">
            <span>№ {i + 1}</span>
            <RowControls
              onUp={() => onChange(moveItem(list, i, -1))}
              onDown={() => onChange(moveItem(list, i, 1))}
              onRemove={() => onChange(list.filter((_, j) => j !== i))}
            />
          </div>
          <div className="space-y-2">
            {item.map((f) => (
              <label key={f.key} className="block text-[12px] text-paper/60">
                {f.label}
                {f.kind === "textarea" ? (
                  <textarea
                    rows={2}
                    value={typeof row[f.key] === "string" ? (row[f.key] as string) : ""}
                    onChange={(e) =>
                      onChange(list.map((r, j) => (j === i ? { ...r, [f.key]: e.target.value } : r)))
                    }
                    className={`mt-1 ${FLD}`}
                  />
                ) : (
                  <input
                    type="text"
                    value={typeof row[f.key] === "string" ? (row[f.key] as string) : ""}
                    onChange={(e) =>
                      onChange(list.map((r, j) => (j === i ? { ...r, [f.key]: e.target.value } : r)))
                    }
                    className={`mt-1 ${FLD}`}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...list, {}])}
        className="rounded-full border border-ink-line/50 px-3 py-1 text-xs text-paper/70 hover:border-gold hover:text-paper"
      >
        + {addLabel}
      </button>
    </div>
  );
}

/* ── Визуальный конструктор секции (custom.elements) ── */

type El = Record<string, unknown>;
const EL_KINDS: { kind: string; label: string }[] = [
  { kind: "heading", label: "Заголовок" },
  { kind: "text", label: "Текст" },
  { kind: "stat", label: "Цифра" },
  { kind: "quote", label: "Цитата" },
  { kind: "image", label: "Картинка" },
  { kind: "button", label: "Кнопка" },
  { kind: "columns", label: "Колонки" },
  { kind: "divider", label: "Разделитель" },
  { kind: "spacer", label: "Отступ" },
  { kind: "html", label: "HTML (продвинутое)" },
];
const EL_LABEL: Record<string, string> = Object.fromEntries(EL_KINDS.map((k) => [k.kind, k.label]));
const ALIGN_OPTS = [
  ["left", "Слева"],
  ["center", "По центру"],
  ["right", "Справа"],
] as const;

/** Поля одного элемента — по типу. */
function ElementFields({ el, set }: { el: El; set: (patch: El) => void }) {
  const s = (k: string) => (typeof el[k] === "string" ? (el[k] as string) : "");
  const n = (k: string) => (typeof el[k] === "number" ? (el[k] as number) : "");
  const alignSel = (
    <label className="block text-[12px] text-paper/60">
      Выравнивание
      <select value={s("align") || "left"} onChange={(e) => set({ align: e.target.value })} className={`mt-1 ${SELECT}`}>
        {ALIGN_OPTS.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
  const colorSel = (
    <label className="block text-[12px] text-paper/60">
      Цвет
      <select value={s("color") || ""} onChange={(e) => set({ color: e.target.value })} className={`mt-1 ${SELECT}`}>
        <option value="">По умолчанию</option>
        <option value="accent">Акцент</option>
        <option value="muted">Приглушённый</option>
        <option value="paper">Светлый</option>
      </select>
    </label>
  );
  const b = (k: string) => el[k] === true;
  const chip = (on: boolean) =>
    `rounded-lg border px-4 py-2 text-sm transition ${
      on
        ? "border-gold bg-gold/10 text-paper"
        : "border-ink-line/50 text-paper/70 hover:border-paper/40"
    }`;
  const emphasisRow = (
    <div className="grid grid-cols-2 gap-2">
      <label className="block text-[12px] text-paper/60">
        Начертание
        <select value={s("weight") || ""} onChange={(e) => set({ weight: e.target.value })} className={`mt-1 ${SELECT}`}>
          <option value="">Обычное</option>
          <option value="light">Тонкое</option>
          <option value="medium">Средне-жирное</option>
          <option value="semibold">Полужирное</option>
          <option value="bold">Жирное</option>
        </select>
      </label>
      <div className="text-[12px] text-paper/60">
        Стиль
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            aria-pressed={b("italic")}
            onClick={() => set({ italic: !b("italic") })}
            className={`${chip(b("italic"))} italic`}
          >
            Курсив
          </button>
          <button
            type="button"
            aria-pressed={b("uppercase")}
            onClick={() => set({ uppercase: !b("uppercase") })}
            className={`${chip(b("uppercase"))} uppercase tracking-wide`}
          >
            Заглавные
          </button>
        </div>
      </div>
    </div>
  );
  switch (s("kind")) {
    case "heading":
      return (
        <div className="space-y-2">
          <input placeholder="Текст заголовка" value={s("text")} onChange={(e) => set({ text: e.target.value })} className={FLD} />
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-[12px] text-paper/60">
              Размер
              <select value={String(n("level") || 2)} onChange={(e) => set({ level: Number(e.target.value) })} className={`mt-1 ${SELECT}`}>
                <option value="1">Очень крупный</option>
                <option value="2">Крупный</option>
                <option value="3">Средний</option>
                <option value="4">Мелкий</option>
              </select>
            </label>
            {alignSel}
            {colorSel}
          </div>
          {emphasisRow}
        </div>
      );
    case "text":
      return (
        <div className="space-y-2">
          <textarea rows={3} placeholder="Текст абзаца" value={s("text")} onChange={(e) => set({ text: e.target.value })} className={FLD} />
          <div className="grid grid-cols-2 gap-2">
            {alignSel}
            {colorSel}
          </div>
          {emphasisRow}
        </div>
      );
    case "stat":
      return (
        <div className="space-y-2">
          <input placeholder="Значение (напр. «15 лет», «220+»)" value={s("value")} onChange={(e) => set({ value: e.target.value })} className={FLD} />
          <input placeholder="Подпись (напр. «на рынке»)" value={s("label")} onChange={(e) => set({ label: e.target.value })} className={FLD} />
          {alignSel}
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <textarea rows={3} placeholder="Текст цитаты" value={s("text")} onChange={(e) => set({ text: e.target.value })} className={FLD} />
          <input placeholder="Автор (необязательно)" value={s("author")} onChange={(e) => set({ author: e.target.value })} className={FLD} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <input placeholder="URL картинки" value={s("src")} onChange={(e) => set({ src: e.target.value })} className={FLD} />
          <input placeholder="Подпись (alt), необязательно" value={s("alt")} onChange={(e) => set({ alt: e.target.value })} className={FLD} />
          <label className="block text-[12px] text-paper/60">
            Высота, px (необязательно)
            <input type="number" value={n("height")} onChange={(e) => set({ height: e.target.value ? Number(e.target.value) : undefined })} className={`mt-1 ${FLD}`} />
          </label>
        </div>
      );
    case "button":
      return (
        <div className="space-y-2">
          <input placeholder="Текст кнопки" value={s("label")} onChange={(e) => set({ label: e.target.value })} className={FLD} />
          <input placeholder="Ссылка (URL)" value={s("href")} onChange={(e) => set({ href: e.target.value })} className={FLD} />
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[12px] text-paper/60">
              Стиль
              <select value={s("style") || "primary"} onChange={(e) => set({ style: e.target.value })} className={`mt-1 ${SELECT}`}>
                <option value="primary">Основная</option>
                <option value="outline">Контурная</option>
              </select>
            </label>
            {alignSel}
          </div>
        </div>
      );
    case "spacer":
      return (
        <label className="block text-[12px] text-paper/60">
          Высота отступа, px
          <input type="number" value={n("size") || 32} onChange={(e) => set({ size: Number(e.target.value) })} className={`mt-1 ${FLD}`} />
        </label>
      );
    case "html":
      return (
        <textarea rows={4} placeholder="HTML-код (без скриптов)" value={s("html")} onChange={(e) => set({ html: e.target.value })} className={`${FLD} font-mono text-xs`} />
      );
    case "columns":
      return <ColumnsEditor el={el} set={set} />;
    case "divider":
    default:
      return <p className="text-[12px] text-paper/40">Без настроек.</p>;
  }
}

/** Редактор колонок: набор колонок, в каждой — вложенный конструктор. */
function ColumnsEditor({ el, set }: { el: El; set: (patch: El) => void }) {
  const cols: El[][] = Array.isArray(el.columns) ? (el.columns as El[][]) : [];
  const setCols = (c: El[][]) => set({ columns: c });
  return (
    <div className="space-y-2">
      {cols.map((col, i) => (
        <div key={i} className="rounded-lg border border-ink-line/30 p-2">
          <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wide text-paper/40">
            <span>Колонка {i + 1}</span>
            <RowControls
              onUp={() => setCols(moveItem(cols, i, -1))}
              onDown={() => setCols(moveItem(cols, i, 1))}
              onRemove={() => setCols(cols.filter((_, j) => j !== i))}
            />
          </div>
          <ElementsField value={col} onChange={(v) => setCols(cols.map((c, j) => (j === i ? (v as El[]) : c)))} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setCols([...cols, []])}
        className="rounded-full border border-ink-line/50 px-3 py-1 text-xs text-paper/70 hover:border-gold hover:text-paper"
      >
        + Колонка
      </button>
    </div>
  );
}

/** Конструктор секции: список элементов с добавлением по типу. */
function ElementsField({ value, onChange }: { value: unknown; onChange: (v: El[]) => void }) {
  const list: El[] = Array.isArray(value) ? (value as El[]) : [];
  return (
    <div className="mt-1.5 space-y-3">
      {list.map((el, i) => (
        <div key={i} className="rounded-lg border border-ink-line/40 bg-ink/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded bg-ink px-2 py-0.5 text-[11px] uppercase tracking-wide text-gold">
              {EL_LABEL[(el.kind as string) || ""] || "Элемент"}
            </span>
            <RowControls
              onUp={() => onChange(moveItem(list, i, -1))}
              onDown={() => onChange(moveItem(list, i, 1))}
              onRemove={() => onChange(list.filter((_, j) => j !== i))}
            />
          </div>
          <ElementFields el={el} set={(patch) => onChange(list.map((e, j) => (j === i ? { ...e, ...patch } : e)))} />
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        {EL_KINDS.map((k) => (
          <button
            key={k.kind}
            type="button"
            onClick={() => onChange([...list, { kind: k.kind }])}
            className="rounded-full border border-ink-line/50 px-3 py-1 text-xs text-paper/70 hover:border-gold hover:text-paper"
          >
            + {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PortalEditor({ initial }: { initial: PortalSchema }) {
  const router = useRouter();
  const [schema, setSchema] = useState<PortalSchema>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // исходный slug портала (из маршрута) — чтобы при переименовании удалить старый файл
  const originalSlug = useRef(initial.slug);

  // AI-правка существующего портала — в виде чата с фидбеком
  type ChatMsg = { role: "user" | "assistant"; text: string };
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // как в обычном чате: при новых сообщениях/индикаторе скроллим ленту вниз
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, aiBusy]);

  function update(patch: Partial<PortalSchema>) {
    setSchema((s) => ({ ...s, ...patch }));
    setSaved(false);
  }

  function updateBrand(patch: Partial<Brand>) {
    update({ brand: { ...schema.brand, ...patch } });
  }

  /** правка карточки на главной; пустые поля убираем, чтобы наследовать тему */
  function updateCard(patch: Partial<Card>) {
    const next: Card = { ...schema.card, ...patch };
    (Object.keys(next) as (keyof Card)[]).forEach((k) => {
      if (!next[k]) delete next[k];
    });
    update({ card: Object.keys(next).length ? next : undefined });
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    update({ blocks: schema.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  }

  function setBlockProp(id: string, key: string, value: unknown) {
    const b = schema.blocks.find((x) => x.id === id);
    if (!b) return;
    updateBlock(id, { props: { ...b.props, [key]: value } });
  }

  /** Обновить несколько пропсов блока за один раз (для составных редакторов). */
  function setBlockProps(id: string, patch: Record<string, unknown>) {
    const b = schema.blocks.find((x) => x.id === id);
    if (!b) return;
    updateBlock(id, { props: { ...b.props, ...patch } });
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...schema.blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ blocks: next });
  }

  function removeBlock(id: string) {
    update({ blocks: schema.blocks.filter((b) => b.id !== id) });
  }

  function addBlock(type: BlockType) {
    const block: Block = {
      id: `${type}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      enabled: true,
      props: {},
    };
    update({ blocks: [...schema.blocks, block] });
  }

  async function sendAiMessage() {
    const text = aiPrompt.trim();
    if (!text || aiBusy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setAiPrompt("");
    setAiBusy(true);
    try {
      const res = await fetch("/api/generate-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: text, base: schema }),
      });
      const data = await res.json();
      if (!res.ok) {
        const reason =
          typeof data.message === "string" && data.message
            ? data.message
            : "Не получилось применить правку. Попробуйте ещё раз.";
        setMessages((m) => [...m, { role: "assistant", text: reason }]);
        return;
      }
      // применяем в локальное состояние — пользователь увидит и решит, сохранять
      setSchema(data.schema as PortalSchema);
      setSaved(false);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.message || "Готово — применил правку. Проверьте ниже и нажмите «Сохранить».",
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Сеть недоступна, попробуйте ещё раз." }]);
    } finally {
      setAiBusy(false);
    }
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema, prevSlug: originalSlug.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(typeof data.message === "string" ? data.message : "Не удалось сохранить.");
        return;
      }
      setSaved(true);
      const newSlug = typeof data.slug === "string" ? data.slug : schema.slug;
      // адрес портала мог поменяться — синхронизируем стейт и маршрут админки
      if (newSlug !== schema.slug) setSchema((s) => ({ ...s, slug: newSlug }));
      if (newSlug !== originalSlug.current) {
        originalSlug.current = newSlug;
        router.replace(`/admin/${newSlug}`);
      }
    } catch {
      setSaveError("Сеть недоступна.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-ink-line/50 bg-ink px-3 py-2 text-sm text-paper placeholder:text-paper/30 focus:border-gold focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 font-sans text-paper">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-sm text-paper/60 hover:text-paper">
          ← Все порталы
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={`/p/${schema.slug}`}
            target="_blank"
            className="text-sm text-paper/60 hover:text-paper"
          >
            Превью ↗
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-deep disabled:opacity-40"
          >
            {saving ? "Сохраняю…" : saved ? "Сохранено ✓" : "Сохранить"}
          </button>
        </div>
      </div>
      {saveError && <p className="mt-3 text-sm text-red-500">{saveError}</p>}

      <div className="mt-6 space-y-3">
        <label className="block text-[13px] text-paper/70">
          Название портала
          <input
            type="text"
            value={schema.name}
            onChange={(e) => update({ name: e.target.value })}
            className={`mt-1 ${inputCls} text-lg font-semibold`}
          />
        </label>
        <label className="block text-[13px] text-paper/70">
          Адрес портала
          <div className="mt-1 flex items-center gap-1.5">
            <span className="shrink-0 text-sm text-paper/40">/p/</span>
            <input
              type="text"
              value={schema.slug}
              onChange={(e) =>
                update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })
              }
              className={inputCls}
            />
          </div>
          {schema.slug !== originalSlug.current && (
            <p className="mt-1 text-[11px] leading-snug text-paper/40">
              Адрес изменится на /p/{schema.slug || "…"} — старая ссылка перестанет работать.
            </p>
          )}
        </label>
      </div>

      {/* AI-чат: правка портала текстом с фидбеком */}
      <section className="mt-8 border border-ink-line/60 bg-ink-soft p-5">
        <h2 className="text-base font-semibold">Изменить с ИИ</h2>
        <p className="mt-1 text-sm text-paper/50">
          Опишите правку — ИИ применит её и расскажет, что изменил. Изменения появятся ниже; нажмите
          «Сохранить», если подходят.
        </p>

        {messages.length > 0 && (
          <div ref={chatScrollRef} className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap border border-ink-line bg-ink px-3 py-2 text-sm text-paper"
                      : "max-w-[85%] whitespace-pre-wrap border border-ink-line/60 bg-paper px-3 py-2 text-sm text-ink"
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {aiBusy && (
              <div className="flex justify-start">
                <div className="border border-ink-line/60 bg-paper px-3 py-2 text-sm text-ink/60">
                  ИИ думает…
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex items-end gap-2">
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendAiMessage();
              }
            }}
            rows={2}
            placeholder="Напр.: сделай тёмно-зелёную тему, добавь блок FAQ и убери 3D-карту"
            className={`flex-1 ${inputCls}`}
          />
          <button
            onClick={sendAiMessage}
            disabled={aiBusy || !aiPrompt.trim()}
            className="border border-gold bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-40"
          >
            {aiBusy ? "…" : "Отправить"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-paper/40">Enter — отправить, Shift+Enter — перенос строки.</p>
      </section>

      {/* Тема */}
      <section className="mt-8 rounded-xl border border-ink-line/40 bg-ink-soft p-5">
        <h2 className="text-base font-semibold">Тема</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {COLOR_FIELDS.map((f) => (
            <ColorField
              key={f.key}
              label={f.label}
              value={schema.theme[f.key]}
              onChange={(v) => update({ theme: { ...schema.theme, [f.key]: v } })}
            />
          ))}
        </div>
        <div className="mt-5">
          <RadiusField
            value={schema.theme.radius}
            onChange={(v) => update({ theme: { ...schema.theme, radius: v } })}
          />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FontPicker
            label="Шрифт заголовков"
            value={schema.theme.fontDisplay}
            defaultKey="prata"
            fontUrl={schema.theme.fontUrl}
            onChange={(v) => update({ theme: { ...schema.theme, fontDisplay: v } })}
            onUrl={(url, fam) => update({ theme: { ...schema.theme, fontUrl: url, fontDisplay: fam } })}
          />
          <FontPicker
            label="Основной шрифт"
            value={schema.theme.fontBody}
            defaultKey="manrope"
            fontUrl={schema.theme.fontUrl}
            onChange={(v) => update({ theme: { ...schema.theme, fontBody: v } })}
            onUrl={(url, fam) => update({ theme: { ...schema.theme, fontUrl: url, fontBody: fam } })}
          />
        </div>
      </section>

      {/* Бренд и контакты — то, что видно в шапке/подвале портала */}
      <section className="mt-8 rounded-xl border border-ink-line/40 bg-ink-soft p-5">
        <h2 className="text-base font-semibold">Бренд и контакты</h2>
        <p className="mt-1 text-sm text-paper/50">Логотип в шапке, телефон и контакты портала.</p>

        <div className="mt-4 text-[13px] text-paper/70">
          Логотип в шапке (две части)
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <input
              type="text"
              value={schema.brand.logo[0]}
              onChange={(e) => updateBrand({ logo: [e.target.value, schema.brand.logo[1]] })}
              placeholder="MOSCOW CITY"
              className={inputCls}
            />
            <input
              type="text"
              value={schema.brand.logo[1]}
              onChange={(e) => updateBrand({ logo: [schema.brand.logo[0], e.target.value] })}
              placeholder="SALE"
              className={inputCls}
            />
          </div>
          <p className="mt-1 text-[11px] text-paper/40">Первая часть — акцентным цветом, вторая — обычным.</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-[13px] text-paper/70">
            Телефон
            <input
              type="text"
              value={schema.brand.phone}
              onChange={(e) =>
                updateBrand({ phone: e.target.value, phoneHref: `tel:${e.target.value.replace(/[^\d+]/g, "")}` })
              }
              placeholder="+7 (495) 255-01-61"
              className={`mt-1 ${inputCls}`}
            />
          </label>
          <label className="block text-[13px] text-paper/70">
            Название в подвале (©)
            <input
              type="text"
              value={schema.brand.name}
              onChange={(e) => updateBrand({ name: e.target.value })}
              className={`mt-1 ${inputCls}`}
            />
          </label>
          <label className="block text-[13px] text-paper/70">
            WhatsApp (ссылка)
            <input
              type="text"
              value={schema.brand.whatsapp}
              onChange={(e) => updateBrand({ whatsapp: e.target.value })}
              placeholder="https://wa.me/74952550161"
              className={`mt-1 ${inputCls}`}
            />
          </label>
          <label className="block text-[13px] text-paper/70">
            Telegram (ссылка)
            <input
              type="text"
              value={schema.brand.telegram}
              onChange={(e) => updateBrand({ telegram: e.target.value })}
              placeholder="https://t.me/…"
              className={`mt-1 ${inputCls}`}
            />
          </label>
          <label className="block text-[13px] text-paper/70 sm:col-span-2">
            Email
            <input
              type="text"
              value={schema.brand.email}
              onChange={(e) => updateBrand({ email: e.target.value })}
              placeholder="info@whitewill.ru"
              className={`mt-1 ${inputCls}`}
            />
          </label>
        </div>
      </section>

      {/* Карточка на главной */}
      <section className="mt-8 rounded-xl border border-ink-line/40 bg-ink-soft p-5">
        <h2 className="text-base font-semibold">Карточка на главной</h2>
        <p className="mt-1 text-sm text-paper/50">
          Как этот портал выглядит в секции «Проекты Whitewill». Пусто — берётся тема портала.
        </p>

        {/* Обложка */}
        <label className="mt-4 block text-[13px] text-paper/70">
          Фото-обложка (URL)
          <input
            type="text"
            value={schema.card?.image ?? ""}
            onChange={(e) => updateCard({ image: e.target.value })}
            placeholder="https://cdn.ww.estate/…/cover.jpg"
            className={`mt-1 ${inputCls}`}
          />
        </label>
        {schema.card?.image && (
          <div className="mt-3 overflow-hidden rounded-lg border border-ink-line/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={schema.card.image} alt="Превью обложки" className="h-32 w-full object-cover" />
          </div>
        )}

        {/* Логотип по центру (как projects__item-logo на whitewill) */}
        <label className="mt-4 block text-[13px] text-paper/70">
          Логотип по центру (URL, необязательно)
          <input
            type="text"
            value={schema.card?.logo ?? ""}
            onChange={(e) => updateCard({ logo: e.target.value })}
            placeholder="https://…/logo.svg — если пусто, по центру показывается название"
            className={`mt-1 ${inputCls}`}
          />
        </label>
        {schema.card?.logo && (
          <>
            <div className="mt-3 flex items-center justify-center rounded-lg border border-ink-line/40 bg-ink p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={schema.card.logo} alt="Превью логотипа" className="h-10 w-auto object-contain" />
            </div>
            <div className="mt-3 text-[13px] text-paper/70">
              Размер логотипа
              <div className="mt-2 flex gap-2">
                {([
                  ["s", "Маленький"],
                  ["m", "Средний"],
                  ["l", "Большой"],
                ] as const).map(([val, label]) => {
                  const sel = (schema.card?.logoSize ?? "m") === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateCard({ logoSize: val })}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        sel
                          ? "border-gold bg-gold/10 text-paper"
                          : "border-ink-line/50 text-paper/70 hover:border-paper/40"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Подпись-дескриптор */}
        <label className="mt-4 block text-[13px] text-paper/70">
          Подпись под названием
          <input
            type="text"
            value={schema.card?.subtitle ?? ""}
            onChange={(e) => updateCard({ subtitle: e.target.value })}
            placeholder="напр. «Портал элитных новостроек Москвы»"
            className={`mt-1 ${inputCls}`}
          />
        </label>

      </section>

      {/* Блоки */}
      <section className="mt-8">
        <h2 className="text-base font-semibold">Блоки (структура страницы)</h2>
        <div className="mt-4 space-y-3">
          {schema.blocks.map((b, i) => {
            const meta = BLOCK_META[b.type];
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-4 ${b.enabled === false ? "border-ink-line/20 opacity-50" : "border-ink-line/40"} bg-ink-soft`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{meta?.label ?? b.type}</div>
                  <div className="flex items-center gap-1 text-paper/60">
                    <button
                      onClick={() => move(i, -1)}
                      className="rounded px-2 py-1 hover:bg-ink hover:text-paper"
                      title="Выше"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      className="rounded px-2 py-1 hover:bg-ink hover:text-paper"
                      title="Ниже"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => updateBlock(b.id, { enabled: b.enabled === false })}
                      className="rounded px-2 py-1 text-xs hover:bg-ink hover:text-paper"
                    >
                      {b.enabled === false ? "Включить" : "Выключить"}
                    </button>
                    <button
                      onClick={() => removeBlock(b.id)}
                      className="rounded px-2 py-1 hover:bg-ink hover:text-red-400"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Цвета и камера 3D-карты */}
                {b.type === "city3d" && (
                  <>
                    <MapColorsEditor
                      colors={(b.props.colors as Record<string, string>) ?? null}
                      theme={schema.theme}
                      onChange={(v) => setBlockProp(b.id, "colors", v)}
                    />
                    <CameraEditor
                      camera={(b.props.camera as Record<string, unknown>) ?? null}
                      onChange={(v) => setBlockProp(b.id, "camera", v)}
                    />
                  </>
                )}

                {/* Источник данных + вид + маппинг полей */}
                {b.type === "data" && (
                  <DataBlockEditor props={b.props} setMany={(patch) => setBlockProps(b.id, patch)} />
                )}

                {/* Редактируемые поля блока */}
                {meta && meta.fields.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {meta.fields.map((field) => {
                      const val = b.props[field.key];
                      // визуальные редакторы вместо JSON
                      if (field.kind === "stringList") {
                        return (
                          <div key={field.key} className="text-[13px] text-paper/70">
                            {field.label}
                            <StringListField value={val} onChange={(v) => setBlockProp(b.id, field.key, v)} />
                          </div>
                        );
                      }
                      if (field.kind === "objectList") {
                        return (
                          <div key={field.key} className="text-[13px] text-paper/70">
                            {field.label}
                            <ObjectListField
                              value={val}
                              item={field.item ?? []}
                              addLabel={field.label}
                              onChange={(v) => setBlockProp(b.id, field.key, v)}
                            />
                          </div>
                        );
                      }
                      if (field.kind === "elements") {
                        return (
                          <div key={field.key} className="text-[13px] text-paper/70">
                            {field.label}
                            <ElementsField value={val} onChange={(v) => setBlockProp(b.id, field.key, v)} />
                          </div>
                        );
                      }
                      if (field.kind === "json") {
                        return (
                          <div key={field.key} className="text-[13px] text-paper/70">
                            {field.label}
                            <JsonField value={val} onChange={(v) => setBlockProp(b.id, field.key, v)} />
                          </div>
                        );
                      }
                      if (field.kind === "select") {
                        const cur = typeof val === "string" ? val : "";
                        return (
                          <div key={field.key} className="text-[13px] text-paper/70">
                            {field.label}
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              {(field.options ?? []).map((o) => {
                                const sel = cur === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => setBlockProp(b.id, field.key, o.value)}
                                    className={`rounded-lg border px-4 py-2 text-sm transition ${
                                      sel
                                        ? "border-gold bg-gold/10 text-paper"
                                        : "border-ink-line/50 text-paper/70 hover:border-paper/40"
                                    }`}
                                  >
                                    {o.label}
                                  </button>
                                );
                              })}
                            </div>
                            {field.hint && (
                              <p className="mt-1 text-[11px] leading-snug text-paper/40">{field.hint}</p>
                            )}
                          </div>
                        );
                      }
                      return (
                        <label key={field.key} className="block text-[13px] text-paper/70">
                          {field.label}
                          {field.kind === "textarea" ? (
                            <textarea
                              rows={2}
                              value={typeof val === "string" ? val : ""}
                              onChange={(e) => setBlockProp(b.id, field.key, e.target.value)}
                              className={`mt-1 ${inputCls}`}
                            />
                          ) : (
                            <input
                              type={field.kind === "number" ? "number" : "text"}
                              value={
                                typeof val === "string" || typeof val === "number" ? String(val) : ""
                              }
                              onChange={(e) =>
                                setBlockProp(
                                  b.id,
                                  field.key,
                                  field.kind === "number" ? Number(e.target.value) : e.target.value,
                                )
                              }
                              className={`mt-1 ${inputCls}`}
                            />
                          )}
                          {field.hint && (
                            <p className="mt-1 text-[11px] leading-snug text-paper/40">{field.hint}</p>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Расширенные настройки: CSS, ограниченный этой секцией */}
                <details className="mt-3 border-t border-ink-line/30 pt-3">
                  <summary className="cursor-pointer text-[12px] text-paper/50 hover:text-paper/80">
                    Расширенные настройки (CSS)
                  </summary>
                  <p className="mt-2 text-[11px] leading-snug text-paper/40">
                    Только на крайний случай — то, чего не задать настройками выше. Стили действуют
                    ТОЛЬКО внутри этой секции.
                  </p>
                  <textarea
                    rows={4}
                    spellCheck={false}
                    value={b.css ?? ""}
                    onChange={(e) => updateBlock(b.id, { css: e.target.value })}
                    placeholder={"напр.\nh2 { letter-spacing: .04em }\n.gold-deep-bg { background: var(--ink-soft) }"}
                    className="mt-2 w-full rounded-md border border-ink-line/50 bg-ink px-3 py-2 font-mono text-xs text-paper focus:border-gold focus:outline-none"
                  />
                </details>
              </div>
            );
          })}
        </div>

        {/* Добавить блок */}
        <div className="mt-4 flex flex-wrap gap-2">
          {BLOCK_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => addBlock(t)}
              className="rounded-full border border-ink-line/50 px-3 py-1.5 text-xs text-paper/70 hover:border-gold hover:text-paper"
            >
              + {BLOCK_META[t].label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
