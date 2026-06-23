/**
 * Библиотека блоков портала (KRE-120).
 *
 * Каждый блок — это «секция страницы». Презентационные блоки читают пропсы из
 * схемы, блоки с данными получают их через `data` (рендерер фетчит по scope).
 * Тяжёлая логика (3D, карточки, трекинг) переиспользуется из существующих
 * client-компонентов — блок только размещает её. Это и есть граница «логика на
 * нас, композиция/дизайн наверх».
 */

import type { ReactNode } from "react";
import type { PortalSchema } from "@/lib/portal/schema";
import type { ComplexCard, LotCard as LotCardType, LotFilterResult } from "@/lib/whitewill/types";
import { LotCard } from "@/components/LotCard";
import { TowersStrip } from "@/components/TowersStrip";
import { Catalog } from "@/components/Catalog";
import { towerById } from "@/portal.config";
import { CityMap3D } from "@/components/city3d/CityMap3D";
import { DataView, sortItems, toItems } from "@/components/portal/views";
import { FaqAccordion } from "@/components/portal/FaqAccordion";
import type { TowerStat } from "@/lib/portal/tower-stats";
import {
  isSourceId,
  isViewId,
  resolveFields,
  type SourceId,
  type ViewId,
} from "@/lib/portal/sources";

export type PortalData = {
  lots: LotCardType[];
  complexes: ComplexCard[];
  /** полный результат фетча лотов — для интерактивного блока `catalog` */
  lotsResult: LotFilterResult;
  /** агрегаты по башням (кол-во лотов, диапазон цен, сэмпл) — для 3D-карты */
  towerStats: Record<number, TowerStat>;
};

export type BlockProps = {
  props: Record<string, unknown>;
  schema: PortalSchema;
  data: PortalData;
};

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Префиксует внутренние ссылки порталом (/lots/1 → /p/<slug>/lots/1), чтобы вложенная страница взяла тему из маршрута. */
const withPortal = (href: string, slug: string): string =>
  href.startsWith("/") ? `/p/${slug}${href}` : href;

/** Hero — первый экран. */
export function HeroBlock({ props, schema }: BlockProps) {
  const image = str(props.image);
  // сила «тумана» поверх фото: 0 = фото чистое, 100 = полностью затемнено (умолч. 70)
  const overlay = Math.max(0, Math.min(num(props.overlay, 70), 100)) / 100;
  return (
    <section className="relative isolate overflow-hidden">
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/60 to-ink"
            style={{ opacity: overlay }}
          />
        </>
      )}
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-40">
        {str(props.kicker) && (
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-gold">{str(props.kicker)}</p>
        )}
        <h1 className="max-w-3xl font-display text-4xl leading-tight text-paper md:text-6xl">
          {str(props.title, schema.brand.name)}
        </h1>
        {str(props.subtitle) && (
          <p className="mt-6 max-w-xl text-lg text-muted">{str(props.subtitle)}</p>
        )}
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={str(props.ctaHref, "#catalog")}
            className="rounded-[var(--portal-radius)] bg-btn-primary px-7 py-3 font-semibold text-btn-primary-ink transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.03]"
          >
            {str(props.ctaLabel, "Подобрать объект")}
          </a>
          <a
            href={schema.brand.phoneHref}
            className="rounded-[var(--portal-radius)] bg-btn-dark px-7 py-3 font-medium text-btn-dark-ink ring-1 ring-inset ring-ink-line/70 transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.03]"
          >
            {schema.brand.phone}
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * 3D-карта района — переиспользуем движок CityMap3D, привязка по scope.
 * Компонент сам полноэкранный (h-svh) и со своим заголовком-оверлеем,
 * поэтому рендерим его full-bleed, без обёртки-контейнера.
 */
export function City3DBlock({ props, data, schema }: BlockProps) {
  const t = schema.theme;
  // по умолчанию цвета карты наследуются из темы; props.colors их перекрывает
  const c = (props.colors ?? {}) as Record<string, string | undefined>;
  // параметры камеры (угол/удаление/автоповорот) — опционально из props.camera
  const cam = (props.camera ?? {}) as Record<string, unknown>;
  const view = {
    azimuth: typeof cam.azimuth === "number" ? cam.azimuth : undefined,
    elevation: typeof cam.elevation === "number" ? cam.elevation : undefined,
    autoRotate: cam.autoRotate === true,
  };
  return (
    <CityMap3D
      complexes={data.complexes}
      towerStats={data.towerStats}
      portalSlug={schema.slug}
      title={str(props.title) || undefined}
      poster={str(props.poster) || str((schema.blocks.find((b) => b.type === "hero")?.props as Record<string, unknown> | undefined)?.image)}
      colors={{
        background: c.background || t.ink,
        building: c.building || t.inkSoft,
        tower: c.tower || t.inkLine,
        accent: c.accent || t.gold,
        accentDeep: c.accentDeep || t.goldDeep,
      }}
      view={view}
    />
  );
}

/** Полоса башен/ЖК. */
export function TowersBlock({ props, schema, data }: BlockProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      {str(props.title) && (
        <h2 className="mb-8 font-display text-3xl text-paper">{str(props.title)}</h2>
      )}
      <TowersStrip complexes={data.complexes} portalSlug={schema.slug} />
    </section>
  );
}

/** Сетка объектов — ядро любого портала. */
export function LotsGridBlock({ props, schema, data }: BlockProps) {
  const limit = typeof props.limit === "number" ? props.limit : 9;
  const lots = data.lots.slice(0, limit);
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      {str(props.title) && (
        <h2 className="font-display text-3xl text-paper">{str(props.title)}</h2>
      )}
      {str(props.subtitle) && <p className="mt-2 text-muted">{str(props.subtitle)}</p>}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lots.length ? (
          lots.map((lot) => <LotCard key={lot.id} lot={lot} portalSlug={schema.slug} />)
        ) : (
          <p className="text-muted">Объекты загружаются…</p>
        )}
      </div>
    </section>
  );
}

/** О проекте + статистика. */
export function AboutBlock({ props }: BlockProps) {
  const paragraphs = arr(props.paragraphs).map((p) => str(p));
  const stats = arr(props.stats).map((s) => s as { value?: string; label?: string });
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl text-paper">{str(props.title, "О портале")}</h2>
          <div className="mt-6 space-y-4 text-muted">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-6 self-center">
            {stats.map((s, i) => (
              <div key={i} className="rounded-[var(--portal-radius)] border border-ink-line/40 p-6">
                <div className="font-display text-3xl text-gold">{str(s.value)}</div>
                <div className="mt-2 text-sm text-muted">{str(s.label)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** FAQ. */
export function FaqBlock({ props }: BlockProps) {
  const items = arr(props.items).map((i) => i as { q?: string; a?: string });
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="font-display text-3xl text-paper">{str(props.title, "Вопросы")}</h2>
      <FaqAccordion items={items} />
    </section>
  );
}

/* ───────────────────────── Custom (универсальный блок) ─────────────────────────
 * Блок-конструктор: ИИ/админ собирают любую секцию из примитивов
 * (heading, text, image, button, divider, spacer, columns) или вставляют
 * «сырой» HTML (с санитайзом). Так можно сверстать что угодно без правок кода.
 */

const num = (v: unknown, fb = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fb);

/** Минимальный санитайз HTML: вырезаем скрипты, обработчики событий и js:-ссылки. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

const alignCls = (a: string) =>
  a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";

/** Цвет текста — токен темы (а не произвольный CSS). `fallback` — цвет по умолчанию для элемента. */
const colorCls = (c: string, fallback: string) =>
  c === "accent"
    ? "text-gold"
    : c === "muted"
      ? "text-muted"
      : c === "paper"
        ? "text-paper"
        : fallback;

/** Начертание текста — токены (жирность/курсив/капс), а не произвольный CSS. */
function emphasisCls(el: Record<string, unknown>): string {
  const w = str(el.weight);
  const weight =
    w === "bold"
      ? "font-bold"
      : w === "semibold"
        ? "font-semibold"
        : w === "medium"
          ? "font-medium"
          : w === "light"
            ? "font-light"
            : "";
  return [weight, el.italic ? "italic" : "", el.uppercase ? "uppercase tracking-wide" : ""]
    .filter(Boolean)
    .join(" ");
}

/** Рендер одного примитива произвольной секции. */
function renderEl(el: Record<string, unknown>, key: string | number, schema: PortalSchema): ReactNode {
  const kind = str(el.kind);
  const ac = alignCls(str(el.align));
  switch (kind) {
    case "heading": {
      const lvl = Math.min(Math.max(num(el.level, 2), 1), 4);
      const size = lvl <= 1 ? "text-4xl md:text-5xl" : lvl === 2 ? "text-3xl md:text-4xl" : "text-2xl";
      const Tag = `h${lvl}` as "h1" | "h2" | "h3" | "h4";
      return (
        <Tag
          key={key}
          className={`font-display ${colorCls(str(el.color), "text-paper")} ${emphasisCls(el)} ${size} ${ac}`}
        >
          {str(el.text)}
        </Tag>
      );
    }
    case "text":
      return (
        <p
          key={key}
          className={`max-w-3xl leading-relaxed ${colorCls(str(el.color), "text-muted")} ${emphasisCls(el)} ${ac}`}
        >
          {str(el.text)}
        </p>
      );
    case "stat":
      return (
        <div key={key} className={ac}>
          <div className="font-display text-4xl text-gold md:text-5xl">{str(el.value)}</div>
          {str(el.label) && <div className="mt-2 text-sm text-muted">{str(el.label)}</div>}
        </div>
      );
    case "quote":
      return (
        <blockquote
          key={key}
          className="border-l-2 border-gold pl-5 text-lg italic leading-relaxed text-paper/90"
        >
          {str(el.text)}
          {str(el.author) && (
            <footer className="mt-2 text-sm not-italic text-muted">— {str(el.author)}</footer>
          )}
        </blockquote>
      );
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={str(el.src)}
          alt={str(el.alt)}
          className="w-full rounded-[var(--portal-radius)] object-cover"
          style={el.height ? { height: num(el.height), objectFit: "cover" } : undefined}
        />
      );
    case "button": {
      const outline = str(el.style) === "outline";
      return (
        <div key={key} className={ac}>
          <a
            href={str(el.href, schema.brand.whatsapp)}
            className={
              outline
                ? "inline-block rounded-[var(--portal-radius)] border border-ink-line px-7 py-3 text-paper transition hover:border-gold"
                : "inline-block rounded-[var(--portal-radius)] bg-gold px-7 py-3 font-medium text-ink transition hover:bg-gold-deep"
            }
          >
            {str(el.label, "Подробнее")}
          </a>
        </div>
      );
    }
    case "divider":
      return <div key={key} className="h-px w-full bg-ink-line/50" />;
    case "spacer":
      return <div key={key} style={{ height: num(el.size, 32) }} />;
    case "columns": {
      const cols = arr(el.columns);
      return (
        <div
          key={key}
          className="grid gap-6 sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ ["--cols" as string]: String(cols.length || 1) }}
        >
          {cols.map((col, i) => (
            <div key={i} className="space-y-4">
              {arr(col).map((e, j) => renderEl(e as Record<string, unknown>, `${i}-${j}`, schema))}
            </div>
          ))}
        </div>
      );
    }
    case "html":
      return (
        <div
          key={key}
          className="ww-custom-html [&_a]:text-gold [&_h1]:font-display [&_h2]:font-display"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(str(el.html)) }}
        />
      );
    default:
      return null;
  }
}

/** Универсальная секция из примитивов. */
export function CustomBlock({ props, schema }: BlockProps) {
  const elements = arr(props.elements);
  const title = str(props.title);
  const subtitle = str(props.subtitle);
  // фон секции — токен темы (а не произвольный CSS): понятно и человеку, и ИИ
  const bgToken: Record<string, string> = {
    soft: "var(--ink-soft)",
    ink: "var(--ink)",
    accent: "var(--gold)",
  };
  const background = bgToken[str(props.background)] ?? "";
  const padded = props.padding !== "none";
  return (
    <section
      className={padded ? "py-16 md:py-20" : ""}
      style={background ? { background } : undefined}
    >
      <div className="mx-auto max-w-6xl space-y-6 px-6">
        {title && <h2 className="font-display text-3xl text-paper md:text-4xl">{title}</h2>}
        {subtitle && <p className="max-w-2xl text-muted">{subtitle}</p>}
        {elements.map((e, i) => renderEl(e as Record<string, unknown>, i, schema))}
      </div>
    </section>
  );
}

/** Финальный CTA. */
export function CtaBlock({ props, schema }: BlockProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="rounded-[var(--portal-radius)] border border-ink-line/40 bg-ink-soft px-8 py-16 text-center">
        <h2 className="font-display text-3xl text-paper md:text-4xl">
          {str(props.title, "Поможем подобрать объект")}
        </h2>
        {str(props.subtitle) && <p className="mt-4 text-muted">{str(props.subtitle)}</p>}
        <a
          href={str(props.buttonHref, schema.brand.whatsapp)}
          className="mt-8 inline-block rounded-[var(--portal-radius)] bg-btn-primary px-8 py-3 font-semibold text-btn-primary-ink transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.03]"
        >
          {str(props.buttonLabel, "Оставить заявку")}
        </a>
      </div>
    </section>
  );
}

/**
 * Данные (источник × вид) — универсальный блок «интеграции».
 * Источник (лоты/комплексы) фетчится рендерером в `data`; здесь только выбор
 * вида (карточки/список/таблица/карусель/один) и маппинг полей в слоты. Один
 * источник можно показать как угодно — без правок кода.
 */
export function DataBlock({ props, schema, data }: BlockProps) {
  const source: SourceId = isSourceId(props.source) ? props.source : "lots";
  const view: ViewId = isViewId(props.view) ? props.view : "cards";
  const fields = resolveFields(source, props.fields);
  const columns = arr(props.columns).filter((c): c is string => typeof c === "string");
  let items = sortItems(toItems(source, data), str(props.sort));
  const limit = num(props.limit, view === "single" ? 1 : 9);
  if (limit > 0) items = items.slice(0, limit);
  // внутренние ссылки несут ?portal=<slug>, чтобы страница объекта унаследовала тему
  items = items.map((it) => ({ ...it, href: withPortal(it.href, schema.slug) }));
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      {str(props.title) && <h2 className="font-display text-3xl text-paper">{str(props.title)}</h2>}
      {str(props.subtitle) && <p className="mt-2 text-muted">{str(props.subtitle)}</p>}
      <DataView view={view} items={items} source={source} fields={fields} columns={columns} />
    </section>
  );
}

/**
 * Каталог с поиском и фильтрами (интерактивный). Переиспользует общий `Catalog`
 * (умный поиск, фильтры, пагинация). Башни фильтра берутся из scope портала;
 * ссылки на лоты несут ?portal=<slug>, чтобы страница лота унаследовала тему.
 */
export function CatalogBlock({ props, schema, data }: BlockProps) {
  const towers = (schema.scope.towers ?? [])
    .map((id) => {
      const t = towerById.get(id);
      return t ? { id, name: t.name } : null;
    })
    .filter((t): t is { id: number; name: string } => t !== null);
  return (
    <section id="catalog" className="mx-auto max-w-6xl px-6 py-20">
      {str(props.title) && <h2 className="font-display text-3xl text-paper">{str(props.title)}</h2>}
      {str(props.subtitle) && <p className="mt-2 text-muted">{str(props.subtitle)}</p>}
      <div className="mt-8">
        <Catalog
          initial={data.lotsResult}
          basePath={`/p/${schema.slug}`}
          towers={towers.length ? towers : undefined}
          portalSlug={schema.slug}
        />
      </div>
    </section>
  );
}
