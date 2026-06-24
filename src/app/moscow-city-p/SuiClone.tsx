"use client";

import { useEffect, useRef, useState } from "react";
import {
  brand, announce, nav, hero, partners, integrity,
  toolkit, builders, industries, start, newsletter, faq, footerCols,
} from "./data";
import type { TowerCard } from "./page";

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".mcp-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── мини-иконки ── */
function Ic({ name, className = "" }: { name: string; className?: string }) {
  const p: Record<string, React.ReactNode> = {
    exchange: <path d="M4 8h13l-3-3M20 16H7l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    shield: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.7" /></>,
    expand: <path d="M4 14v6h6M20 10V4h-6M20 4l-7 7M4 20l7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    home: <path d="M4 11l8-6 8 6v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
    office: <><rect x="5" y="3" width="14" height="18" rx="1" stroke="currentColor" strokeWidth="1.7" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></>,
    crown: <path d="M4 8l3 9h10l3-9-5 4-3-6-3 6-5-4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
    store: <path d="M4 9l1-4h14l1 4M4 9v10h16V9M4 9h16M9 19v-5h6v5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>{p[name]}</svg>;
}

function Logo({ dark = true }: { dark?: boolean }) {
  return (
    <a href="#top" className="flex items-center gap-2" aria-label={brand.name}>
      <svg width="22" height="26" viewBox="0 0 24 28" fill="none" aria-hidden>
        <path d="M12 1C6 9 3 13 3 18a9 9 0 0018 0c0-5-3-9-9-17z" stroke={dark ? "#fff" : "#0a0a0b"} strokeWidth="1.6" />
      </svg>
      <span className={`text-xl font-semibold tracking-tight ${dark ? "text-white" : "text-[#0a0a0b]"}`}>
        Moscow<span className="text-[#4da2ff]">City</span>
      </span>
    </a>
  );
}

function AnnounceBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative z-[60] flex items-center justify-center bg-[#1aa3ff] px-10 py-2 text-center text-sm font-medium text-white">
      <a href="#industries" className="hover:underline">{announce}</a>
      <button onClick={onClose} aria-label="Закрыть" className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

function Header({ offset }: { offset: boolean }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  return (
    <header className={`sticky z-50 border-b border-[var(--line-dark)] bg-[#0a0a0b]/90 backdrop-blur-xl ${offset ? "top-0" : "top-0"}`}>
      <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between px-2.5">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setMenu(null)}>
          {nav.map((g, i) => (
            <div key={g.label} className="mcp-navitem relative" onMouseEnter={() => setMenu(i)}>
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-lg text-[#d2d7dd] transition-colors hover:text-white">
                {g.label}
                <span className="mcp-plus">+</span>
              </button>
              {menu === i && (
                <div className="absolute left-0 top-full w-64 pt-1">
                  <div className="rounded-xl border border-[var(--line-dark)] bg-[#111214] p-2 shadow-2xl">
                    {g.items.map((it) => (
                      <a key={it.label} href={it.href} className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/5">
                        <span className="text-lg text-white">{it.label}</span>
                        <span className="mcp-mono text-[10px] text-[#7d848d]">{it.note}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a href={brand.phoneHref} className="mcp-mono text-sm text-[#d2d7dd] hover:text-white">{brand.phone}</a>
          <a href="#start" className="mcp-btn-blue px-4 py-2 text-lg">Получить подбор</a>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--line-dark)] lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Меню">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">{open ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" /> : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" />}</svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-[var(--line-dark)] px-5 pb-5 pt-2 lg:hidden">
          {nav.map((g) => (
            <div key={g.label} className="border-b border-[var(--line-dark)] py-3">
              <p className="mcp-mono mb-2 text-[10px] uppercase tracking-widest text-[#7d848d]">{g.label}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {g.items.map((it) => <a key={it.label} href={it.href} onClick={() => setOpen(false)} className="rounded px-2 py-1.5 text-lg text-[#d2d7dd]">{it.label}</a>)}
              </div>
            </div>
          ))}
          <a href="#start" onClick={() => setOpen(false)} className="mcp-btn-blue mt-4 block px-4 py-3 text-center text-lg">Получить подбор</a>
        </div>
      )}
    </header>
  );
}

const HERO_WORD = "text-[21vw] leading-[0.82] md:text-[17vw] lg:text-[210px]";

function Hero() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const move = (x: number, y: number) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${x - r.left}px`);
        el.style.setProperty("--my", `${y - r.top}px`);
      });
    };
    const onMove = (e: PointerEvent) => move(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("touchmove", onTouch, { passive: true });
    return () => { cancelAnimationFrame(raf); el.removeEventListener("pointermove", onMove); el.removeEventListener("touchmove", onTouch); };
  }, []);
  return (
    <section ref={ref} id="top" className="mcp-hero relative min-h-[92vh]" style={{ "--r": "320px" } as React.CSSProperties}>
      {/* заголовок по центру: размытый базовый + резкий под спотлайтом */}
      <div className="mcp-hero-layer mcp-hero-blur">
        <div className="mcp-grid" aria-hidden />
        <h1 className={`mcp-hero-word ${HERO_WORD}`}>{hero.word}</h1>
      </div>
      <div className="mcp-hero-layer mcp-hero-sharp" aria-hidden>
        <div className="mcp-grid" aria-hidden />
        <h1 className={`mcp-hero-word ${HERO_WORD}`}>{hero.word}</h1>
      </div>
      {/* подзаголовок и кнопки — прижаты к низу секции */}
      <div className="mcp-hero-layer mcp-hero-fg">
        <p className="max-w-md text-lg text-[#eaf3ff] md:text-xl">{hero.sub}</p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
          <a href={hero.primary.href} className="mcp-hero-int mcp-btn-black px-7 py-3.5 text-lg">{hero.primary.label}</a>
          <a href={hero.secondary.href} className="mcp-hero-int mcp-btn-white px-7 py-3.5 text-lg">{hero.secondary.label}</a>
        </div>
      </div>
    </section>
  );
}

function Partners() {
  const row = [...partners, ...partners];
  return (
    <section className="mcp-light border-t border-[var(--line-light)] py-9">
      <p className="mcp-mono mb-7 text-center text-[10px] uppercase tracking-[0.3em] text-[#6b7480]">Партнёры и застройщики делового центра</p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="mcp-marquee px-8">
          {row.map((p, i) => <span key={i} className="whitespace-nowrap text-xl font-medium text-[#9099a3]">{p}</span>)}
        </div>
      </div>
    </section>
  );
}

/* Печатает текст по буквам, когда строка попадает во вьюпорт */
function Typewriter({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setShown(text.length); return; }
    let timer: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          io.disconnect();
          let i = 0;
          const tick = () => { i += 1; setShown(i); if (i < text.length) timer = setTimeout(tick, 32); };
          timer = setTimeout(tick, 32);
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [text]);
  const done = shown >= text.length;
  return (
    <h3 ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, shown)}</span>
      <span aria-hidden className={`mcp-caret ${done ? "mcp-caret-done" : ""}`}>▍</span>
    </h3>
  );
}

/* Светлая секция editorial-строк: заголовок на белом, список на светло-сером */
function Integrity() {
  const fillRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      fill.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = fill.getBoundingClientRect();
      const vh = window.innerHeight;
      // заливка растёт, пока слово едет от 78% высоты вьюпорта к 38%
      const start = vh * 0.78, end = vh * 0.38;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
      fill.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return (
    <section id="integrity" className="mcp-light scroll-mt-16 pt-24 md:pt-32">
      <div className="mx-auto mb-14 max-w-[1800px] px-2.5">
        <div className="mcp-reveal">
          <p className="mcp-mono text-lg uppercase tracking-[0.25em] text-[#1aa3ff]">{integrity.eyebrow}</p>
          <h2 className="mt-5 text-6xl font-bold leading-[1.02] tracking-tight md:text-8xl">
            {integrity.title}
            <span className="mcp-hl">
              <span>{integrity.highlight}</span>
              <span ref={fillRef} className="mcp-hl-fill" aria-hidden>{integrity.highlight}</span>
            </span>
          </h2>
        </div>
      </div>
      <div className="mcp-panel pt-6 pb-28 md:pt-10 md:pb-44">
        <div className="mcp-reveal mcp-dotted-t mx-auto max-w-[1800px] px-2.5">
          {integrity.rows.map((r) => (
            <div key={r.title} className="mcp-row mcp-dotted-b flex items-center justify-between py-8 pl-4 md:pl-[15vw]">
              <Typewriter text={r.title} className="text-4xl font-medium tracking-tight md:text-6xl" />
              <span className="mcp-iconbox grid h-14 w-14 shrink-0 place-items-center md:h-16 md:w-16"><Ic name={r.icon} className="h-7 w-7" /></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Скролл-переход синий→чёрный на canvas (как у sui между секциями) */
function CanvasTransition() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; r: number; vy: number; a: number };
    let pts: P[] = [];
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: Math.round(w / 14) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.6 + Math.random() * 1.8, vy: 0.2 + Math.random() * 0.8, a: 0.2 + Math.random() * 0.6,
      }));
    };
    const draw = () => {
      // вертикальный градиент синий (верх) → чёрный (низ)
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0a1830");
      g.addColorStop(0.45, "#0b2c63");
      g.addColorStop(0.7, "#06122a");
      g.addColorStop(1, "#0a0a0b");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // мягкое синее свечение по центру
      const rg = ctx.createRadialGradient(w / 2, h * 0.32, 0, w / 2, h * 0.32, Math.max(w, h) * 0.5);
      rg.addColorStop(0, "rgba(26,163,255,0.35)");
      rg.addColorStop(1, "rgba(26,163,255,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
      // частицы-«искры», всплывают вверх и гаснут к низу
      for (const p of pts) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(150,210,255,${p.a * (1 - p.y / h)})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.vy; if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
      }
      raf = requestAnimationFrame(draw);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cv);
    if (reduce) draw(); else raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return (
    <section className="mcp-dark relative h-[60vh] overflow-hidden md:h-[80vh]" aria-hidden>
      <canvas ref={ref} className="mcp-canvas absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-[var(--ink)]" />
    </section>
  );
}

/* Тёмная секция-таймлайн: карточки башен с фото, появляются по очереди */
function Toolkit({ towers = [] }: { towers?: TowerCard[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { el.style.setProperty("--rp", "0.5"); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.5 - r.top) / r.height));
      el.style.setProperty("--rp", p.toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  // Раскрытие медиа карточек: строго когда строка дошла до центра экрана.
  // rootMargin сжимает зону видимости до узкой полосы по центру вьюпорта.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rows = el.querySelectorAll<HTMLElement>(".mcp-reveal.relative");
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      rows.forEach((r) => r.classList.add("mcp-tower-open"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("mcp-tower-open"); io.unobserve(e.target); } }),
      { rootMargin: "-30% 0px -40% 0px", threshold: 0 },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);
  return (
    <section id="toolkit" className="mcp-dark scroll-mt-16 pt-2 pb-24 md:pb-32">
      <div className="mx-auto max-w-[1800px] px-2.5">
        <div className="mcp-reveal relative z-10 mb-20 -mt-[12vh] text-center md:-mt-[18vh]">
          <h2 className="text-6xl font-bold leading-[1.02] tracking-tight md:text-8xl">{toolkit.title}</h2>
          <p className="mt-6 inline-flex items-center gap-2 text-lg text-[var(--on-dark-mut)] md:text-xl">
            <span className="h-2 w-2 bg-[#1aa3ff]" />{toolkit.sub}
          </p>
        </div>
        <div ref={wrapRef} className="relative mx-auto max-w-[1400px]">
          <div className="mcp-tl-line absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block" />
          <span className="mcp-tl-runner hidden md:block" aria-hidden />
          <div className="pt-32 space-y-32 md:pt-56 md:space-y-56">
            {towers.map((t, i) => {
              const right = i % 2 === 1;
              return (
                <div key={t.num} className="mcp-reveal relative md:grid md:grid-cols-2 md:items-center md:gap-14" style={{ transitionDelay: "60ms" }}>
                  <span className="mcp-tl-node hidden md:block" aria-hidden />
                  <span className="mcp-tl-stub hidden md:block" style={right ? { left: "50%" } : { right: "50%" }} aria-hidden />
                  {!right && <TowerTile t={t} />}
                  {right && <div className="hidden md:block" />}
                  {!right && <div className="hidden md:block" />}
                  {right && <TowerTile t={t} />}
                </div>
              );
            })}
          </div>
        </div>
        {/* доп. высота для скролла, чтобы следующая секция появлялась не сразу */}
        <div className="h-[45vh]" aria-hidden />
      </div>
    </section>
  );
}
function TowerTile({ t }: { t: TowerCard }) {
  return (
    <a href={t.href} className="mcp-tower group relative z-10 block">
      <div className="flex items-center gap-3 border-b border-[var(--line-dark)] px-4 py-3">
        <span className="mcp-mono grid h-7 w-7 place-items-center border border-[var(--line-dark)] text-sm text-white">{t.num}</span>
        <span className="mcp-mono truncate text-[11px] tracking-wide text-[#9aa1ab]">{t.label}</span>
      </div>
      <div className="mcp-tower-media">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#0a0f18]">
          {t.img ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={t.img} alt={t.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0b2c63] to-[#06122a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent" />
          <span className="absolute bottom-3 right-3 mcp-mono bg-[#1aa3ff] px-2 py-1 text-[11px] font-semibold text-white">{t.tagline.match(/\d+\s?м/)?.[0] ?? ""}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--line-dark)] px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center border border-[var(--line-dark)] text-lg font-bold text-[#4da2ff]">{t.logo}</span>
          <span className="text-xl font-semibold text-white">{t.name}</span>
        </div>
        <span className="mcp-mono text-[#1aa3ff] opacity-0 transition-opacity group-hover:opacity-100">→</span>
      </div>
    </a>
  );
}

/* Светлая секция — две колонки в точечной рамке (как у sui) */
function Builders() {
  const cols = [builders.left, builders.right];
  return (
    <section id="builders" className="mcp-light scroll-mt-16 py-20 md:py-28">
      <div className="mcp-reveal mx-auto max-w-[1800px] px-2.5">
        <div className="mcp-dotted-t grid md:grid-cols-2">
          {cols.map((c, i) => (
            <div
              key={i}
              className={`flex flex-col px-2 py-12 md:px-12 md:py-20 ${
                i === 0 ? "mcp-dotted-b mcp-dlm-lr" : "mcp-dlm-r"
              }`}
            >
              <h2 className="text-6xl font-bold leading-[1.04] tracking-tight md:text-7xl">
                {c.title.split("\n").map((line) => (
                  <span key={line} className="block whitespace-nowrap">{line}</span>
                ))}
              </h2>
              <div className="mt-16 space-y-4 md:mt-28">
                {c.points.map((p) => (
                  <div key={p} className="flex items-center gap-3 bg-[var(--paper-2)] px-5 py-5">
                    <span className="h-3 w-3 shrink-0 bg-[#1aa3ff]" />
                    <span className="text-lg md:text-xl">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mcp-dotted-y flex justify-center py-10">
          <a href="#toolkit" className="mcp-btn-blue inline-flex items-center gap-2 px-6 py-3 text-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            Открыть каталог башен
          </a>
        </div>
      </div>
    </section>
  );
}

/* три декоративных мини-метки в шапке карточки (как лого-ряд у sui) */
function CardMarks() {
  return (
    <div className="ml-auto flex items-center gap-3 text-[#5d646d]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3c4 5 6 7 6 10a6 6 0 01-12 0c0-3 2-5 6-10z" stroke="currentColor" strokeWidth="1.5" /></svg>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" /></svg>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="4" y="4" width="7" height="7" stroke="currentColor" strokeWidth="1.5" /><rect x="13" y="13" width="7" height="7" stroke="currentColor" strokeWidth="1.5" /></svg>
    </div>
  );
}

/* Тёмная 2×2 сетка — сегменты недвижимости (как Industry transformation у sui) */
function Industries() {
  return (
    <section id="industries" className="mcp-dark scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto max-w-[1800px] px-2.5">
        <div className="mcp-reveal mb-16 text-center">
          <h2 className="mx-auto max-w-4xl text-6xl font-bold leading-[1.02] tracking-tight md:text-8xl">{industries.title}</h2>
          <p className="mt-7 inline-flex items-center gap-2.5 text-lg text-[var(--on-dark-mut)] md:text-xl">
            <span className="h-3 w-3 bg-[#1aa3ff]" />{industries.sub}
          </p>
        </div>
        <div className="mcp-reveal grid md:grid-cols-2">
          {industries.cards.map((c) => (
            <div key={c.title} className="mcp-icard flex flex-col p-7 md:p-9">
              <div className="flex items-center gap-3">
                <Ic name={c.icon} className="h-7 w-7 text-white" />
                <h3 className="text-3xl font-semibold text-white md:text-4xl">{c.title}</h3>
                <CardMarks />
              </div>
              <ul className="mcp-dotted-t mt-8 flex-1 space-y-4 pt-9">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-white">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[#1aa3ff]" aria-hidden>
                      <path d="M3 4h7M10 4v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-lg md:text-xl">{b}</span>
                  </li>
                ))}
              </ul>
              <a href="#start" className="mcp-explore mt-9 text-lg">
                <span className="mcp-explore-ar grid w-11 shrink-0 place-items-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span className="mcp-explore-lb flex-1 px-4 py-3 text-left font-semibold">{c.cta}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Тёмная секция «Начать»: строки с hover-раскрытием (как Get started у sui) */
function Start() {
  return (
    <section id="start" className="mcp-dark scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto max-w-[1800px] px-2.5">
        <p className="mcp-reveal mcp-mono mb-10 text-sm uppercase tracking-[0.25em] text-[#1aa3ff]">{start.eyebrow}</p>
        <div className="mcp-reveal mcp-dotted-t">
          {start.rows.map((r) => (
            <div key={r.title} className="mcp-start-row mcp-dotted-b grid items-start gap-y-3 px-2 py-8 md:grid-cols-2 md:px-4 md:py-10">
              <span className="mcp-start-dot" aria-hidden />
              <div className="flex items-center">
                <span className="mcp-start-ico w-16">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                </span>
                <h3 className="text-4xl font-bold tracking-tight md:text-6xl">{r.title}</h3>
              </div>
              <div>
                <p className="max-w-md text-lg text-[var(--on-dark-mut)] md:text-xl">{r.desc}</p>
                <a href={r.href || brand.telegram} className="mcp-start-cta flex">
                  <span className="mcp-btn-blue flex w-full items-center gap-3 px-4 py-3 text-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {r.cta}
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="mcp-dark border-t border-[var(--line-dark)] py-24 text-center md:py-32">
      <div className="mx-auto max-w-4xl px-5">
        <h2 className="mcp-reveal flex flex-nowrap items-center justify-center gap-x-3 whitespace-nowrap text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Оставайтесь
          <span className="inline-grid h-14 w-14 shrink-0 place-items-center bg-[#1aa3ff] align-middle sm:h-[4.5rem] sm:w-[4.5rem]">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 004 0" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          в курсе
        </h2>
        <p className="mcp-reveal mt-6 text-lg text-[var(--on-dark-mut)] md:text-lg">{newsletter.sub}</p>
        <form className="mcp-reveal mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center" onSubmit={(e) => e.preventDefault()}>
          <input type="email" required placeholder="you@email.com" className="mcp-mono w-full rounded-lg border border-[var(--line-dark)] bg-[#111214] px-4 py-3 text-lg text-white outline-none placeholder:text-[#5a626c] focus:border-[#1aa3ff] sm:w-72" />
          <button className="mcp-btn-blue px-6 py-3 text-lg">Подписаться</button>
        </form>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mcp-light scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <h2 className="mcp-reveal mb-10 text-center text-5xl font-bold tracking-tight md:text-6xl">Вопросы и ответы</h2>
        <div className="mcp-reveal mcp-dotted-t">
          {faq.map((f, i) => (
            <div key={i} className="mcp-faq mcp-dotted-b" data-open={open === i}>
              <button className="flex w-full items-center justify-between gap-4 py-5 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-xl font-semibold md:text-2xl">{f.q}</span>
                <span className="mcp-faq-chev mcp-mono shrink-0 text-2xl text-[#1aa3ff]">+</span>
              </button>
              <div className="mcp-faq-a"><p className="pb-5 text-lg text-[var(--on-light-mut)] md:text-lg">{f.a}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const social = [
    { label: "YouTube", d: "M22 8.5a3 3 0 00-2-2C18 6 12 6 12 6s-6 0-8 .5a3 3 0 00-2 2C2 10 2 12 2 12s0 2 .5 3.5a3 3 0 002 2c2 .5 8 .5 8 .5s6 0 8-.5a3 3 0 002-2C22 14 22 12 22 12s0-2-.5-3.5zM10 15V9l5 3-5 3z" },
    { label: "Telegram", d: "M21 4L3 11l5 2 2 6 3-4 5 4 3-15z" },
    { label: "VK", d: "M3 7h3c.5 4 2 6 3 6V7h3v4c1 0 2-1 3-4h3c-.5 2-2 4-3 5 1 1 3 3 3 5h-3c-1-2-2-3-3-3v3H9C5 19 3 12 3 7z" },
    { label: "WhatsApp", d: "M4 20l1.5-4A8 8 0 1112 20a8 8 0 01-4-1L4 20z" },
  ];
  return (
    <footer id="footer" className="mcp-dark border-t border-[var(--line-dark)] pt-16">
      <div className="mx-auto max-w-[1800px] px-2.5">
        <div className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {footerCols.map((col) => (
            <div key={col.title}>
              <p className="mcp-mono mb-4 text-[11px] tracking-wide text-white">{col.title}/</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}><a href="#top" className="mcp-mono flex items-center gap-1.5 text-[12px] text-[#8b929c] transition-colors hover:text-white"><span className="text-[#4a5159]">└</span>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-5 border-t border-[var(--line-dark)] py-7 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            {social.map((s) => (
              <a key={s.label} href={s.label === "Telegram" ? brand.telegram : s.label === "WhatsApp" ? brand.whatsapp : "#top"} aria-label={s.label} className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--line-dark)] text-[#8b929c] transition-colors hover:border-[#1aa3ff] hover:text-white">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d={s.d} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              </a>
            ))}
          </div>
          <p className="mcp-mono text-[11px] text-[#6b727b]">© Moscow City Sale · {brand.address}</p>
        </div>
      </div>
    </footer>
  );
}

export function SuiClone({ towers }: { towers: TowerCard[] }) {
  const [bar, setBar] = useState(true);
  useReveal();
  return (
    <div className="mcp">
      {bar && <AnnounceBar onClose={() => setBar(false)} />}
      <Header offset={bar} />
      <main>
        <Hero />
        <Partners />
        <Integrity />
        <CanvasTransition />
        <Toolkit towers={towers} />
        <Builders />
        <Industries />
        <Start />
        <Newsletter />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
