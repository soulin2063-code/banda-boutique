'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';

export interface DailySalesData {
  date: string;
  amount: number;
  orders: number;
}

interface SalesChartProps {
  data: DailySalesData[];
}

export function SalesChart({ data }: SalesChartProps) {
  const [metric, setMetric] = useState<'amount' | 'orders'>('amount');

  // If no data, supply clean standard preview
  const chartData =
    data.length > 0
      ? data
      : [
          { date: '12 أكتوبر', amount: 18500, orders: 4 },
          { date: '13 أكتوبر', amount: 26000, orders: 6 },
          { date: '14 أكتوبر', amount: 31500, orders: 7 },
          { date: '15 أكتوبر', amount: 22000, orders: 5 },
          { date: '16 أكتوبر', amount: 48000, orders: 11 },
          { date: '17 أكتوبر', amount: 56000, orders: 13 },
          { date: 'اليوم', amount: 64500, orders: 15 },
        ];

  const totalPeriodAmount = chartData.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPeriodOrders = chartData.reduce((acc, curr) => acc + curr.orders, 0);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              تحليل المبيعات وحركة الطلبات
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            متابعة حركة المداخيل والطلبيات اليومية المكتملة
          </p>
        </div>

        {/* Metric Switcher Buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('amount')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all ${
              metric === 'amount'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>المداخيل (د.ج)</span>
          </button>

          <button
            type="button"
            onClick={() => setMetric('orders')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all ${
              metric === 'orders'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>عدد الطلبات</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Indicator */}
      <div className="flex items-center gap-4 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex-wrap">
        <div>
          <span className="text-slate-500">إجمالي الفترة: </span>
          <span className="font-bold text-slate-900 font-mono">
            {totalPeriodAmount.toLocaleString()} د.ج
          </span>
        </div>
        <div className="h-3 w-px bg-slate-200" />
        <div>
          <span className="text-slate-500">مجموع الطلبات: </span>
          <span className="font-bold text-slate-900 font-mono">
            {totalPeriodOrders} طلب
          </span>
        </div>
        <div className="h-3 w-px bg-slate-200" />
        <div>
          <span className="text-slate-500">متوسط اليوم: </span>
          <span className="font-bold text-indigo-600 font-mono">
            {Math.round(totalPeriodAmount / (chartData.length || 1)).toLocaleString()} د.ج
          </span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-72 w-full pt-1" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="salesAmountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="salesOrdersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />

            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (metric === 'amount' ? `${v >= 1000 ? `${v / 1000}k` : v}` : v)}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DailySalesData;
                  return (
                    <div
                      dir="rtl"
                      className="rounded-xl bg-slate-950/95 backdrop-blur-md p-3 text-white shadow-xl border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-indigo-400" />
                        <span>{label}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">المداخيل:</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {item.amount.toLocaleString()} د.ج
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">عدد الطلبات:</span>
                        <span className="font-bold text-sky-400 font-mono">
                          {item.orders} طلب
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {metric === 'amount' ? (
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salesAmountGradient)"
                activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#0284c7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salesOrdersGradient)"
                activeDot={{ r: 6, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
