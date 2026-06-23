"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { portal, towerById } from "@/portal.config";
import type { ComplexCard } from "@/lib/whitewill/types";
import { lotPrice } from "@/lib/whitewill/client";
import type { TowerStat } from "@/lib/portal/tower-stats";
import { track } from "@/lib/analytics";
import type { CityScene as CitySceneT, MapColors } from "./CityScene";

/**
 * Скролл-пролёт по башням Москва-Сити (KRE-189).
 *
 * Секция пинится (sticky внутри высокого «трека»). Прогресс скролла ведёт
 * камеру по маршруту через башни; у каждой башни — пауза с кликабельной
 * карточкой (название, кол-во лотов, диапазон цен, CTA). Прошли последнюю —
 * секция открепляется, дальше обычный скролл. Вверх — обратный пролёт.
 * Ручного вращения нет. 3D грузится лениво поверх постера (бережём LCP).
 */
const TRAVEL = 0.55; // доля слота на перелёт, остаток — пауза у башни

export function CityMap3D({
  towerStats = {},
  portalSlug,
  title,
  poster,
  colors,
}: {
  complexes?: ComplexCard[];
  towerStats?: Record<number, TowerStat>;
  portalSlug?: string;
  title?: string;
  poster?: string;
  colors?: MapColors;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CitySceneT | null>(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // порядок облёта = порядок башен портала (синхронно с движком сцены)
  const order = useMemo(() => portal.towers.map((t) => t.id), []);
  const N = order.length;

  const lotHref = (id: number) => (portalSlug ? `/p/${portalSlug}/lots/${id}` : `/lots/${id}`);

  // 1) Ленивая инициализация 3D, когда секция близко к вьюпорту
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    let done = false;
    const trigger = () => {
      if (done) return;
      done = true;
      setInView(true);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    const near = () => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 1.5 && r.bottom > -window.innerHeight * 0.5;
    };
    const onScroll = () => near() && trigger();
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && trigger(), {
      rootMargin: "500px",
    });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (near()) trigger();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // 2) Создание сцены
  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    let scene: CitySceneT | null = null;
    let measure: (() => void) | null = null;

    (async () => {
      const [{ CityScene }, res] = await Promise.all([
        import("./CityScene"),
        fetch("/data/moscow-city.json"),
      ]);
      if (cancelled || !canvasRef.current) return;
      const data = await res.json();
      scene = new CityScene(canvasRef.current, data.buildings, colors, () => {});
      sceneRef.current = scene;
      setReady(true);

      measure = () => {
        const el = stickyRef.current;
        if (el && scene) scene.resize(el.clientWidth, el.clientHeight);
      };
      measure();
      window.addEventListener("resize", measure);
      // прогресс синхронизируется эффектом ниже при смене `ready`
    })();

    return () => {
      cancelled = true;
      if (measure) window.removeEventListener("resize", measure);
      scene?.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  // 3) Скролл → прогресс пролёта (камера + активная башня + карточка)
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const track = trackRef.current;
      const scene = sceneRef.current;
      if (!track) return;
      const total = track.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-track.getBoundingClientRect().top, 0), Math.max(1, total));
      const p = total > 0 ? scrolled / total : 0;
      scene?.setProgress(p);
      setProgress(p);

      // активная башня = та, у которой сейчас пауза
      const slot = 1 / N;
      let i = Math.floor(p / slot);
      if (i >= N) i = N - 1;
      if (i < 0) i = 0;
      const local = (p - i * slot) / slot;
      const act = local >= TRAVEL - 0.05 ? order[i] : null;
      scene?.setActiveTower(act);
      setActive(act);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    compute();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [order, N, ready]);

  // 4) Двусторонняя связка: результаты поиска подсвечивают башни
  useEffect(() => {
    const onResult = (e: Event) => {
      const detail = (e as CustomEvent).detail as { towers?: number[] } | undefined;
      sceneRef.current?.setHighlighted(new Set(detail?.towers ?? []));
    };
    window.addEventListener("portal:resultTowers", onResult);
    return () => window.removeEventListener("portal:resultTowers", onResult);
  }, []);

  const goToLots = (towerId: number) => {
    track("cta_click", { cta: "map3d_show_lots", towerId });
    window.dispatchEvent(new CustomEvent("portal:applyFilters", { detail: { towers: [towerId] } }));
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const activeTower = active ? towerById.get(active) : null;
  const activeStat = active ? towerStats[active] : undefined;
  const activeIndex = active ? order.indexOf(active) : -1;

  return (
    // высокий «трек»: его прокрутка = пролёт. (N+1) экранов: обзор + по башне.
    <section aria-label="3D-карта Москва-Сити" ref={trackRef} style={{ height: `${(N + 1) * 100}svh` }}>
      <div ref={stickyRef} className="sticky top-0 h-svh overflow-hidden">
        {/* Постер-фолбэк до готовности 3D (LCP) */}
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            aria-hidden
            className={`absolute inset-0 h-full w-full scale-105 object-cover transition-opacity duration-700 ${
              ready ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
            <p className="animate-pulse text-sm tracking-[0.3em] text-paper/80">ЗАГРУЖАЕМ КАРТУ СИТИ…</p>
          </div>
        )}

        {/* заголовок + подсказка */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 pt-20 text-center transition-opacity duration-500 ${
            progress > 0.04 ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Интерактивная карта</p>
          <h2 className="mt-2 font-display text-3xl text-paper md:text-5xl">
            {title ?? "Семь башен Москва-Сити"}
          </h2>
          <p className="mt-3 text-sm text-paper/60">Скролльте — камера пролетает сквозь башни</p>
        </div>

        {/* индикатор прогресса по башням */}
        {ready && (
          <div className="pointer-events-none absolute left-1/2 top-6 flex -translate-x-1/2 gap-1.5">
            {order.map((id, i) => (
              <span
                key={id}
                className={`h-1 w-6 rounded-[var(--portal-radius)] transition-colors duration-300 ${
                  i === activeIndex ? "bg-gold" : "bg-paper/25"
                }`}
              />
            ))}
          </div>
        )}

        {/* карточка башни в момент паузы — кликабельна (фильтр каталога) */}
        {activeTower && (
          <aside
            className="absolute bottom-8 left-1/2 w-[min(92vw,420px)] -translate-x-1/2 border border-ink-line/60 bg-ink/85 p-5 backdrop-blur-md transition-all duration-300 md:bottom-auto md:left-auto md:right-10 md:top-1/2 md:-translate-x-0 md:-translate-y-1/2 rounded-[var(--portal-radius)]"
            style={{ animation: "wwCardIn 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            <button
              type="button"
              onClick={() => goToLots(activeTower.id)}
              className="block w-full text-left"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                Башня {activeIndex + 1} из {N}
              </p>
              <h3 className="mt-1 font-display text-2xl text-paper">{activeTower.name}</h3>
              <p className="mt-1 text-sm text-paper/65">{activeTower.tagline}</p>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="font-semibold text-gold">
                  {activeStat?.count ?? 0} {plural(activeStat?.count ?? 0)}
                </span>
                {activeStat?.priceLabel && (
                  <>
                    <span className="text-muted">·</span>
                    <span className="text-paper/75">{activeStat.priceLabel}</span>
                  </>
                )}
              </div>
            </button>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => goToLots(activeTower.id)}
                className="flex-1 bg-btn-primary py-2.5 text-sm font-semibold text-btn-primary-ink transition-transform duration-300 hover:-translate-y-0.5 rounded-[var(--portal-radius)]"
              >
                Смотреть лоты
              </button>
              <Link
                href={portalSlug ? `/p/${portalSlug}/towers/${activeTower.slug}` : `/towers/${activeTower.slug}`}
                className="flex-1 border border-gold/60 py-2.5 text-center text-sm text-gold transition-colors hover:bg-gold hover:text-ink rounded-[var(--portal-radius)]"
              >
                О башне
              </Link>
            </div>
          </aside>
        )}

        {/* виньетки для глубины */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />
      </div>
    </section>
  );
}

function plural(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "лот";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "лота";
  return "лотов";
}

export default CityMap3D;
