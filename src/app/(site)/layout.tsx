import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageViewTracker } from "@/components/PageViewTracker";
import { FloatingMessengers } from "@/components/MessengerButtons";

/**
 * Layout эталонного портала Москва-Сити (маршруты /, /lots, /towers).
 * Его собственный chrome — не протекает в мульти-тенант порталы и админку.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <FloatingMessengers />
      <PageViewTracker />
    </>
  );
}
