/**
 * Admin Layout — Server Component
 *
 * القرار الأمني: requireAdmin() من DAL يُستدعى هنا كطبقة حماية ثانية (بعد الـ Middleware).
 * حتى لو تجاوز المهاجم الـ Middleware، سيُعاد توجيهه هنا.
 * الحماية الحقيقية تبقى في DAL + RLS لكل Route Handler وServer Action.
 */
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/dal/auth';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Admin Dashboard | ShopDZ',
  description: 'Admin Management Panel',
  // القرار الأمني: noindex يمنع محركات البحث من فهرسة لوحة الأدمن
  robots: { index: false, follow: false },
};

const navItems = [
  { label: 'لوحة التحكم', href: '/admin', icon: '📊' },
  { label: 'الطلبات', href: '/admin/commandes', icon: '🛍️' },
  { label: 'المنتجات', href: '/admin/produits', icon: '📦' },
  { label: 'التصنيفات', href: '/admin/categories', icon: '🗂️' },
  { label: 'المخزون', href: '/admin/stock', icon: '📋' },
  { label: 'الخصائص والخيارات', href: '/admin/attributs', icon: '🏷️' },
  { label: 'الزبائن', href: '/admin/clients', icon: '👥' },
  { label: 'الإعدادات والأسعار', href: '/admin/parametres', icon: '⚙️' },
];

async function handleLogout() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/admin/login');
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';
  const isLoginHeader = headerList.get('x-is-admin-login') === '1';
  const isLoginPage = isLoginHeader || pathname.includes('/admin/login');

  if (isLoginPage) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-900 font-sans antialiased text-white">
        {children}
      </div>
    );
  }

  await requireAdmin();

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50/70 flex flex-col font-sans antialiased text-slate-900">
      {/* Top Header */}
      <header className="bg-slate-950 text-white sticky top-0 z-40 border-b border-slate-800 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Badge */}
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2 group">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 font-black text-white shadow-md shadow-indigo-500/20 text-lg">
                  ⚡
                </span>
                <span className="text-lg font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  ShopDZ
                </span>
              </Link>
              <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                لوحة الإدارة
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/ar"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <span>معاينة المتجر</span>
                <span className="text-slate-400">↗</span>
              </Link>

              <form action={handleLogout}>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
                >
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-xs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
