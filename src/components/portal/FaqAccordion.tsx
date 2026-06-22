"use client";

import { useState } from "react";

/**
 * Аккордеон FAQ для блока `faq`: иконка-шеврон (поворачивается при раскрытии) и
 * плавное раскрытие ответа. Анимация — в рукописных классах `.faq-*`
 * (globals.css), переключается атрибутом data-open; контент (вопросы/ответы)
 * приходит из схемы и редактируется ИИ/админом.
 */
export function FaqAccordion({ items }: { items: { q?: string; a?: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-8 divide-y divide-ink-line/40">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="faq-item" data-open={isOpen}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left font-medium text-paper transition-colors hover:text-gold"
            >
              <span>{it.q}</span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="faq-chevron h-5 w-5 shrink-0 text-gold"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="faq-answer">
              <p className="pb-5 text-muted">{it.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
