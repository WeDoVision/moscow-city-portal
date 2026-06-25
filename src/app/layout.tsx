import type { Metadata } from "next";
import {
  Manrope,
  Prata,
  Playfair_Display,
  Cormorant,
  Inter,
  Montserrat,
  Golos_Text,
  Lora,
  Jost,
} from "next/font/google";
import Script from "next/script";
import { portal } from "@/portal.config";
import "./globals.css";

/**
 * Корневой layout — тонкая оболочка (html/body/шрифты/аналитика).
 * Chrome конкретного портала (хедер/футер/кнопки) живёт в своих сегментах:
 *  - старый Москва-Сити: src/app/(site)/layout.tsx
 *  - мульти-тенант порталы: PortalRenderer (свой хедер/футер из схемы)
 *  - админка: src/app/admin
 * Так разные порталы не делят чужой обвес (KRE-121).
 */

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const prata = Prata({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-prata",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
});

const cormorant = Cormorant({
  subsets: ["latin", "cyrillic"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
});

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-golos",
});

const lora = Lora({
  subsets: ["latin", "cyrillic"],
  variable: "--font-lora",
});

// Jost — латиница (кириллицы у гарнитуры нет, для неё работает фолбэк).
const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
  metadataBase: new URL(portal.siteUrl),
  title: {
    default: portal.seo.title,
    template: `%s — ${portal.brand.name}`,
  },
  description: portal.seo.description,
  robots: { index: true, follow: true },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${prata.variable} ${playfair.variable} ${cormorant.variable} ${inter.variable} ${montserrat.variable} ${golos.variable} ${lora.variable} ${jost.variable}`}
    >
      <body>
        {children}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
