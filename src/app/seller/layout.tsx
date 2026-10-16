import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireSeller } from '@/lib/auth/requireAdmin';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Espace Vendeur | ShopDZ',
  description: 'Tableau de bord vendeur — gestion des commandes',
};

const sellerNavItems = [
  { label: 'Commandes', href: '/seller', icon: '📦' },
  { label: 'Mon compte', href: '/seller/compte', icon: '👤' },
];

async function handleLogout() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/seller/login');
}

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';
  const isLoginPage = pathname === '/seller/login';

  if (!isLoginPage) {
    const auth = await requireSeller();
    if (!auth.ok) {
      redirect('/seller/login');
    }
  }

  if (isLoginPage) {
    return (
      <div lang="fr" dir="ltr" className="min-h-screen bg-slate-900 font-sans antialiased text-white">
        {children}
      </div>
    );
  }

  return (
    <div lang="fr" dir="ltr" className="min-h-screen bg-stone-50 flex flex-col font-sans antialiased text-slate-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base font-black tracking-tight text-slate-900">
                ShopDZ
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                Vendeur
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/ar"
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
              >
                ↗ Voir la boutique
              </Link>
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* Sub Nav */}
        <div className="border-t border-stone-100 bg-stone-50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <nav className="flex gap-1 py-1.5 overflow-x-auto">
              {sellerNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-5xl w-full p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
