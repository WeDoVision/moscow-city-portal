import type { Metadata } from "next";
import { Manrope, Prata } from "next/font/google";
import Script from "next/script";
import { portal } from "@/portal.config";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageViewTracker } from "@/components/PageViewTracker";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const prata = Prata({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-prata",
});

export const metadata: Metadata = {
  metadataBase: new URL(portal.siteUrl),
  title: {
    default: portal.seo.title,
    template: `%s — ${portal.brand.name}`,
  },
  description: portal.seo.description,
  keywords: portal.seo.keywords,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: portal.seo.locale,
    siteName: portal.brand.name,
    title: portal.seo.title,
    description: portal.seo.description,
    images: [{ url: portal.hero.image }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${manrope.variable} ${prata.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
        <PageViewTracker />
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
