import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-white px-4 py-3 text-sm font-semibold text-stone-900 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:outline-2 focus:outline-offset-4 focus:outline-rose-800"
      >
        Skip to content
      </a>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl px-6 py-5 sm:px-8">
          <Link
            href="/"
            className="rounded-sm text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-800"
          >
            Make My Marriage
          </Link>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-16 sm:px-8 sm:py-24"
      >
        {children}
      </main>
      <footer className="border-t border-stone-200">
        <div className="mx-auto w-full max-w-5xl px-6 py-5 text-sm text-stone-600 sm:px-8">
          One wedding. Many moments. Together.
        </div>
      </footer>
    </div>
  );
}
