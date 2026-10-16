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
  { label: 'Tableau de bord', href: '/admin', icon: '📊' },
  { label: 'Catégories (الفئات)', href: '/admin/categories', icon: '🗂️' },
  { label: 'Produits (المنتجات)', href: '/admin/produits', icon: '📦' },
  { label: 'Attributs', href: '/admin/attributs', icon: '🏷️' },
  { label: 'Stock', href: '/admin/stock', icon: '📋' },
  { label: 'Commandes', href: '/admin/commandes', icon: '🛍️' },
  { label: 'Clients', href: '/admin/clients', icon: '👥' },
  { label: 'Paramètres', href: '/admin/parametres', icon: '⚙️' },
];

async function handleLogout() {
  'use server';
  // القرار الأمني: حذف الـ cookie من السيرفر يضمن إلغاء الجلسة حتى لو لم يعمل الـ JS على العميل
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
      <div className="min-h-screen bg-slate-900 font-sans antialiased text-white">
        {children}
      </div>
    );
  }

  // القرار الأمني: requireAdmin() يتحقق من الجلسة والدور على السيرفر.
  // لا يُتخطى حتى لو تجاوز شيء ما الـ Middleware.
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
        <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl font-black tracking-tight text-white">
                  🇩🇿 ShopDZ Admin
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Admin Panel
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/* لا رابط مباشر للمتجر هنا — الأدمن يعرف الرابط */}
                <form action={handleLogout}>
                  <button
                    type="submit"
                    className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    Déconnexion
                  </button>
                </form>
              </div>
            </div>
          </div>
          {/* Sub Navigation Bar */}
          <div className="bg-slate-800 border-t border-slate-700/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-1 overflow-x-auto py-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    );
  }
