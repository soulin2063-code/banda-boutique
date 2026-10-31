'use client';

import React from 'react';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Receipt,
  Percent,
  ArrowUpRight,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

export interface SummaryCardsProps {
  totalRevenue: number;
  netProfit: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  cancellationRate: number;
  lowStockCount: number;
  revenueGrowthPercent?: number;
  ordersGrowthPercent?: number;
}

export function SummaryCards({
  totalRevenue,
  netProfit,
  totalOrders,
  pendingOrders,
  averageOrderValue,
  cancellationRate,
  lowStockCount,
  revenueGrowthPercent = 14.5,
  ordersGrowthPercent = 8.2,
}: SummaryCardsProps) {
  const { t, locale } = useAdminLanguage();

  const cards = [
    {
      title: t.total_revenue,
      value: `${totalRevenue.toLocaleString()} ${t.currency}`,
      subtitle: t.total_revenue_sub,
      icon: DollarSign,
      trend: {
        value: `${revenueGrowthPercent >= 0 ? '+' : ''}${revenueGrowthPercent}%`,
        isPositive: revenueGrowthPercent >= 0,
        label: t.compare_last_week,
      },
      gradient: 'from-indigo-500/10 to-indigo-500/5',
      iconBg: 'bg-indigo-600 text-white shadow-indigo-600/30',
      borderHover: 'hover:border-indigo-400',
      href: '/admin/commandes',
    },
    {
      title: t.net_profit,
      value: `${netProfit.toLocaleString()} ${t.currency}`,
      subtitle: t.net_profit_sub,
      icon: Sparkles,
      trend: {
        value: '+12.4%',
        isPositive: true,
        label: t.excellent_perf,
      },
      gradient: 'from-emerald-500/10 to-emerald-500/5',
      iconBg: 'bg-emerald-600 text-white shadow-emerald-600/30',
      borderHover: 'hover:border-emerald-400',
      href: '/admin/commandes',
    },
    {
      title: t.total_orders,
      value: totalOrders.toLocaleString(),
      subtitle: t.total_orders_sub,
      icon: ShoppingBag,
      trend: {
        value: `${ordersGrowthPercent >= 0 ? '+' : ''}${ordersGrowthPercent}%`,
        isPositive: ordersGrowthPercent >= 0,
        label: t.compare_last_week,
      },
      gradient: 'from-blue-500/10 to-blue-500/5',
      iconBg: 'bg-blue-600 text-white shadow-blue-600/30',
      borderHover: 'hover:border-blue-400',
      href: '/admin/commandes',
    },
    {
      title: t.avg_order_value,
      value: `${Math.round(averageOrderValue).toLocaleString()} ${t.currency}`,
      subtitle: t.avg_order_value_sub,
      icon: Receipt,
      trend: {
        value: '+5.3%',
        isPositive: true,
        label: t.compare_last_week,
      },
      gradient: 'from-purple-500/10 to-purple-500/5',
      iconBg: 'bg-purple-600 text-white shadow-purple-600/30',
      borderHover: 'hover:border-purple-400',
      href: '/admin/commandes',
    },
    {
      title: t.pending_orders,
      value: pendingOrders.toString(),
      subtitle: t.pending_orders_sub,
      icon: Clock,
      badge:
        pendingOrders > 0
          ? `${pendingOrders} ${locale === 'ar' ? 'مستعجل' : locale === 'fr' ? 'urgent' : 'urgent'}`
          : locale === 'ar'
          ? 'لا توجد طلبات'
          : locale === 'fr'
          ? 'Aucune commande'
          : 'No orders',
      badgeColor:
        pendingOrders > 0
          ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
          : 'bg-slate-100 text-slate-600',
      gradient: 'from-amber-500/10 to-amber-500/5',
      iconBg: 'bg-amber-500 text-white shadow-amber-500/30',
      borderHover: 'hover:border-amber-400',
      href: '/admin/commandes?status=pending',
    },
    {
      title: t.cancellation_rate,
      value: `${cancellationRate.toFixed(1)}%`,
      subtitle: t.cancellation_rate_sub,
      icon: Percent,
      trend: {
        value:
          cancellationRate < 10
            ? locale === 'ar'
              ? 'ممتاز'
              : locale === 'fr'
              ? 'Excellent'
              : 'Good'
            : locale === 'ar'
            ? 'يحتاج متابعة'
            : locale === 'fr'
            ? 'À surveiller'
            : 'Attention',
        isPositive: cancellationRate < 10,
        label: t.normal_rate,
      },
      gradient:
        cancellationRate < 10
          ? 'from-teal-500/10 to-teal-500/5'
          : 'from-rose-500/10 to-rose-500/5',
      iconBg:
        cancellationRate < 10
          ? 'bg-teal-600 text-white shadow-teal-600/30'
          : 'bg-rose-500 text-white shadow-rose-500/30',
      borderHover: cancellationRate < 10 ? 'hover:border-teal-400' : 'hover:border-rose-400',
      href: '/admin/commandes?status=cancelled',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 6 High-Density KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.title}
              href={c.href}
              className={`relative overflow-hidden rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between ${c.borderHover}`}
            >
              {/* Subtle Ambient Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />

              <div className="relative z-10">
                {/* Header: Title & Icon */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-slate-500 line-clamp-1">
                    {c.title}
                  </span>
                  <div
                    className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${c.iconBg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Main Metric Value */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 font-mono">
                    {c.value}
                  </span>
                </div>

                {/* Trend indicator or badge */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  {c.badge ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badgeColor}`}
                    >
                      {c.badge}
                    </span>
                  ) : c.trend ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                        c.trend.isPositive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {c.trend.isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{c.trend.value}</span>
                    </span>
                  ) : null}
                  <span className="text-[10px] text-slate-400 truncate">
                    {c.trend?.label || c.subtitle}
                  </span>
                </div>
              </div>

              {/* Bottom Subtle Bar */}
              <div className="relative z-10 mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-indigo-600 transition-colors">
                <span className="truncate">{c.subtitle}</span>
                <ArrowUpRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Low Stock Urgent Banner if any */}
      {lowStockCount > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {locale === 'ar' ? (
                  <>
                    تنبيه نواقص المخزون: يوجد{' '}
                    <span className="text-rose-600 font-black font-mono">
                      {lowStockCount}
                    </span>{' '}
                    متغيرات منتجات وصلت إلى حد إعادة الطلب الأدنى أو نفدت!
                  </>
                ) : locale === 'fr' ? (
                  <>
                    Alerte stock faible :{' '}
                    <span className="text-rose-600 font-black font-mono">
                      {lowStockCount}
                    </span>{' '}
                    variantes ont atteint le seuil critique ou sont épuisées !
                  </>
                ) : (
                  <>
                    Low Stock Alert:{' '}
                    <span className="text-rose-600 font-black font-mono">
                      {lowStockCount}
                    </span>{' '}
                    variants reached minimum threshold or are out of stock!
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-500">
                {locale === 'ar'
                  ? 'يرجى تزويد المخزون لمنع توقف الطلبيات والبيع المباشر للزبائن.'
                  : locale === 'fr'
                  ? 'Veuillez réapprovisionner pour éviter les ruptures et blocages de vente.'
                  : 'Please restock inventory to prevent checkout blocking and missed sales.'}
              </p>
            </div>
          </div>
          <Link
            href="/admin/stock"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all shrink-0 min-h-[38px]"
          >
            <span>
              {locale === 'ar'
                ? 'فحص وتزويد المخزون'
                : locale === 'fr'
                ? 'Vérifier & Réapprovisionner'
                : 'Inspect & Restock'}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
