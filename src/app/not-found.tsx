import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70svh] flex-col items-center justify-center px-5 pt-20 text-center">
      <p className="font-display text-7xl text-gold">404</p>
      <h1 className="mt-4 font-display text-2xl text-paper">Такой страницы нет</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        Возможно, лот уже продан и снят с публикации. Посмотрите актуальные предложения в каталоге.
      </p>
      <Link
        href="/#catalog"
        className="mt-8 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink hover:bg-gold-deep"
      >
        В каталог
      </Link>
    </main>
  );
}
