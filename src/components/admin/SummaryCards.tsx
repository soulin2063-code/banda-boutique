'use client';

import React from 'react';
import { DollarSign, ShoppingBag, Clock, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface SummaryCardsProps {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  lowStockCount: number;
}

export function SummaryCards({
  totalRevenue,
  totalOrders,
  pendingOrders,
  totalCustomers,
  lowStockCount,
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'Chiffre d’Affaires',
      value: `${totalRevenue.toLocaleString()} DA`,
      subtitle: 'Total cumulé encaissé & en cours',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      href: '/admin/commandes',
    },
    {
      title: 'Total Commandes',
      value: totalOrders.toString(),
      subtitle: 'Toutes les commandes passées',
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      href: '/admin/commandes',
    },
    {
      title: 'En Attente de Confirmation',
      value: pendingOrders.toString(),
      subtitle: 'À contacter par téléphone / WhatsApp',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: pendingOrders > 0 ? 'Urgent' : undefined,
      href: '/admin/commandes?status=pending',
    },
    {
      title: 'Base Clients',
      value: totalCustomers.toString(),
      subtitle: 'Clients uniques enregistrés',
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      href: '/admin/clients',
    },
    {
      title: 'Alertes Stock Faible',
      value: lowStockCount.toString(),
      subtitle: 'Sous le seuil d’alerte',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      badge: lowStockCount > 0 ? 'Réappro' : undefined,
      href: '/admin/stock',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.title}
            href={c.href}
            className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`p-2 rounded-xl border ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-950 tracking-tight">
                {c.value}
              </span>
              {c.badge && (
                <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 animate-pulse">
                  {c.badge}
                </span>
              )}
            </div>

            <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">{c.subtitle}</p>
          </Link>
        );
      })}
    </div>
  );
}
