"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { towerById } from "@/portal.config";
import type { ComplexCard } from "@/lib/whitewill/types";
import { imageUrl, lotPrice } from "@/lib/whitewill/client";
import type { TowerStat } from "@/lib/portal/tower-stats";
import { track } from "@/lib/analytics";
import type { CityScene as CitySceneT, MapColors, MapView } from "./CityScene";

/**
 * Интерактивная 3D-карта Сити: реальная геометрия района (OSM),
 * драг-вращение камеры, hover-тултип с лотами/ценой, клик по башне —
 * боковая панель с реальными лотами и плавный заход камеры. Сцена грузится
 * лениво (IntersectionObserver) поверх постера, чтобы не бить по LCP.
 * Позиции лейблов обновляются императивно (без re-render на каждый кадр).
 */
export function CityMap3D({
  complexes,
  towerStats = {},
  portalSlug,
  title,
  poster,
  colors,
  view,
}: {
  complexes: ComplexCard[];
  towerStats?: Record<number, TowerStat>;
  portalSlug?: string;
  title?: string;
  poster?: string;
  colors?: MapColors;
  view?: MapView;
}) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CitySceneT | null>(null);
  const labelRefs = useRef(new Map<number, HTMLButtonElement>());
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [labelHover, setLabelHover] = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const cxById = new Map(complexes.map((c) => [c.id, c]));

  const lotHref = (id: number) => (portalSlug ? `/p/${portalSlug}/lots/${id}` : `/lots/${id}`);

  // drag state
  const dragRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const handlePick = useCallback((tid: number | null) => {
    setSelected(tid);
    sceneRef.current?.focusTower(tid);
    if (tid) track("tower_view", { towerId: tid, source: "map3d" });
  }, []);

  // 1) Ленивая инициализация: грузим 3D только когда секция близко к вьюпорту.
  //    Надёжно к окружениям, где IntersectionObserver молчит: моментальная
  //    проверка близости + фолбэк на scroll, помимо самого IO.
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
      // секция в зоне видимости или в пределах ~1.5 экрана снизу
      return r.top < window.innerHeight * 1.5 && r.bottom > -window.innerHeight * 0.5;
    };
    const onScroll = () => near() && trigger();
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && trigger(),
      { rootMargin: "400px" },
    );
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (near()) trigger();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // 2) Сцена создаётся только когда секция в зоне видимости (после постера)
  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    let scene: CitySceneT | null = null;
    let raf = 0;
    let measure: (() => void) | null = null;

    (async () => {
      const [{ CityScene }, res] = await Promise.all([
        import("./CityScene"),
        fetch("/data/moscow-city.json"),
      ]);
      if (cancelled || !canvasRef.current) return;
      const data = await res.json();
      scene = new CityScene(
        canvasRef.current,
        data.buildings,
        handlePick,
        colors,
        view,
        (tid) => setHovered(tid),
      );
      sceneRef.current = scene;
      // приглушаем башни без свободных лотов
      const empty = [...towerById.keys()].filter((id) => (towerStats[id]?.count ?? 0) === 0);
      scene.setEmptyTowers(empty);
      setReady(true);

      measure = () => {
        const el = stickyRef.current;
        if (el && scene) scene.resize(el.clientWidth, el.clientHeight);
      };
      measure();
      window.addEventListener("resize", measure);

      const loop = () => {
        raf = requestAnimationFrame(loop);
        const el = stickyRef.current;
        if (!el || !scene) return;

        for (const a of scene.anchors) {
          const btn = labelRefs.current.get(a.id);
          if (!btn) continue;
          const pos = scene.anchorScreen(a, el.clientWidth, el.clientHeight);
          btn.style.display = pos.visible ? "" : "none";
          btn.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px) translate(-50%, -100%)`;
        }
      };
      loop();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (measure) window.removeEventListener("resize", measure);
      scene?.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  useEffect(() => {
    sceneRef.current?.setSelected(selected);
  }, [selected]);

  // 3) Двусторонняя связка: результаты поиска/фильтров подсвечивают башни
  useEffect(() => {
    const onResult = (e: Event) => {
      const detail = (e as CustomEvent).detail as { towers?: number[] } | undefined;
      const ids = new Set(detail?.towers ?? []);
      setHighlighted(ids);
      sceneRef.current?.setHighlighted(ids);
    };
    window.addEventListener("portal:resultTowers", onResult);
    return () => window.removeEventListener("portal:resultTowers", onResult);
  }, []);

  // если сцена пересоздалась — донесём текущую подсветку
  useEffect(() => {
    sceneRef.current?.setHighlighted(highlighted);
  }, [highlighted, ready]);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = stickyRef.current;
    if (!el || !sceneRef.current) return;
    const r = el.getBoundingClientRect();
    sceneRef.current.setPointer(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -(((e.clientY - r.top) / r.height) * 2 - 1),
    );

    // drag-вращение
    if (dragRef.current && dragRef.current.pointerId === e.pointerId) {
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
      sceneRef.current.rotate(dx * 0.005, -dy * 0.003);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      const dx = Math.abs(e.clientX - dragRef.current.x);
      const dy = Math.abs(e.clientY - dragRef.current.y);
      dragRef.current = null;
      // если движения почти не было — это клик
      if (dx < 4 && dy < 4) sceneRef.current?.click();
    }
  };

  const showLots = (towerId: number) => {
    track("cta_click", { cta: "map3d_show_lots", towerId });
    window.dispatchEvent(
      new CustomEvent("portal:applyFilters", { detail: { towers: [towerId] } }),
    );
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const sel = selected ? towerById.get(selected) : null;
  const selCx = selected ? cxById.get(selected) : null;
  const selStat = selected ? towerStats[selected] : undefined;
  // какую башню показываем расширенным тултипом (наведение мышью/на лейбл)
  const tipId = labelHover ?? hovered;

  return (
    <section aria-label="3D-карта Москва-Сити">
      <div ref={stickyRef} className="relative h-svh overflow-hidden">
        {/* Постер-фолбэк под канвасом: виден до готовности 3D (бережёт LCP) */}
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

        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={() => sceneRef.current?.clearHover()}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
            <p className="animate-pulse text-sm tracking-[0.3em] text-paper/80">
              ЗАГРУЖАЕМ КАРТУ СИТИ…
            </p>
          </div>
        )}

        {/* заголовок поверх карты */}
        <div className="pointer-events-none absolute inset-x-0 top-0 pt-24 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Интерактивная карта</p>
          <h2 className="mt-2 font-display text-3xl text-paper md:text-5xl">
            {title ?? "Семь башен. Выберите свою"}
          </h2>
          <p className="mt-3 text-sm text-paper/60">
            Потяните — вращайте район · наведите и кликните по башне
          </p>
        </div>

        {/* лейблы башен (позиции ставит rAF-цикл) */}
        {ready &&
          [...towerById.values()].map((t) => {
            const stat = towerStats[t.id];
            const count = stat?.count ?? 0;
            const empty = count === 0;
            const expanded = tipId === t.id || selected === t.id;
            const isHot = highlighted.has(t.id);
            return (
              <button
                key={t.id}
                ref={(el) => {
                  if (el) labelRefs.current.set(t.id, el);
                  else labelRefs.current.delete(t.id);
                }}
                onClick={() => handlePick(t.id)}
                onMouseEnter={() => setLabelHover(t.id)}
                onMouseLeave={() => setLabelHover((h) => (h === t.id ? null : h))}
                style={{ display: "none" }}
                className={`absolute left-0 top-0 z-10 whitespace-nowrap rounded-[var(--portal-radius)] border px-3 py-1.5 text-left text-xs backdrop-blur transition-all duration-300 ${
                  selected === t.id
                    ? "border-gold bg-gold text-ink shadow-lg shadow-gold/30"
                    : isHot
                      ? "border-gold bg-ink/85 text-paper ring-1 ring-gold/70"
                      : empty
                        ? "border-ink-line/50 bg-ink/55 text-paper/45"
                        : "border-gold/40 bg-ink/70 text-paper/90 hover:border-gold hover:text-gold"
                } ${expanded ? "scale-105" : ""}`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {t.name}
                  <span
                    className={`rounded-[var(--portal-radius)] px-1.5 py-0.5 text-[10px] font-semibold ${
                      selected === t.id
                        ? "bg-ink/15 text-ink"
                        : empty
                          ? "bg-ink-line/30 text-paper/40"
                          : "bg-gold/20 text-gold"
                    }`}
                  >
                    {empty ? "нет лотов" : `${count} ${plural(count)}`}
                  </span>
                </span>
                {expanded && !empty && stat?.priceLabel && (
                  <span
                    className={`mt-0.5 block text-[11px] ${
                      selected === t.id ? "text-ink/80" : "text-paper/65"
                    }`}
                  >
                    {stat.priceLabel}
                  </span>
                )}
              </button>
            );
          })}

        {/* боковая панель выбранной башни с реальными лотами */}
        {sel && (
          <aside className="absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[440px] border border-ink-line/60 bg-ink/90 p-5 backdrop-blur-md md:inset-y-0 md:bottom-auto md:left-auto md:right-0 md:my-auto md:h-fit md:max-h-[88svh] md:overflow-y-auto md:rounded-l-[var(--portal-radius)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl text-paper">{sel.name}</h3>
                <p className="mt-1 text-sm text-paper/65">{sel.tagline}</p>
              </div>
              <button
                onClick={() => handlePick(null)}
                aria-label="Закрыть"
                className="font-display text-xl text-muted transition-colors hover:text-paper"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="font-semibold text-gold">
                {selStat?.count ?? 0} {plural(selStat?.count ?? 0)}
              </span>
              {selStat?.priceLabel && (
                <>
                  <span className="text-muted">·</span>
                  <span className="text-paper/75">{selStat.priceLabel}</span>
                </>
              )}
            </div>

            {/* реальные лоты этой башни */}
            {selStat?.lots?.length ? (
              <ul className="mt-4 space-y-2">
                {selStat.lots.slice(0, 4).map((lot) => {
                  const price = lotPrice(lot, "RUB");
                  return (
                    <li key={lot.id}>
                      <Link
                        href={lotHref(lot.id)}
                        className="group flex items-center gap-3 border border-ink-line/40 p-2 transition-colors hover:border-gold/60 rounded-[var(--portal-radius)]"
                      >
                        {lot.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl(lot.images[0], 160)}
                            alt=""
                            className="h-14 w-20 shrink-0 object-cover rounded-[var(--portal-radius)]"
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-xs text-paper/85 group-hover:text-paper">
                            {lot.title}
                          </span>
                          {price?.priceFormatted && (
                            <span className="mt-0.5 block text-sm font-semibold text-gold">
                              {price.priceFormatted}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              selCx?.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl(selCx.images[0], 727)}
                  alt={sel.name}
                  className="mt-4 h-36 w-full object-cover rounded-[var(--portal-radius)]"
                />
              )
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => showLots(sel.id)}
                className="flex-1 bg-btn-primary py-2.5 text-sm font-semibold text-btn-primary-ink transition-transform duration-300 hover:-translate-y-0.5 rounded-[var(--portal-radius)]"
              >
                Смотреть лоты
              </button>
              <Link
                href={portalSlug ? `/p/${portalSlug}/towers/${sel.slug}` : `/towers/${sel.slug}`}
                className="flex-1 border border-gold/60 py-2.5 text-center text-sm text-gold transition-colors hover:bg-gold hover:text-ink rounded-[var(--portal-radius)]"
              >
                О башне
              </Link>
            </div>
          </aside>
        )}

        {/* виньетка сверху и снизу для глубины */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink to-transparent" />
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
