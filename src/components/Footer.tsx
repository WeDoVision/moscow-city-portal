import Link from "next/link";
import { portal } from "@/portal.config";

export function Footer() {
  return (
    <footer className="border-t border-ink-line/40 bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-lg tracking-[0.18em]">
              {portal.brand.logo[0]}{" "}
              <span className="text-sm tracking-[0.35em] text-gold">{portal.brand.logo[1]}</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              {portal.brand.legalName}
            </p>
          </div>
          <nav className="text-sm" aria-label="Карта сайта">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/80">Разделы</p>
            <ul className="space-y-2">
              <li><Link className="text-paper/80 hover:text-gold" href="/#catalog">Каталог лотов</Link></li>
              <li><Link className="text-paper/80 hover:text-gold" href="/towers">Башни Москва-Сити</Link></li>
              <li><Link className="text-paper/80 hover:text-gold" href="/#about">О портале</Link></li>
              <li><Link className="text-paper/80 hover:text-gold" href="/#faq">Частые вопросы</Link></li>
            </ul>
          </nav>
          <div className="text-sm">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/80">Контакты</p>
            <p>
              <a className="text-paper/90 hover:text-gold" href={portal.brand.phoneHref}>
                {portal.brand.phone}
              </a>
            </p>
            <p className="mt-2">
              <a className="text-paper/80 hover:text-gold" href={`mailto:${portal.brand.email}`}>
                {portal.brand.email}
              </a>
            </p>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Москва, Пресненская набережная, 8с1
              <br />
              Ежедневно 9:00–21:00
            </p>
          </div>
        </div>
        <div className="hairline my-8" />
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} {portal.brand.name}. Данные о лотах предоставляются по API
          Whitewill и обновляются ежедневно. Не является публичной офертой.
        </p>
      </div>
    </footer>
  );
}
