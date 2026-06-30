"use client";

import { useState } from "react";
import Link from "next/link";
import { brand } from "./data";
import type { Mansion } from "@/lib/osobnyaki/lots";

const dealLabel = (d: Mansion["deal"]) => (d === "rent" ? "Аренда" : "Продажа");

/* Картинка с градиент-плейсхолдером (как .osb-media на лендинге). */
function Img({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setOk(false)} className={className} />;
}

export function LotDetail({ lot }: { lot: Mansion }) {
  const gallery = lot.images.length ? lot.images : lot.image ? [lot.image] : [];
  const [active, setActive] = useState(0);

  const specs: { label: string; value: string }[] = [
    { label: "Площадь", value: lot.areaLabel },
    { label: "Этажность", value: lot.floorsLabel },
    { label: "Назначение", value: lot.purpose },
    { label: "Метро", value: lot.metro ?? "" },
    { label: "Район", value: lot.district },
  ].filter((s) => s.value);

  return (
    <article className="mx-auto max-w-[1280px] px-5 pb-20 pt-[96px] md:px-8 md:pb-28 md:pt-[112px]">
      {/* Хлебные крошки */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--osb-muted)]">
        <Link href="/osobnyaki-c" className="osb-link">Особняки</Link>
        <span aria-hidden>/</span>
        <Link href="/osobnyaki-c#catalog" className="osb-link">Каталог</Link>
        <span aria-hidden>/</span>
        <span className="text-[var(--osb-ink-soft)]">№{lot.id}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        {/* Галерея */}
        <div>
          <div className="osb-media aspect-[4/3] overflow-hidden rounded-2xl">
            {gallery[active] && <Img src={gallery[active]} alt={lot.title} className="h-full w-full object-cover" />}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span className="osb-badge">{dealLabel(lot.deal)}</span>
              {lot.featured && <span className="osb-badge" data-kind="heritage">Выбор Whitewill</span>}
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {gallery.slice(0, 10).map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActive(i)}
                  aria-label={`Фото ${i + 1}`}
                  className={`osb-media aspect-[4/3] overflow-hidden rounded-lg ring-2 transition-all ${
                    i === active ? "ring-[var(--osb-ink)]" : "ring-transparent hover:ring-[var(--osb-line-strong)]"
                  }`}
                >
                  <Img src={src} alt={`${lot.title} — фото ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Информация */}
        <div className="lg:sticky lg:top-[96px] lg:self-start">
          <div className="flex items-center gap-2 text-sm text-[var(--osb-muted)]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: lot.metroColor ?? "var(--osb-bronze)" }} aria-hidden />
            <span>{lot.metro ?? lot.district ?? "Центр Москвы"}</span>
          </div>
          <h1 className="osb-display mt-3 text-3xl text-[var(--osb-ink)] md:text-4xl">{lot.title}</h1>
          {lot.address && <p className="mt-2 text-[var(--osb-ink-soft)]">{lot.address}</p>}

          <div className="mt-6 border-t border-[var(--osb-line)] pt-6">
            <div className="osb-display osb-num text-3xl text-[var(--osb-ink)]">{lot.priceLabel}</div>
            {lot.perMLabel && <div className="osb-num mt-1 text-sm text-[var(--osb-muted)]">{lot.perMLabel}</div>}
          </div>

          {specs.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--osb-line)] pt-6">
              {specs.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs uppercase tracking-wider text-[var(--osb-muted)]">{s.label}</dt>
                  <dd className="osb-num mt-1 text-[15px] text-[var(--osb-ink)]">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <a href={brand.whatsapp} target="_blank" rel="noopener noreferrer" className="osb-btn osb-btn-primary px-7 py-3.5 text-center">
              Заказать просмотр
            </a>
            <a href={brand.phoneHref} className="osb-btn osb-btn-ghost px-7 py-3.5 text-center">
              Позвонить {brand.phone}
            </a>
          </div>
        </div>
      </div>

      {lot.description && (
        <div className="mt-14 max-w-3xl border-t border-[var(--osb-line)] pt-10">
          <h2 className="osb-display text-2xl text-[var(--osb-ink)]">Об объекте</h2>
          <p className="mt-4 leading-relaxed text-[var(--osb-ink-soft)]" style={{ textWrap: "pretty" }}>
            {lot.description}
          </p>
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-[var(--osb-line)] bg-[var(--osb-paper-2)]/50 p-6 md:p-8">
        <p className="osb-kicker">Бесплатный сервис</p>
        <h2 className="osb-display mt-3 text-2xl text-[var(--osb-ink)] md:text-3xl">
          Эксперт проекта подберёт похожие особняки
        </h2>
        <p className="mt-3 max-w-xl text-[var(--osb-ink-soft)]">
          Расскажите бюджет, район и назначение — пришлём 2–5 актуальных объектов за 25 минут.
          Подбор и показы бесплатны.
        </p>
        <Link href="/osobnyaki-c#expert" className="osb-btn osb-btn-primary mt-6 inline-flex px-7 py-3.5">
          Заказать подбор
        </Link>
      </div>
    </article>
  );
}
