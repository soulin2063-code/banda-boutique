import React from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SummaryCards } from '@/components/admin/SummaryCards';
import { SalesChart, DailySalesData } from '@/components/admin/SalesChart';
import { WilayaHeatmap, WilayaOrderStat } from '@/components/admin/WilayaHeatmap';
import { RecentOrdersTable, RecentOrderItem } from '@/components/admin/RecentOrdersTable';
import { AdminDashboardHero, AdminDashboardQuickCards } from '@/components/admin/AdminDashboardHero';

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
      <AdminDashboardHero />

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
      <AdminDashboardQuickCards />
    </div>
  );
}
