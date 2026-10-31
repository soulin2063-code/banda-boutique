/**
 * Admin Layout — Server Component
 *
 * القرار الأمني: requireAdmin() من DAL يُستدعى هنا كطبقة حماية ثانية (بعد الـ Middleware).
 * حتى لو تجاوز المهاجم الـ Middleware، سيُعاد توجيهه هنا.
 * الحماية الحقيقية تبقى في DAL + RLS لكل Route Handler وServer Action.
 */
import React from 'react';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/dal/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import '../globals.css';

export const metadata: Metadata = {
  title: 'لوحة التحكم وإدارة المتجر | ShopDZ Pro',
  description: 'لوحة التحكم الفائقة لإدارة الطلبات والمنتجات والمخزون والشحن عبر 58 ولاية',
  robots: { index: false, follow: false },
};

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
      <div dir="rtl" className="min-h-screen bg-slate-950 font-sans antialiased text-white">
        {children}
      </div>
    );
  }

  // Enforce server-side admin check
  const auth = await requireAdmin();

  // Fetch live counts for sidebar badges
  let pendingOrdersCount = 0;
  let lowStockCount = 0;

  try {
    const [{ count: pendingCount }, { data: variants }] = await Promise.all([
      supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabaseAdmin
        .from('product_variants')
        .select('stock_qty, min_stock_threshold'),
    ]);

    pendingOrdersCount = pendingCount || 0;
    lowStockCount = (variants || []).filter(
      (v) => (v.stock_qty ?? 0) <= (v.min_stock_threshold ?? 5)
    ).length;
  } catch (err) {
    console.error('Failed to fetch admin badge counts:', err);
  }

  return (
    <AdminLayoutClient
      userEmail={auth.user?.email || 'admin@shopdz.com'}
      userRole={auth.role === 'admin' ? 'مدير النظام الرئيسي' : 'موظف مبيعات'}
      pendingOrdersCount={pendingOrdersCount}
      lowStockCount={lowStockCount}
      logoutAction={handleLogout}
    >
      {children}
    </AdminLayoutClient>
  );
}
