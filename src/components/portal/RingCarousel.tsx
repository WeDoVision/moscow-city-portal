"use client";

import { useEffect, useRef } from "react";

/**
 * 3D-карусель (вид «ring» блока «Данные»). Кольцо карточек в CSS-3D: крутится
 * перетаскиванием/стрелками, центральная карточка в фокусе (крупнее, резче),
 * соседние уходят в размытие. Чистый CSS-transform — без WebGL, работает на
 * мобиле. Эффект «вау» как опция блока, повторяемая на любом портале.
 */
export type RingCard = {
  href: string;
  image: string;
  title: string;
  subtitle: string;
  price: string;
  badge: string;
};

const FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#1a1c24"/></svg>`,
  );

export function RingCarousel({ cards }: { cards: RingCard[] }) {
  const items = cards.slice(0, 10);
  const N = Math.max(items.length, 1);
  const step = 360 / N;
  const radius = Math.round(170 / Math.tan(Math.PI / Math.max(N, 5)));

  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const st = useRef({ angle: 0, target: 0, vel: 0, dragging: false, lastX: 0, moved: 0 });

  useEffect(() => {
    let raf = 0;
    const norm = (a: number) => {
      a = ((a % 360) + 360) % 360;
      return a > 180 ? a - 360 : a;
    };
    const frame = () => {
      const s = st.current;
      if (!s.dragging) s.angle += (s.target - s.angle) * 0.1;
      if (ringRef.current) {
        ringRef.current.style.transform = `translateZ(${-radius}px) rotateY(${s.angle}deg)`;
      }
      for (let i = 0; i < items.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const rel = norm(i * step + s.angle); // 0 = по центру (фронт)
        const t = Math.max(0, 1 - Math.abs(rel) / step); // 1 в фокусе → 0 по бокам
        el.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px) scale(${0.8 + 0.2 * t})`;
        el.style.opacity = String(0.25 + 0.75 * t);
        el.style.filter = `blur(${(1 - t) * 4}px)`;
        el.style.zIndex = String(Math.round(t * 100));
        el.style.pointerEvents = t > 0.7 ? "auto" : "none"; // кликается только центральная
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [items.length, step, radius]);

  const onDown = (e: React.PointerEvent) => {
    const s = st.current;
    s.dragging = true;
    s.lastX = e.clientX;
    s.moved = 0;
    s.vel = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = st.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.lastX;
    s.angle += dx * 0.3;
    s.vel = dx * 0.3;
    s.lastX = e.clientX;
    s.moved += Math.abs(dx);
  };
  const onUp = () => {
    const s = st.current;
    s.dragging = false;
    // лёгкий «доброс» по флику + снап к ближайшей карточке
    s.target = Math.round((s.angle + s.vel * 5) / step) * step;
  };
  const rotate = (dir: -1 | 1) => {
    const s = st.current;
    s.target = Math.round(s.angle / step) * step + dir * step;
  };

  return (
    <div className="relative mt-10">
      <div
        className="relative h-[440px] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        style={{ perspective: "1400px" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div
          ref={ringRef}
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {items.map((c, i) => (
            <a
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              href={c.href}
              onClick={(e) => {
                if (st.current.moved > 6) e.preventDefault(); // это был драг, не клик
              }}
              className="group absolute block overflow-hidden rounded-[var(--portal-radius)] border border-ink-line/40 bg-ink-soft"
              style={{
                width: 260,
                height: 360,
                left: -130,
                top: -180,
                willChange: "transform, opacity, filter",
              }}
            >
              <div className="relative h-[62%] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image || FALLBACK}
                  alt={c.title}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
                {c.badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs text-paper/90 backdrop-blur">
                    {c.badge}
                  </span>
                )}
              </div>
              <div className="p-4">
                {c.title && <h3 className="font-display text-base leading-snug text-paper">{c.title}</h3>}
                {c.subtitle && <p className="mt-1 line-clamp-1 text-xs text-muted">{c.subtitle}</p>}
                {c.price && <p className="mt-2 font-display text-lg text-gold">{c.price}</p>}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* стрелки */}
      <div className="mt-2 flex justify-center gap-3">
        <button
          type="button"
          aria-label="Назад"
          onClick={() => rotate(-1)}
          className="rounded-full border border-ink-line/60 px-4 py-2 text-paper/70 transition hover:border-gold hover:text-gold"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Вперёд"
          onClick={() => rotate(1)}
          className="rounded-full border border-ink-line/60 px-4 py-2 text-paper/70 transition hover:border-gold hover:text-gold"
        >
          →
        </button>
      </div>
    </div>
  );
}
