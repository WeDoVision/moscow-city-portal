import type { CSSProperties, ReactNode } from "react";
import type { PortalSchema } from "@/lib/portal/schema";
import { themeToCssVars } from "@/lib/portal/schema";

/**
 * Оболочка портала: тема (CSS-переменные) + шапка + футер. Используется и на
 * главной портала (PortalRenderer), и на вложенных страницах (лот/башня под
 * /p/[slug]/...), поэтому весь портал — единый по теме и chrome.
 */
export function PortalChrome({ schema, children }: { schema: PortalSchema; children: ReactNode }) {
  const style = themeToCssVars(schema.theme) as CSSProperties;
  // свой шрифт по ссылке (Google Fonts и т.п.) — только https
  const fontUrl = /^https:\/\//i.test(schema.theme.fontUrl ?? "") ? schema.theme.fontUrl : null;
  return (
    <div style={style} className="min-h-screen bg-ink text-paper">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}
      <header className="sticky top-0 z-40 border-b border-ink-line/40 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href={`/p/${schema.slug}`} className="font-display text-lg tracking-wide text-paper">
            <span className="text-gold">{schema.brand.logo[0]}</span> {schema.brand.logo[1]}
          </a>
          <a href={schema.brand.phoneHref} className="text-sm text-muted hover:text-paper">
            {schema.brand.phone}
          </a>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-ink-line/40 py-10">
        <div className="mx-auto max-w-6xl px-6 text-sm text-muted">
          © {new Date().getFullYear()} {schema.brand.name} · Whitewill
        </div>
      </footer>
    </div>
  );
}
