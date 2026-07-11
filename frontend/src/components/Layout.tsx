import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden>🏠</span>
            <span>
              Guia Hóspede{' '}
              <span className="font-normal text-slate-400">| Painel</span>
            </span>
          </Link>
          <Link to="/properties/new" className="btn-primary">
            + Novo imóvel
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
