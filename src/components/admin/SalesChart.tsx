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

  // If no data, supply clean placeholder trend for preview
  const chartData =
    data.length > 0
      ? data
      : [
          { date: 'J-6', amount: 12000, orders: 3 },
          { date: 'J-5', amount: 24500, orders: 5 },
          { date: 'J-4', amount: 18000, orders: 4 },
          { date: 'J-3', amount: 32000, orders: 7 },
          { date: 'J-2', amount: 41000, orders: 9 },
          { date: 'J-1', amount: 36000, orders: 8 },
          { date: 'Aujourd’hui', amount: 48000, orders: 11 },
        ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Évolution des Ventes & Commandes
          </h3>
          <p className="text-xs text-slate-500">
            Tendance des 7 à 30 derniers jours
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMetric('amount')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              metric === 'amount'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chiffre d’Affaires (DA)
          </button>
          <button
            type="button"
            onClick={() => setMetric('orders')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              metric === 'orders'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nombre de Commandes
          </button>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (metric === 'amount' ? `${v / 1000}k` : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(val: any) => [
                metric === 'amount' ? `${val.toLocaleString()} DA` : `${val} commandes`,
                metric === 'amount' ? 'Chiffre d’Affaires' : 'Commandes',
              ]}
            />
            {metric === 'amount' ? (
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#amountGradient)"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#ordersGradient)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
