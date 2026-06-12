import { portal } from "@/portal.config";

export function Hero() {
  return (
    <section className="relative flex min-h-[92svh] items-end overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portal.hero.image}
          alt="Небоскрёбы Москва-Сити ночью"
          className="kenburns h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-40 md:px-8 md:pb-28">
        <p className="mb-5 text-xs uppercase tracking-[0.35em] text-gold">
          {portal.hero.kicker}
        </p>
        <h1 className="max-w-3xl font-display text-4xl leading-[1.12] text-paper md:text-6xl lg:text-7xl">
          {portal.hero.title.split("\n").map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/75 md:text-lg">
          {portal.hero.subtitle}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#catalog"
            className="rounded-full bg-gold px-8 py-3.5 text-sm font-semibold tracking-wide text-ink transition-colors hover:bg-gold-deep"
          >
            Смотреть лоты
          </a>
          <a
            href="/towers"
            className="rounded-full border border-paper/30 px-8 py-3.5 text-sm tracking-wide text-paper transition-colors hover:border-gold hover:text-gold"
          >
            Башни Сити
          </a>
        </div>
      </div>

      {/* индикатор скролла */}
      <div className="absolute bottom-8 right-8 hidden flex-col items-center gap-2 md:flex" aria-hidden>
        <span className="text-[10px] uppercase tracking-[0.3em] text-paper/50">скролл</span>
        <span className="h-12 w-px bg-gradient-to-b from-gold to-transparent" />
      </div>
    </section>
  );
}
