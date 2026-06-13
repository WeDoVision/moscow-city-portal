"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { towerById } from "@/portal.config";
import type { ComplexCard } from "@/lib/whitewill/types";
import { imageUrl } from "@/lib/whitewill/client";
import { track } from "@/lib/analytics";
import type { CityScene as CitySceneT } from "./CityScene";

/**
 * Интерактивная 3D-карта Сити: реальная геометрия района (OSM),
 * скролл-пролёт камеры, клик по башне — карточка с инфо и лотами.
 * Позиции лейблов обновляются императивно (без re-render на каждый кадр).
 */
export function CityMap3D({ complexes }: { complexes: ComplexCard[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CitySceneT | null>(null);
  const labelRefs = useRef(new Map<number, HTMLButtonElement>());
  const [selected, setSelected] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const cxById = new Map(complexes.map((c) => [c.id, c]));

  const handlePick = useCallback((tid: number | null) => {
    setSelected(tid);
    if (tid) track("tower_view", { towerId: tid, source: "map3d" });
  }, []);

  useEffect(() => {
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
      scene = new CityScene(canvasRef.current, data.buildings, handlePick);
      sceneRef.current = scene;
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
        const wrap = wrapRef.current;
        if (!el || !wrap || !scene) return;
        // прогресс пролёта из позиции скролла секции
        const r = wrap.getBoundingClientRect();
        const total = r.height - el.clientHeight;
        const passed = Math.min(Math.max(-r.top, 0), total);
        scene.progress += ((total ? passed / total : 0) - scene.progress) * 0.08;

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
  }, []);

  useEffect(() => {
    sceneRef.current?.setSelected(selected);
  }, [selected]);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = stickyRef.current;
    if (!el || !sceneRef.current) return;
    const r = el.getBoundingClientRect();
    sceneRef.current.setPointer(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -(((e.clientY - r.top) / r.height) * 2 - 1),
    );
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

  return (
    <section aria-label="3D-карта Москва-Сити">
      {/* длинная зона скролла; внутри — прилипший экран с картой */}
      <div ref={wrapRef} className="relative h-[280svh]">
        <div ref={stickyRef} className="sticky top-0 h-svh overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            onPointerMove={onPointerMove}
            onClick={() => sceneRef.current?.click()}
          />

          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="animate-pulse text-sm tracking-[0.3em] text-muted">
                ЗАГРУЖАЕМ КАРТУ СИТИ…
              </p>
            </div>
          )}

          {/* заголовок поверх карты */}
          <div className="pointer-events-none absolute inset-x-0 top-0 pt-24 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-gold">Интерактивная карта</p>
            <h2 className="mt-2 font-display text-3xl text-paper md:text-5xl">
              Семь башен. Выберите свою
            </h2>
            <p className="mt-3 text-sm text-paper/60">
              Скролл — пролёт над районом · клик по башне — детали
            </p>
          </div>

          {/* лейблы башен (позиции ставит rAF-цикл) */}
          {ready &&
            [...towerById.values()].map((t) => (
              <button
                key={t.id}
                ref={(el) => {
                  if (el) labelRefs.current.set(t.id, el);
                  else labelRefs.current.delete(t.id);
                }}
                onClick={() => handlePick(t.id)}
                className={`absolute left-0 top-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs backdrop-blur transition-colors ${
                  selected === t.id
                    ? "border-gold bg-gold text-ink"
                    : "border-gold/40 bg-ink/60 text-paper/85 hover:border-gold hover:text-gold"
                }`}
                style={{ display: "none" }}
              >
                {t.name}
              </button>
            ))}

          {/* панель выбранной башни */}
          {sel && (
            <aside className="absolute bottom-6 left-1/2 w-[min(92vw,420px)] -translate-x-1/2 rounded-sm border border-ink-line/60 bg-ink/85 p-5 backdrop-blur-md md:left-auto md:right-8 md:translate-x-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl text-paper">{sel.name}</h3>
                  <p className="mt-1 text-sm text-paper/65">{sel.tagline}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Закрыть"
                  className="font-display text-xl text-muted hover:text-paper"
                >
                  ✕
                </button>
              </div>
              {selCx?.images?.[0] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl(selCx.images[0], 727)}
                  alt={sel.name}
                  className="mt-4 h-36 w-full rounded-sm object-cover"
                />
              )}
              {selCx?.complexCardPriceDTO?.priceFormatted && (
                <p className="mt-3 font-display text-xl text-gold">
                  {selCx.complexCardPriceDTO.priceFormatted}
                </p>
              )}
              {selCx?.description && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-paper/70">
                  {selCx.description}
                </p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => showLots(sel.id)}
                  className="flex-1 rounded-full bg-gold py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-deep"
                >
                  Лоты башни
                </button>
                <Link
                  href={`/towers/${sel.slug}`}
                  className="flex-1 rounded-full border border-gold/60 py-2.5 text-center text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
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
      </div>
    </section>
  );
}

export default CityMap3D;
