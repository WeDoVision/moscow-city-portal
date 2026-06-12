import { portal } from "@/portal.config";
import { Reveal } from "./Reveal";

export function AboutSection() {
  return (
    <section id="about" className="bg-paper py-20 text-ink md:py-28" aria-labelledby="about-title">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-gold-deep">О портале</p>
            <h2 id="about-title" className="mt-3 font-display text-3xl leading-snug md:text-4xl">
              {portal.about.title}
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="space-y-4 text-base leading-relaxed text-muted-paper">
              {portal.about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 border-t border-ink/10 pt-12 md:grid-cols-4">
          {portal.about.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <p className="font-display text-4xl text-ink md:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm text-muted-paper">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
