'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  XCircle,
  ArrowUpRight,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Check,
  Printer,
} from 'lucide-react';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

export interface RecentOrderItem {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  customers: {
    id?: string;
    full_name: string;
    phone: string;
  } | null;
  addresses: {
    wilaya_id?: number;
    commune_id?: string;
    delivery_type?: 'home' | 'desk';
  } | null;
  items_count?: number;
}

interface RecentOrdersTableProps {
  initialOrders: RecentOrderItem[];
  wilayaMap?: Record<number, string>;
}

const STATUS_MAP: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  pending: {
    label: 'قيد الانتظار',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
  },
  confirmed: {
    label: 'مؤكد',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: CheckCircle2,
  },
  shipped: {
    label: 'قيد الشحن',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: Truck,
  },
  delivered: {
    label: 'تم التوصيل',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    icon: Check,
  },
  returned: {
    label: 'مسترجع',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: RotateCcw,
  },
  cancelled: {
    label: 'ملغي',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: XCircle,
  },
};

export function RecentOrdersTable({
  initialOrders,
  wilayaMap = {},
}: RecentOrdersTableProps) {
  const [orders, setOrders] = useState<RecentOrderItem[]>(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleQuickConfirm = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!res.ok) throw new Error('فشل تحديث حالة الطلب');

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'confirmed' } : o))
      );
      showToast('✓ تم تأكيد الطلب بنجاح ونقله إلى قسم التجهيز للشحن');
    } catch {
      showToast('⚠️ حدث خطأ أثناء محاولة تأكيد الطلب');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              أحدث الطلبات الواردة (COD)
            </h3>
            <p className="text-xs text-slate-500">
              اتصال مباشر وتأكيد سريع بنقرة واحدة
            </p>
          </div>
        </div>

        <Link
          href="/admin/commandes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors self-start sm:self-auto"
        >
          <span>عرض كافة الطلبات</span>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          لا توجد طلبات حديثة مسجلة حالياً
        </div>
      ) : (
        <>
          {/* ── DESKTOP HIGH-DENSITY TABLE ───────────────────────────── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-5">رقم الطلب</th>
                  <th className="py-3 px-5">الزبون والهاتف</th>
                  <th className="py-3 px-5">الولاية والتوصيل</th>
                  <th className="py-3 px-5">المبلغ الإجمالي</th>
                  <th className="py-3 px-5">حالة الطلب</th>
                  <th className="py-3 px-5 text-center">إجراء سريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  const StatusIcon = statusInfo.icon;
                  const wilayaName =
                    order.addresses?.wilaya_id && wilayaMap[order.addresses.wilaya_id]
                      ? wilayaMap[order.addresses.wilaya_id]
                      : order.addresses?.wilaya_id
                      ? `ولاية ${order.addresses.wilaya_id}`
                      : 'غير محدد';
                  const isPending = order.status === 'pending';
                  const phoneClean = order.customers?.phone?.replace(/\D/g, '') || '';
                  const shortId = order.id.slice(0, 8).toUpperCase();

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Order ID & Time */}
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/admin/commandes?search=${shortId}`}
                          className="font-mono font-bold text-slate-900 hover:text-indigo-600 transition-colors block"
                        >
                          #{shortId}
                        </Link>
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.created_at).toLocaleDateString('ar-DZ', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer Info & Quick Phone/WhatsApp */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">
                          {order.customers?.full_name || 'زبون غير مسجل'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {order.customers?.phone && (
                            <>
                              <a
                                href={`tel:${order.customers.phone}`}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors"
                                title="اتصال هاتفي مباشر"
                              >
                                <Phone className="h-3 w-3 text-slate-500" />
                                <span>{order.customers.phone}</span>
                              </a>
                              <a
                                href={`https://wa.me/213${phoneClean.slice(-9)}?text=${encodeURIComponent(
                                  `مرحباً ${order.customers.full_name}، نتواصل معك بخصوص طلبيتك رقم #${shortId} من متجرنا. هل تؤكد استلام الطلب؟`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="مراسلة عبر واتساب"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Wilaya & Delivery */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800">
                          {wilayaName}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {order.addresses?.delivery_type === 'home'
                            ? 'توصيل للمنزل'
                            : 'استلام من المكتب'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900 text-sm">
                        {order.total.toLocaleString()} د.ج
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Quick Confirm Action */}
                      <td className="py-3.5 px-5 text-center">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => handleQuickConfirm(order.id)}
                            disabled={updatingId === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>تأكيد الآن</span>
                          </button>
                        ) : (
                          <Link
                            href={`/admin/commandes?search=${shortId}`}
                            className="text-slate-400 hover:text-slate-600 p-1.5 inline-block"
                            title="عرض تفاصيل الطلب"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE COMPACT CARDS (Thumb-friendly) ────────────────── */}
          <div className="md:hidden divide-y divide-slate-100">
            {orders.map((order) => {
              const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const StatusIcon = statusInfo.icon;
              const wilayaName =
                order.addresses?.wilaya_id && wilayaMap[order.addresses.wilaya_id]
                  ? wilayaMap[order.addresses.wilaya_id]
                  : order.addresses?.wilaya_id
                  ? `ولاية ${order.addresses.wilaya_id}`
                  : 'غير محدد';
              const isPending = order.status === 'pending';
              const phoneClean = order.customers?.phone?.replace(/\D/g, '') || '';
              const shortId = order.id.slice(0, 8).toUpperCase();

              return (
                <div
                  key={order.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isPending ? 'bg-amber-50/20' : 'bg-white'
                  }`}
                >
                  {/* Top line: ID, status, amount */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        #{shortId}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    <span className="font-mono font-black text-slate-900 text-sm">
                      {order.total.toLocaleString()} د.ج
                    </span>
                  </div>

                  {/* Customer & Location */}
                  <div className="text-xs">
                    <div className="font-bold text-slate-800">
                      {order.customers?.full_name || 'زبون غير مسجل'}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {wilayaName} •{' '}
                      {order.addresses?.delivery_type === 'home'
                        ? 'توصيل للمنزل'
                        : 'استلام من المكتب'}
                    </div>
                  </div>

                  {/* Quick Action Touch Targets (>= 44px) */}
                  <div className="flex items-center gap-2 pt-1">
                    {order.customers?.phone && (
                      <>
                        <a
                          href={`tel:${order.customers.phone}`}
                          className="flex-1 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Phone className="h-4 w-4 text-slate-600" />
                          <span>اتصال</span>
                        </a>

                        <a
                          href={`https://wa.me/213${phoneClean.slice(-9)}?text=${encodeURIComponent(
                            `مرحباً ${order.customers.full_name}، نتواصل معك بخصوص طلبيتك رقم #${shortId} من متجرنا.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] px-3.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="sr-only">واتساب</span>
                        </a>
                      </>
                    )}

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleQuickConfirm(order.id)}
                        disabled={updatingId === order.id}
                        className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>تأكيد الطلب</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
