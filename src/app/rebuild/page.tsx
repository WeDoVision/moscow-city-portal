/**
 * Корень — полный клон главной whitewill.ru.
 * Тёмная фирменная тема агентства: фон #0C1B20/#000A0D, текст cream #F0EAE3,
 * золотой акцент #BF9E77. Единственная светлая секция — баннер партнёрки.
 * Реальные тексты и фото с боевого сайта (см. components/ww/data.ts).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { listPortals } from "@/lib/portal/store";
import type { PortalSchema } from "@/lib/portal/schema";
import { fontCss } from "@/lib/portal/fonts";
import {
  AGENCY,
  NAV,
  HERO,
  TILES,
  BEST_OFFERS,
  CATALOG,
  AWARDS,
  RATINGS,
  REVIEWS,
  QUALITY,
  PROJECTS,
  OFFICE,
  PARTNER,
  BLOG,
  NEWS,
  OFFICES,
  FOOTER_MENU,
  SOC,
  img,
} from "@/components/ww/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Элитная недвижимость в Москве — агентство Whitewill",
  description:
    "Whitewill — ваш ключ к элитной недвижимости в Москве. Откройте двери в мир роскоши и комфорта с нашими эксклюзивными предложениями. Ваша мечта начинается здесь.",
};

const serif = { fontFamily: "var(--font-prata), serif" } as const;

export default async function WhitewillClone() {
  const portals = await listPortals();
  return (
    <div className="min-h-screen bg-[#0C1B20] text-[#F0EAE3]">
      <Header />
      <Hero />
      <Tiles />
      <BestOffers />
      <Catalog />
      <Awards />
      <Testimonials />
      <Quality />
      <Projects portals={portals} />
      <Office />
      <Partner />
      <Blog />
      <News />
      <Contacts />
      <Footer />
    </div>
  );
}

/* ───────── Section heading (uppercase serif + subtitle справа) ───────── */
function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10 grid items-end gap-4 md:grid-cols-2">
      <h2 style={serif} className="text-3xl uppercase md:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="text-[#F0EAE3]/55 md:justify-self-end md:text-right md:max-w-md">{subtitle}</p>}
    </div>
  );
}

function GoldBtn({ children, href, dark }: { children: React.ReactNode; href: string; dark?: boolean }) {
  return (
    <a
      href={href}
      className={`inline-block px-7 py-3 text-sm font-medium uppercase tracking-wide transition ${
        dark
          ? "bg-[#0C1B20] text-[#F0EAE3] hover:bg-black"
          : "bg-[#BF9E77] text-[#0C1B20] hover:bg-[#997650]"
      }`}
    >
      {children}
    </a>
  );
}

/* ───────────────────────── Header ───────────────────────── */
function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1400px] items-start justify-between px-6 py-6 text-[#F0EAE3]">
        {/* лого */}
        <div className="flex items-center gap-3">
          <span style={serif} className="text-3xl leading-none text-[#BF9E77]">
            W
          </span>
          <div className="text-xs leading-tight">
            <div className="font-semibold tracking-wide">Whitewill</div>
            <div className="text-[#F0EAE3]/50">{AGENCY.legal}</div>
          </div>
        </div>
        {/* центр: адрес + телефон */}
        <div className="hidden flex-col items-center gap-1 text-center text-xs text-[#F0EAE3]/70 lg:flex">
          <div className="flex gap-4 text-[#F0EAE3]/50">
            <span>Загородный</span>
            <span className="text-[#BF9E77]">Головной</span>
          </div>
          <div className="text-[#F0EAE3]/70">
            Пресненская набережная, 6с2, башня «Империя», офис 4315
          </div>
          <a href={AGENCY.phones[0].href} className="text-base font-semibold text-[#F0EAE3]">
            {AGENCY.phones[0].label}
          </a>
          <span className="flex items-center gap-1.5 text-[#F0EAE3]/50">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" /> Сейчас работаем
          </span>
        </div>
        {/* справа: город + бургер */}
        <div className="flex items-center gap-4">
          <span className="rounded-full border border-[#F0EAE3]/25 px-4 py-1.5 text-xs">Москва</span>
          <button aria-label="Меню" className="flex flex-col gap-1.5">
            <span className="block h-px w-7 bg-[#F0EAE3]" />
            <span className="block h-px w-7 bg-[#F0EAE3]" />
            <span className="block h-px w-7 bg-[#F0EAE3]" />
          </button>
        </div>
      </div>
      {/* навигация по типам — поверх hero снизу */}
      <nav className="mx-auto hidden max-w-[1400px] gap-7 px-6 text-sm text-[#F0EAE3]/80 lg:flex">
        {NAV.map((n) => (
          <a key={n.title} href={n.href} className="hover:text-[#BF9E77]">
            {n.title}
          </a>
        ))}
      </nav>
    </header>
  );
}

/* ───────────────────────── Hero (full-bleed фото) ───────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-[760px] w-full overflow-hidden bg-[#0C1B20]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img(HERO.bg, 1920)}
        alt="Команда Whitewill"
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      {/* затемнение снизу для читаемости заголовка */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0C1B20] via-[#0C1B20]/30 to-[#0C1B20]/40" />
      <div className="relative mx-auto flex min-h-[760px] max-w-[1400px] flex-col justify-end px-6 pb-16">
        <div className="grid items-end gap-8 md:grid-cols-2">
          <div className="relative">
            {/* золотой бейдж-награда */}
            <div className="mb-8 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(HERO.cup, 120)} alt="" className="h-16 w-auto object-contain" />
              <span className="max-w-[8rem] text-[10px] uppercase leading-tight tracking-wider text-[#BF9E77]">
                {HERO.badge}
              </span>
            </div>
            <h1 style={serif} className="text-5xl uppercase leading-[1.05] text-[#F0EAE3] md:text-7xl">
              {HERO.titleTop}
              <br />
              <span className="md:ml-24">{HERO.titleMid}</span>
            </h1>
          </div>
          <p className="text-[#F0EAE3]/80 md:justify-self-end md:max-w-sm md:text-right">{HERO.text}</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Tiles (6 в ряд) ───────────────────────── */
function Tiles() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {TILES.map((t) => (
          <a
            key={t.title}
            href={t.href}
            className="group relative flex h-56 flex-col justify-between overflow-hidden bg-[#15242A] p-5"
          >
            <span className="relative z-10 text-base font-medium text-[#F0EAE3]">{t.title}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img(t.bg, 400)}
              alt=""
              className="absolute inset-x-0 bottom-0 h-2/3 w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
            />
          </a>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Best offers (bento) ───────────────────────── */
function BestOffers() {
  const [c1, c2, c3] = BEST_OFFERS.complexes;
  const [l1, l2, l3] = BEST_OFFERS.lots;
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16">
      <SectionHead title="Лучшие предложения" subtitle={BEST_OFFERS.subtitle} />
      <div className="grid gap-3 md:grid-cols-3 md:grid-rows-2">
        {/* Republic — широкая, текст слева + фото справа */}
        <a href={c1.href} className="group relative col-span-2 row-span-1 flex overflow-hidden bg-[#15242A]">
          <div className="z-10 flex flex-col justify-center p-8">
            <div className="text-xs uppercase tracking-wider text-[#BF9E77]">{c1.label}</div>
            <div style={serif} className="mt-1 text-3xl uppercase text-[#BF9E77]">{c1.title}</div>
            <div className="mt-2 text-sm text-[#F0EAE3]/80">{c1.info}</div>
            <p className="mt-3 max-w-xs text-sm text-[#F0EAE3]/55">{c1.desc}</p>
            <span className="mt-6 inline-block w-fit border border-[#F0EAE3]/25 px-5 py-2 text-xs uppercase tracking-wide group-hover:border-[#BF9E77]">
              На страницу комплекса
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(c1.img, 700)} alt={c1.title} className="absolute right-0 top-0 h-full w-3/5 object-cover" />
        </a>

        {/* Primavera — вертикальное фото */}
        <a href={c2.href} className="group relative row-span-2 overflow-hidden bg-[#15242A]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(c2.img, 600)} alt={c2.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="text-xs uppercase tracking-wider text-[#BF9E77]">{c2.label}</div>
            <div style={serif} className="text-2xl uppercase text-[#F0EAE3]">{c2.title}</div>
            <div className="mt-1 text-sm text-[#F0EAE3]/80">{c2.desc}</div>
          </div>
        </a>

        {/* Shift — светлая текстовая карточка */}
        <a href={c3.href} className="group relative flex flex-col justify-center bg-[#F0EAE3] p-8 text-[#0C1B20]">
          <div className="text-xs uppercase tracking-wider text-[#997650]">{c3.label}</div>
          <div style={serif} className="mt-1 text-3xl uppercase">{c3.title}</div>
          <div className="mt-2 text-sm">{c3.info}</div>
          <p className="mt-2 text-sm text-[#0C1B20]/60">{c3.desc}</p>
        </a>

        {/* Видовые апартаменты — фото + тёмная карточка лота */}
        <a href={l1.href} className="group relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(l1.img, 600)} alt={l1.title} className="h-full min-h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
        </a>
        <a href={l1.href} className="group relative flex flex-col justify-center bg-[#15242A] p-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#BF9E77]">
            <span>{l1.label}</span>
            <span className="text-[#F0EAE3]/40">№ {l1.lot}</span>
          </div>
          <div style={serif} className="mt-2 text-2xl uppercase text-[#F0EAE3]">{l1.title}</div>
          <div className="mt-3 text-sm text-[#F0EAE3]/70">{l1.info}</div>
          <span className="mt-6 inline-block w-fit border border-[#F0EAE3]/25 px-5 py-2 text-xs uppercase tracking-wide group-hover:border-[#BF9E77]">
            На страницу лота
          </span>
        </a>
      </div>

      {/* нижний ряд: ещё два лота */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {[l2, l3].map((l) => (
          <a key={l.lot} href={l.href} className="group relative h-72 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(l.img, 700)} alt={l.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="text-[11px] uppercase tracking-wider text-[#BF9E77]">№ {l.lot}</div>
              <div style={serif} className="text-xl uppercase text-[#F0EAE3]">{l.title}</div>
              <div className="mt-1 text-sm text-[#F0EAE3]/75">{l.info}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Catalog ───────────────────────── */
function Catalog() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16">
      <div className="grid items-center gap-10 md:grid-cols-2">
        {/* колонка превью слева */}
        <div className="no-scrollbar flex max-h-[460px] flex-col items-start gap-4 overflow-hidden">
          {CATALOG.previews.slice(0, 4).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={img(p, 360)} alt="" className="h-28 w-64 rounded-sm object-cover" />
          ))}
        </div>
        <div className="text-center md:text-left">
          <h2 style={serif} className="text-3xl uppercase md:text-5xl">{CATALOG.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-[#F0EAE3]/55 md:mx-0">{CATALOG.subtitle}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(CATALOG.cover, 500)} alt="Каталог Whitewill" className="mx-auto my-8 w-64 rotate-3 rounded shadow-2xl md:mx-0" />
          <GoldBtn href="#">Скачать каталог</GoldBtn>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Awards ───────────────────────── */
function Awards() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16">
      <SectionHead title="Первые места по продажам" subtitle={AWARDS.subtitle} />
      <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
        {AWARDS.items.map((a) => (
          <div key={a.desc} className="flex flex-col items-center gap-4 text-center">
            <div className="relative flex h-20 items-center justify-center">
              <span className="absolute text-5xl text-[#BF9E77]/30">❧</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.logo} alt="" className="relative h-8 w-auto max-w-[120px] object-contain brightness-0 invert" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#BF9E77]">Топ 1</div>
            <p className="text-xs text-[#F0EAE3]/65">{a.desc}</p>
          </div>
        ))}
        <a href="https://whitewill.ru/about" className="flex items-center justify-center text-xs uppercase tracking-wide text-[#BF9E77]">
          Все награды →
        </a>
      </div>
    </section>
  );
}

/* ───────────────────────── Testimonials ───────────────────────── */
function Testimonials() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <h2 style={serif} className="text-3xl uppercase md:text-5xl">Отзывы клиентов</h2>
        <div className="flex flex-wrap gap-3">
          {RATINGS.map((r, i) => (
            <div
              key={r.platform}
              className={`flex items-center gap-3 px-5 py-3 ${i === 0 ? "bg-[#BF9E77] text-[#0C1B20]" : "bg-[#15242A] text-[#F0EAE3]"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.icon} alt={r.platform} className={`h-6 w-6 object-contain ${i === 0 ? "" : ""}`} />
              <div>
                <div className="text-lg font-semibold">{r.score} ★</div>
                <div className="text-[11px] opacity-70">{r.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {REVIEWS.map((rv) => (
          <div key={rv.name} className="flex w-80 flex-none flex-col bg-[#15242A] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BF9E77] font-semibold text-[#0C1B20]">
                {rv.name[0]}
              </div>
              <div>
                <div className="font-medium text-[#F0EAE3]">{rv.name}</div>
                <div className="text-[#BF9E77]">★★★★★</div>
              </div>
            </div>
            <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-[#F0EAE3]/70">{rv.text}</p>
            <span className="mt-4 text-xs uppercase tracking-wide text-[#BF9E77]">Читать полный отзыв ›</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Quality / form ───────────────────────── */
function Quality() {
  return (
    <section className="relative mx-auto max-w-[1400px] overflow-hidden px-6 py-16">
      <div className="grid items-end gap-8 md:grid-cols-2">
        <div className="pb-8">
          <h2 style={serif} className="text-3xl md:text-4xl">{QUALITY.title}</h2>
          <p className="mt-5 max-w-md text-[#F0EAE3]/60">{QUALITY.text}</p>
          <div className="mt-8">
            <GoldBtn href="#">{QUALITY.cta}</GoldBtn>
          </div>
        </div>
        <div className="relative flex items-end justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(QUALITY.photo, 500)} alt={QUALITY.person} className="max-h-[420px] object-contain" />
          <div className="absolute bottom-6 right-0 bg-[#0C1B20]/90 px-5 py-3">
            <div className="text-sm font-medium uppercase tracking-wide text-[#F0EAE3]">{QUALITY.person}</div>
            <div className="text-xs text-[#F0EAE3]/55">{QUALITY.position}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Projects (созданные порталы платформы) ───────────────────────── */
function Projects({ portals }: { portals: PortalSchema[] }) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16">
      <SectionHead title="Проекты Whitewill" subtitle={PROJECTS.subtitle} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {portals.map((p) => {
          // карточка: фото-обложка (card.image) поверх темы портала
          const bg = p.theme.ink;
          const text = p.theme.paper;
          const accent = p.theme.gold;
          const cover = p.card?.image;
          const titleFont = fontCss(undefined);
          return (
            <Link
              key={p.slug}
              href={`/p/${p.slug}`}
              className="group relative flex h-52 flex-col justify-between overflow-hidden p-7 transition hover:-translate-y-1"
              style={{ background: bg, color: text }}
            >
              {cover && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img(cover, 600)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                </>
              )}
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
              <div className="relative z-10">
                <div style={{ fontFamily: titleFont, color: cover ? "#fff" : text }} className="text-2xl leading-tight">
                  {p.name}
                </div>
                <div className="mt-2 text-sm" style={{ color: cover ? "rgba(255,255,255,0.7)" : p.theme.muted }}>
                  /{p.slug}
                </div>
              </div>
              <div
                className="relative z-10 flex items-center justify-between text-xs uppercase tracking-wide"
                style={{ color: cover ? "rgba(255,255,255,0.8)" : p.theme.muted }}
              >
                <span>{p.scope.deal === "rent" ? "аренда" : "продажа"} · {p.blocks.length} блоков</span>
                <span style={{ color: accent }}>Открыть →</span>
              </div>
            </Link>
          );
        })}

        {portals.length === 0 && (
          <div className="col-span-full py-10 text-center text-sm text-[#F0EAE3]/50">
            Пока нет созданных порталов.
          </div>
        )}
      </div>
      <div className="mt-8 text-center">
        <Link href="/admin" className="text-xs uppercase tracking-wide text-[#BF9E77]">
          Платформа / создать портал +
        </Link>
      </div>
    </section>
  );
}

/* ───────────────────────── Office ───────────────────────── */
function Office() {
  return (
    <section className="relative overflow-hidden py-16">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img(OFFICE.leavesLeft, 400)} alt="" className="pointer-events-none absolute left-0 top-1/3 w-40 opacity-60 md:w-64" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img(OFFICE.leavesRight, 400)} alt="" className="pointer-events-none absolute right-0 top-1/4 w-40 opacity-60 md:w-64" />
      <div className="relative mx-auto max-w-[1400px] px-6 text-center">
        <h2 style={serif} className="text-3xl uppercase md:text-5xl">В офисе, как дома</h2>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          {OFFICE.tabs.map((t, i) => (
            <span key={t} className={i === 0 ? "border-b border-[#BF9E77] pb-1 text-[#BF9E77]" : "text-[#F0EAE3]/50"}>
              {t.toUpperCase()}
            </span>
          ))}
        </div>
        <div className="no-scrollbar mt-10 flex gap-4 overflow-x-auto pb-2">
          {OFFICE.photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={img(p, 600)} alt="" className="h-72 w-[28rem] flex-none rounded-sm object-cover" />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Partner banner (светлая) ───────────────────────── */
function Partner() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="relative grid items-center gap-8 overflow-hidden bg-[#F0EAE3] text-[#0C1B20] md:grid-cols-2">
        <div className="p-10 md:p-14">
          <h2 style={serif} className="text-3xl uppercase md:text-4xl">{PARTNER.title}</h2>
          <p className="mt-5 max-w-md text-[#0C1B20]/70">{PARTNER.text}</p>
          <div className="mt-8">
            <GoldBtn href="https://whitewill.ru/partners">{PARTNER.cta}</GoldBtn>
          </div>
        </div>
        <div className="relative flex h-full items-center justify-end p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(PARTNER.ipad, 700)} alt="" className="w-full max-w-lg object-contain" />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Blog ───────────────────────── */
function Blog() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-10">
      <h2 style={serif} className="mb-8 text-3xl uppercase md:text-4xl">Блог компании</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {BLOG.map((b) => (
          <a key={b.title} href="https://whitewill.ru/blog" className="group w-72 flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(b.img, 400)} alt="" className="h-44 w-full rounded-sm object-cover" />
            <div className="mt-3 text-sm font-medium leading-snug text-[#F0EAE3] group-hover:text-[#BF9E77]">{b.title}</div>
            <div className="mt-3 text-xs uppercase tracking-wide text-[#BF9E77]">Читать статью ›</div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── News ───────────────────────── */
function News() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16">
      <SectionHead title="Новости" subtitle={NEWS.subtitle} />
      <div className="grid gap-4 md:grid-cols-3">
        {NEWS.items.map((n) => (
          <a key={n.title} href="https://whitewill.ru/blog" className="group flex flex-col bg-[#15242A] p-6">
            <div className="flex items-center justify-between text-xs text-[#F0EAE3]/45">
              <span>{n.date}</span>
              <span className="text-[#BF9E77]">#{n.tag}</span>
            </div>
            <div style={serif} className="mt-4 text-lg leading-snug text-[#F0EAE3] group-hover:text-[#BF9E77]">{n.title}</div>
            <p className="mt-3 text-sm text-[#F0EAE3]/55">{n.text}</p>
            <span className="mt-5 text-xs uppercase tracking-wide text-[#BF9E77]">Читать статью ›</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Contacts ───────────────────────── */
function Contacts() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 style={serif} className="text-3xl uppercase md:text-5xl">Офисы Whitewill</h2>
          <div className="mt-4 flex gap-6 text-sm">
            {OFFICES.map((o, i) => (
              <span key={o.city} className={i === 0 ? "border-b border-[#BF9E77] pb-1 text-[#BF9E77]" : "text-[#F0EAE3]/50"}>
                {o.city.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
        <div className="text-sm text-[#F0EAE3]/70 md:text-right">
          <div className="max-w-xs">{OFFICES[0].address}</div>
          <a href={`tel:${OFFICES[0].phone.replace(/[^+\d]/g, "")}`} className="mt-2 inline-block text-base font-semibold text-[#F0EAE3]">
            {OFFICES[0].phone}
          </a>
        </div>
      </div>
      <div className="relative h-80 overflow-hidden bg-[#15242A]">
        <iframe
          title="Карта офиса Whitewill"
          className="h-full w-full opacity-90"
          src="https://yandex.ru/map-widget/v1/?ll=37.539%2C55.749&z=15&pt=37.539,55.749"
          loading="lazy"
        />
        <a
          href="#"
          className="absolute bottom-6 right-6 bg-[#BF9E77] px-6 py-3 text-xs font-medium uppercase tracking-wide text-[#0C1B20] hover:bg-[#997650]"
        >
          Написать нам
        </a>
      </div>
    </section>
  );
}

/* ───────────────────────── Footer ───────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-[#F0EAE3]/10 bg-[#000A0D] py-14 text-[#F0EAE3]">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr_1fr]">
          <div className="flex items-start gap-3">
            <span style={serif} className="text-4xl leading-none text-[#BF9E77]">W</span>
            <div className="text-xs">
              <div className="font-semibold tracking-wide">Whitewill</div>
              <div className="text-[#F0EAE3]/50">{AGENCY.legal}</div>
              <div className="mt-5 flex gap-3">
                {SOC.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    aria-label={s.name}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#BF9E77]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.icon} alt="" className="h-4 w-4 object-contain invert" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-4 text-sm font-medium">{FOOTER_MENU.title}</div>
            <ul className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
              {FOOTER_MENU.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[#F0EAE3]/65 hover:text-[#BF9E77]">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:text-right">
            {AGENCY.phones.map((p) => (
              <a key={p.href} href={p.href} className="block text-lg font-semibold text-[#BF9E77]">
                {p.label}
              </a>
            ))}
            <a
              href="#"
              className="mt-4 inline-block bg-[#BF9E77] px-6 py-3 text-xs font-medium uppercase tracking-wide text-[#0C1B20] hover:bg-[#997650]"
            >
              Заказать звонок
            </a>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-[#F0EAE3]/10 pt-6 text-xs text-[#F0EAE3]/40 md:flex-row md:justify-between">
          <span>© {new Date().getFullYear()} Whitewill. Агентство элитной недвижимости.</span>
          <div className="flex flex-wrap gap-4">
            <a href="https://whitewill.ru" className="hover:text-[#F0EAE3]/70">Пользовательское соглашение</a>
            <a href="https://whitewill.ru" className="hover:text-[#F0EAE3]/70">Политика обработки персональных данных</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
