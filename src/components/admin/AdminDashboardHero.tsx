'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  ExternalLink,
  ShoppingBag,
  Package,
  Boxes,
  Truck,
} from 'lucide-react';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

export function AdminDashboardHero() {
  const { t, locale } = useAdminLanguage();

  return (
    <div className="space-y-6">
      {/* ── TOP HERO BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Glow ambient background effect */}
        <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3.5 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>
              {locale === 'ar'
                ? 'لوحة التحكم المتقدمة — التجارة الإلكترونية بالجزائر'
                : locale === 'fr'
                ? 'Dashboard Pro — E-commerce & COD Algérie'
                : 'Advanced Dashboard — E-commerce & COD Algeria'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            {locale === 'ar'
              ? 'مرحباً بك في إدارة متجر ShopDZ'
              : locale === 'fr'
              ? 'Bienvenue sur la gestion ShopDZ'
              : 'Welcome to ShopDZ Management'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {locale === 'ar'
              ? 'متابعة فورية ومباشرة للطلبيات، تأكيد اتصالات الزبائن (COD)، تحليل الأرباح ومراقبة المخزون عبر 58 ولاية جزائرية.'
              : locale === 'fr'
              ? 'Suivi en direct des commandes, confirmations téléphoniques COD, analyse des bénéfices et contrôle du stock sur 58 wilayas.'
              : 'Real-time order monitoring, COD customer confirmation calls, profit analytics, and stock management across 58 Algerian wilayas.'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            href="/admin/produits"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:-translate-y-0.5 min-h-[42px]"
          >
            <Plus className="h-4 w-4" />
            <span>{t.quick_add_product}</span>
          </Link>

          <Link
            href={`/${locale}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 backdrop-blur-xs px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors min-h-[42px]"
          >
            <span>{t.visit_store}</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardQuickCards() {
  const { t } = useAdminLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{t.quick_actions_title}</h3>
          <p className="text-xs text-slate-500">{t.quick_actions_sub}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/commandes"
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {t.quick_view_orders}
            </div>
            <div className="text-xs text-slate-500">
              {t.quick_view_orders_desc}
            </div>
          </div>
        </Link>

        <Link
          href="/admin/produits"
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {t.quick_add_product}
            </div>
            <div className="text-xs text-slate-500">
              {t.quick_add_product_desc}
            </div>
          </div>
        </Link>

        <Link
          href="/admin/stock"
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              {t.quick_check_stock}
            </div>
            <div className="text-xs text-slate-500">
              {t.quick_check_stock_desc}
            </div>
          </div>
        </Link>

        <Link
          href="/admin/parametres"
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              {t.quick_settings}
            </div>
            <div className="text-xs text-slate-500">
              {t.quick_settings_desc}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
