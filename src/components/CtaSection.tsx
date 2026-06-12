import { portal } from "@/portal.config";
import { LeadForm } from "./LeadForm";
import { Reveal } from "./Reveal";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28" aria-labelledby="cta-title">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gold)" }}
        aria-hidden
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Личный эксперт</p>
          <h2 id="cta-title" className="mt-3 font-display text-3xl leading-snug text-paper md:text-5xl">
            Подберём лот под вашу задачу
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-paper/70">
            Жильё, инвестиции или офис — эксперт по Москва-Сити подберёт варианты под бюджет,
            организует показы и сопроводит сделку. Бесплатно для покупателя.
          </p>
          <p className="mt-8">
            <a href={portal.brand.phoneHref} className="font-display text-2xl text-gold hover:underline">
              {portal.brand.phone}
            </a>
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="rounded-sm border border-ink-line/40 bg-ink-soft/80 p-6 md:p-8">
            <LeadForm source="home_cta" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
