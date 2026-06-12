"use client";

import { useState } from "react";
import { portal } from "@/portal.config";
import { Reveal } from "./Reveal";

/**
 * FAQ — ключевой AEO-блок: прямые ответы на вопросы, которые люди задают
 * поисковикам и LLM. Дублируется в JSON-LD FAQPage (см. page.tsx).
 */
export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28" aria-labelledby="faq-title">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <Reveal>
          <p className="text-center text-xs uppercase tracking-[0.35em] text-gold">Вопросы и ответы</p>
          <h2 id="faq-title" className="mt-3 text-center font-display text-3xl text-paper md:text-4xl">
            Что спрашивают о недвижимости в Сити
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-ink-line/40 border-y border-ink-line/40">
          {portal.faq.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="text-base text-paper/90 md:text-lg">{item.q}</span>
                <span
                  className={`shrink-0 font-display text-2xl text-gold transition-transform duration-300 ${
                    open === i ? "rotate-45" : ""
                  }`}
                  aria-hidden
                >
                  +
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ${
                  open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pb-6 pr-10 text-sm leading-relaxed text-muted md:text-base">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
