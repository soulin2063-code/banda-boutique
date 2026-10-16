import React from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SummaryCards } from '@/components/admin/SummaryCards';
import { SalesChart, DailySalesData } from '@/components/admin/SalesChart';
import { WilayaHeatmap, WilayaOrderStat } from '@/components/admin/WilayaHeatmap';
import { Package, Plus, ShoppingBag, Truck, Tag, ExternalLink } from 'lucide-react';

export default async function AdminDashboardPage() {
  // Fetch all dashboard data in parallel (4x faster)
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
        addresses (
          wilaya_id
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
      .select('id, name_fr, name_ar'),
  ]);

  const lowStockCount = (lowStockVariants || []).filter(
    (v) => v.stock_qty <= v.min_stock_threshold
  ).length;

  const wilayaMap = new Map(
    (wilayas || []).map((w) => [w.id, `${w.id} - ${w.name_fr}`])
  );

  // Aggregations
  const allOrders = orders || [];
  const nonCancelledOrders = allOrders.filter((o) => o.status !== 'cancelled');

  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter((o) => o.status === 'pending').length;
  const totalCustomers = customerCount || 0;

  // Build 7-day trend data for SalesChart
  const dateMap = new Map<string, { amount: number; orders: number }>();
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' });
    dateMap.set(key, { amount: 0, orders: 0 });
  }

  allOrders.forEach((o) => {
    const d = new Date(o.created_at);
    const key = d.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' });
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
      wilaya_name: wilayaMap.get(wId) || `Wilaya ${wId}`,
      order_count: val.count,
      total_revenue: val.revenue,
    }))
    .sort((a, b) => b.order_count - a.order_count);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300">
            <span>🇩🇿 ShopDZ — منصة التجارة الإلكترونية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            لوحة إدارة المتجر والمبيعات
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            متابعة فورية للطلبات، تأكيد اتصالات الزبائن (COD)، تحليل الأرباح وحالة المخزون عبر 58 ولاية.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/produits"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة منتج جديد</span>
          </Link>
          <Link
            href="/ar"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 backdrop-blur-xs px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <span>معاينة المتجر</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalRevenue={totalRevenue}
        totalOrders={totalOrders}
        pendingOrders={pendingOrders}
        totalCustomers={totalCustomers}
        lowStockCount={lowStockCount}
      />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={salesChartData} />
        </div>
        <div>
          <WilayaHeatmap stats={wilayaStats} totalOrders={totalOrders} />
        </div>
      </div>

      {/* Quick Links Footer Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/commandes"
          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">إدارة الطلبات</div>
            <div className="text-xs text-slate-500">تأكيد اتصالات الزبائن والواتساب</div>
          </div>
        </Link>

        <Link
          href="/admin/produits"
          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">المنتجات والكتالوج</div>
            <div className="text-xs text-slate-500">إدارة المنتجات والأسعار والصور</div>
          </div>
        </Link>

        <Link
          href="/admin/attributs"
          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">الخصائص والخيارات</div>
            <div className="text-xs text-slate-500">المقاسات، الألوان، والأحجام</div>
          </div>
        </Link>

        <Link
          href="/admin/parametres"
          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">التوصيل والشحن</div>
            <div className="text-xs text-slate-500">تسعيرة 58 ولاية والمكاتب</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
