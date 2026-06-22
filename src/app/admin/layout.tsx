import type { CSSProperties, ReactNode } from "react";

/**
 * Тема админки — монохромная (чёрно-белая) и прямоугольная.
 *
 * Переопределяем токены движка (ink/paper/gold/…) на B/W прямо на обёртке —
 * так все утилиты `bg-ink`/`text-paper`/`bg-gold`/`border-ink-line` в дочерних
 * компонентах перекрашиваются разом, без правки каждого класса. Прямоугольность
 * даёт CSS-правило `.admin-scope … border-radius:0` в globals.css (инлайновые
 * превью радиуса в редакторе темы не имеют класса rounded и не затрагиваются).
 */
const ADMIN_THEME = {
  "--ink": "#ffffff", // фон страницы — белый
  "--ink-soft": "#f4f4f5", // карточки/панели
  "--ink-line": "#d4d4d8", // границы
  "--paper": "#0a0a0a", // основной текст — чёрный
  "--paper-soft": "#27272a",
  "--gold": "#0a0a0a", // акцент = чёрный (кнопки)
  "--gold-deep": "#3f3f46", // ховер акцента
  "--muted": "#71717a", // приглушённый текст
  "--portal-radius": "0px",
} as CSSProperties;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-scope min-h-screen bg-ink text-paper" style={ADMIN_THEME}>
      {children}
    </div>
  );
}
