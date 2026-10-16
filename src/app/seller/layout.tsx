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
  { label: 'الطلبات والمبيعات', href: '/seller', icon: '📦' },
  { label: 'إضافة منتج جديد', href: '/seller/produits', icon: '➕' },
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
      <div dir="rtl" className="min-h-screen bg-slate-900 font-sans antialiased text-white">
        {children}
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50/70 flex flex-col font-sans antialiased text-slate-900">
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/seller" className="flex items-center gap-2 group">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 font-black text-white shadow-xs text-sm">
                  🛍️
                </span>
                <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  ShopDZ
                </span>
              </Link>
              <span className="rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                بوابة البائع
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/ar"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>معاينة المتجر</span>
                <span className="text-slate-400">↗</span>
              </Link>
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-50 border border-rose-200/60 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="border-t border-slate-100 bg-slate-50/80">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <nav className="flex gap-2 py-2 overflow-x-auto">
              {sellerNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-2xs transition-all"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-5xl w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
