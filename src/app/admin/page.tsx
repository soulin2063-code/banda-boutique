import React from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SummaryCards } from '@/components/admin/SummaryCards';
import { SalesChart, DailySalesData } from '@/components/admin/SalesChart';
import { WilayaHeatmap, WilayaOrderStat } from '@/components/admin/WilayaHeatmap';
import { RecentOrdersTable, RecentOrderItem } from '@/components/admin/RecentOrdersTable';
import {
  Package,
  Plus,
  ShoppingBag,
  Truck,
  Tag,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Boxes,
  Users,
  Settings,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  // Fetch all dashboard data in parallel
  const [
    { data: orders },
    { count: customerCount },
    { data: lowStockVariants },
    { data: wilayas },
  ] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select(`
        id,
        status,
        subtotal,
        delivery_fee,
        total,
        created_at,
        customers (
          id,
          full_name,
          phone
        ),
        addresses (
          wilaya_id,
          commune_id,
          delivery_type
        )
      `)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('product_variants')
      .select('id, stock_qty, min_stock_threshold'),
    supabaseAdmin
      .from('wilayas')
      .select('id, name_fr, name_ar')
      .order('id', { ascending: true }),
  ]);

  const allOrders = orders || [];
  const lowStockCount = (lowStockVariants || []).filter(
    (v) => (v.stock_qty ?? 0) <= (v.min_stock_threshold ?? 5)
  ).length;

  const wilayaMap: Record<number, string> = {};
  (wilayas || []).forEach((w) => {
    wilayaMap[w.id] = `${w.id} - ${w.name_fr} (${w.name_ar})`;
  });

  // Aggregations
  const nonCancelledOrders = allOrders.filter((o) => o.status !== 'cancelled');
  const cancelledOrders = allOrders.filter((o) => o.status === 'cancelled');

  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter((o) => o.status === 'pending').length;
  const netProfit = Math.round(totalRevenue * 0.65); // Standard COD margin estimate
  const averageOrderValue =
    nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0;
  const cancellationRate =
    totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;

  // Build 7-day trend data for SalesChart
  const dateMap = new Map<string, { amount: number; orders: number }>();
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
    dateMap.set(key, { amount: 0, orders: 0 });
  }

  allOrders.forEach((o) => {
    const d = new Date(o.created_at);
    const key = d.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
    if (dateMap.has(key)) {
      const curr = dateMap.get(key)!;
      curr.orders += 1;
      if (o.status !== 'cancelled') {
        curr.amount += o.total || 0;
      }
    }
  });

  const salesChartData: DailySalesData[] = Array.from(dateMap.entries()).map(
    ([date, val]) => ({
      date,
      amount: val.amount,
      orders: val.orders,
    })
  );

  // Build Wilaya breakdown
  const wilayaCounts = new Map<number, { count: number; revenue: number }>();
  allOrders.forEach((o) => {
    const wId = (o.addresses as { wilaya_id?: number } | null)?.wilaya_id;
    if (wId) {
      const prev = wilayaCounts.get(wId) || { count: 0, revenue: 0 };
      prev.count += 1;
      if (o.status !== 'cancelled') prev.revenue += o.total || 0;
      wilayaCounts.set(wId, prev);
    }
  });

  const wilayaStats: WilayaOrderStat[] = Array.from(wilayaCounts.entries())
    .map(([wId, val]) => ({
      wilaya_id: wId,
      wilaya_name: wilayaMap[wId] || `ولاية ${wId}`,
      order_count: val.count,
      total_revenue: val.revenue,
    }))
    .sort((a, b) => b.order_count - a.order_count);

  // Recent Orders for quick actions widget (latest 6)
  const recentOrders: RecentOrderItem[] = allOrders.slice(0, 8).map((o) => ({
    id: o.id,
    status: o.status as any,
    total: o.total || 0,
    created_at: o.created_at,
    customers: (Array.isArray(o.customers) ? o.customers[0] : o.customers) || null,
    addresses: (Array.isArray(o.addresses) ? o.addresses[0] : o.addresses) || null,
  }));

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ── TOP HERO BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Glow ambient background effect */}
        <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3.5 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>لوحة التحكم المتقدمة — التجارة الإلكترونية بالجزائر</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            مرحباً بك في إدارة متجر ShopDZ
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            متابعة فورية ومباشرة للطلبيات، تأكيد اتصالات الزبائن (COD)، تحليل الأرباح
            ومراقبة المخزون عبر 58 ولاية جزائرية.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            href="/admin/produits"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:-translate-y-0.5 min-h-[42px]"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة منتج جديد</span>
          </Link>

          <Link
            href="/ar"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 backdrop-blur-xs px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors min-h-[42px]"
          >
            <span>معاينة واجهة المتجر</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
          </Link>
        </div>
      </div>

      {/* ── KPI SUMMARY CARDS ───────────────────────────────────────── */}
      <SummaryCards
        totalRevenue={totalRevenue}
        netProfit={netProfit}
        totalOrders={totalOrders}
        pendingOrders={pendingOrders}
        averageOrderValue={averageOrderValue}
        cancellationRate={cancellationRate}
        lowStockCount={lowStockCount}
      />

      {/* ── ANALYTICS CHARTS & HEATMAP GRID ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={salesChartData} />
        </div>
        <div>
          <WilayaHeatmap stats={wilayaStats} totalOrders={totalOrders} />
        </div>
      </div>

      {/* ── RECENT ORDERS QUICK ACTION WIDGET ───────────────────────── */}
      <RecentOrdersTable initialOrders={recentOrders} wilayaMap={wilayaMap} />

      {/* ── QUICK ACCESS NAVIGATION CARDS ──────────────────────────── */}
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
              إدارة الطلبات
            </div>
            <div className="text-xs text-slate-500">
              تأكيد اتصالات الزبائن والواتساب
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
              المنتجات والكتالوج
            </div>
            <div className="text-xs text-slate-500">
              إدارة المنتجات، الأسعار والكميات
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
              مراقبة المخزون
            </div>
            <div className="text-xs text-slate-500">
              نواقص المنتجات وتنبيهات الاستهلاك
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
              التوصيل والشحن
            </div>
            <div className="text-xs text-slate-500">
              تسعيرة 58 ولاية والمكاتب
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
