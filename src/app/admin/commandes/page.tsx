'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building,
  Home,
  Package,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product_variant_id: string;
}

interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  deposit_paid: number;
  payment_type: 'cod_full' | 'deposit' | 'installment';
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  customers: {
    id: string;
    phone: string;
    full_name: string;
    email: string | null;
  } | null;
  addresses: {
    wilaya_id: number;
    commune_id: string;
    address_text: string | null;
    delivery_type: 'home' | 'desk';
  } | null;
  order_items: OrderItem[];
}

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    next?: OrderStatus;
    nextLabel?: string;
    icon: React.ElementType;
  }
> = {
  pending: {
    label: 'قيد الانتظار',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    next: 'confirmed',
    nextLabel: 'تأكيد الطلب',
    icon: Clock,
  },
  confirmed: {
    label: 'مؤكد',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    next: 'shipped',
    nextLabel: 'تسليم للشحن',
    icon: CheckCircle2,
  },
  shipped: {
    label: 'قيد الشحن',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    next: 'delivered',
    nextLabel: 'تم التوصيل',
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

export default function AdminCommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterStatus ? `/api/orders?status=${filterStatus}` : '/api/orders';
      const res = await fetch(url);
      if (!res.ok) throw new Error('فشل تحميل قائمة الطلبات');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطأ في جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('فشل تحديث الحالة');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`✓ تم تحديث حالة الطلب إلى: ${STATUS_CONFIG[newStatus].label}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'فشل التحديث');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered orders by search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      const shortId = o.id.slice(0, 8).toLowerCase();
      const customerName = (o.customers?.full_name || '').toLowerCase();
      const phone = (o.customers?.phone || '').toLowerCase();
      const wilaya = o.addresses?.wilaya_id?.toString() || '';
      return (
        shortId.includes(q) ||
        customerName.includes(q) ||
        phone.includes(q) ||
        wilaya.includes(q)
      );
    });
  }, [orders, searchQuery]);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ms-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            إدارة وتتبع الطلبات (COD)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            تأكيد الاتصالات الهاتفية، متابعة الشحن والتوصيل وتحصيل المبالغ عبر 58 ولاية.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-300 animate-pulse">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>{pendingCount} بانتظار التأكيد</span>
            </span>
          )}

          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors min-h-[40px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── SEARCH & STATUS FILTER CONTROLS ─────────────────────────── */}
      <div className="space-y-3">
        {/* Real-time Search Input */}
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، رقم الهاتف، رقم الطلب، أو رقم الولاية..."
            className="w-full rounded-2xl bg-white border border-slate-200 py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3.5 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              مسح
            </button>
          )}
        </div>

        {/* Status Filter Tabs with counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { value: '', label: 'كافة الطلبات', count: orders.length, icon: Package },
            {
              value: 'pending',
              label: 'بانتظار التأكيد',
              count: pendingCount,
              icon: Clock,
              color: 'text-amber-600',
            },
            {
              value: 'confirmed',
              label: 'مؤكدة',
              count: confirmedCount,
              icon: CheckCircle2,
              color: 'text-blue-600',
            },
            {
              value: 'shipped',
              label: 'قيد الشحن',
              count: shippedCount,
              icon: Truck,
              color: 'text-indigo-600',
            },
            {
              value: 'delivered',
              label: 'تم التوصيل',
              count: deliveredCount,
              icon: Check,
              color: 'text-teal-600',
            },
            {
              value: 'cancelled',
              label: 'ملغية',
              count: cancelledCount,
              icon: XCircle,
              color: 'text-rose-600',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = filterStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all min-h-[40px] ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isSelected ? 'text-white' : tab.color || 'text-slate-400'
                  }`}
                />
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ORDERS CONTAINER ────────────────────────────────────────── */}
      <div className="bg-white shadow-xs rounded-2xl border border-slate-200 overflow-hidden">
        {/* Table Summary Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              قائمة الطلبات ({filteredOrders.length})
            </span>
            {searchQuery && (
              <span className="text-[11px] text-slate-500">
                (نتائج البحث عن &quot;{searchQuery}&quot;)
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-semibold font-mono">
            إجمالي المبالغ:{' '}
            {filteredOrders.reduce((a, o) => a + o.total, 0).toLocaleString()} د.ج
          </span>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-slate-100 animate-pulse w-full"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">لا توجد طلبات مطابقة</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              لم يتم العثور على أي طلبات تطابق الفلتر أو كلمة البحث المحددة.
            </p>
          </div>
        ) : (
          <>
            {/* ── DESKTOP HIGH-DENSITY DATA TABLE ─────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">الطلب</th>
                    <th className="px-5 py-3.5">الزبون والاتصال</th>
                    <th className="px-5 py-3.5">المبلغ الإجمالي</th>
                    <th className="px-5 py-3.5">التوصيل والولاية</th>
                    <th className="px-5 py-3.5">الحالة</th>
                    <th className="px-5 py-3.5 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOrders.map((order) => {
                    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusCfg.icon;
                    const isExpanded = expandedId === order.id;
                    const isPending = order.status === 'pending';
                    const shortId = order.id.slice(0, 8).toUpperCase();
                    const phoneClean = order.customers?.phone?.replace(/\D/g, '') || '';

                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          className={`transition-colors ${
                            isPending ? 'bg-amber-50/25 hover:bg-amber-50/50' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Order ID & Date */}
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-slate-900 block">
                              #{shortId}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(order.created_at).toLocaleDateString('ar-DZ', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {order.order_items?.length || 0} منتجات
                            </span>
                          </td>

                          {/* Customer Name & Quick Call / WhatsApp */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">
                              {order.customers?.full_name || 'زبون غير مسجل'}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {order.customers?.phone && (
                                <>
                                  <a
                                    href={`tel:${order.customers.phone}`}
                                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700 hover:bg-slate-200 transition-colors"
                                    title="اتصال مباشر"
                                  >
                                    <Phone className="h-3 w-3 text-slate-500" />
                                    <span>{order.customers.phone}</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/213${phoneClean.slice(-9)}?text=${encodeURIComponent(
                                      `السلام عليكم ${order.customers.full_name}، نتصل بك بخصوص طلبيتك رقم #${shortId}. هل تؤكد استلام الطلب؟`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                    title="مراسلة واتساب"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    <span>واتساب</span>
                                  </a>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Price */}
                          <td className="px-5 py-3.5">
                            <div className="font-mono font-black text-slate-900 text-sm">
                              {order.total.toLocaleString()} د.ج
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              المنتجات: {order.subtotal.toLocaleString()} + الشحن:{' '}
                              {order.delivery_fee.toLocaleString()}
                            </div>
                          </td>

                          {/* Delivery info */}
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              {order.addresses?.delivery_type === 'desk' ? (
                                <Building className="h-3.5 w-3.5 text-blue-500" />
                              ) : (
                                <Home className="h-3.5 w-3.5 text-slate-500" />
                              )}
                              <span>
                                {order.addresses?.delivery_type === 'desk'
                                  ? 'مكتب التوصيل'
                                  : 'توصيل للمنزل'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              الولاية #{order.addresses?.wilaya_id}
                              {order.addresses?.commune_id && ` • ${order.addresses.commune_id}`}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusCfg.label}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-left">
                            <div className="flex items-center justify-end gap-2">
                              {/* Next Status Quick Button */}
                              {statusCfg.next && (
                                <button
                                  type="button"
                                  onClick={() => updateStatus(order.id, statusCfg.next!)}
                                  disabled={updatingId === order.id}
                                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xs"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>{statusCfg.nextLabel}</span>
                                </button>
                              )}

                              {/* Cancel Button if Pending */}
                              {order.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => updateStatus(order.id, 'cancelled')}
                                  disabled={updatingId === order.id}
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                                  title="إلغاء الطلب"
                                >
                                  إلغاء
                                </button>
                              )}

                              {/* Toggle Details */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedId(isExpanded ? null : order.id)
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="عرض التفاصيل"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-4 bg-slate-50/80 border-t border-slate-100"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                                    <Package className="h-3.5 w-3.5 text-indigo-600" />
                                    <span>المنتجات المطلوبة ({order.order_items?.length || 0})</span>
                                  </h4>
                                  <div className="space-y-1.5">
                                    {order.order_items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex justify-between items-center rounded-xl bg-white p-2.5 border border-slate-200"
                                      >
                                        <span className="font-mono text-slate-500 text-[11px]">
                                          متغير #{item.product_variant_id.slice(0, 8)}
                                        </span>
                                        <span className="font-bold text-slate-900 font-mono">
                                          {item.quantity} × {item.unit_price.toLocaleString()} د.ج
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                                    <span>تفاصيل الشحن والملاحظات</span>
                                  </h4>
                                  <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-1">
                                    <div>
                                      <strong>الولاية:</strong> #{order.addresses?.wilaya_id}
                                    </div>
                                    {order.addresses?.address_text && (
                                      <div>
                                        <strong>العنوان بالتفصيل:</strong>{' '}
                                        {order.addresses.address_text}
                                      </div>
                                    )}
                                  </div>

                                  {order.notes && (
                                    <div className="mt-2 rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-amber-900">
                                      <strong>ملاحظة الزبون:</strong> {order.notes}
                                    </div>
                                  )}

                                  <div className="mt-3 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => window.print()}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs"
                                    >
                                      <Printer className="h-3.5 w-3.5 text-slate-500" />
                                      <span>طباعة البوليصة</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE SMART COMPACT CARDS (Thumb-friendly) ──────────── */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                const isExpanded = expandedId === order.id;
                const isPending = order.status === 'pending';
                const shortId = order.id.slice(0, 8).toUpperCase();
                const phoneClean = order.customers?.phone?.replace(/\D/g, '') || '';

                return (
                  <div
                    key={order.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isPending ? 'bg-amber-50/25' : 'bg-white'
                    }`}
                  >
                    {/* Top Row: Order ID, Status, Amount */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          #{shortId}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          <StatusIcon className="h-2.5 w-2.5" />
                          <span>{statusCfg.label}</span>
                        </span>
                      </div>

                      <span className="font-mono font-black text-slate-900 text-sm">
                        {order.total.toLocaleString()} د.ج
                      </span>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">
                        {order.customers?.full_name || 'زبون غير مسجل'}
                      </div>
                      <div className="text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>ولاية #{order.addresses?.wilaya_id}</span>
                        <span>•</span>
                        <span>
                          {order.addresses?.delivery_type === 'desk'
                            ? 'استلام من المكتب'
                            : 'توصيل للمنزل'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {order.order_items?.length || 0} منتجات
                        </span>
                      </div>
                    </div>

                    {/* Quick Touch Action Buttons (>= 44px touch target) */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
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
                              `السلام عليكم ${order.customers.full_name}، نتصل بك بخصوص طلبيتك رقم #${shortId} من متجرنا.`
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

                      {statusCfg.next && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, statusCfg.next!)}
                          disabled={updatingId === order.id}
                          className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <Check className="h-4 w-4" />
                          <span>{statusCfg.nextLabel}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center justify-center"
                        title="تفاصيل الطلب"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Mobile Expanded Details */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700">المنتجات:</span>
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center rounded-lg bg-slate-50 p-2"
                            >
                              <span className="text-slate-500 font-mono text-[11px]">
                                متغير #{item.product_variant_id.slice(0, 8)}
                              </span>
                              <span className="font-bold text-slate-800">
                                {item.quantity} × {item.unit_price.toLocaleString()} د.ج
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.addresses?.address_text && (
                          <div className="text-slate-600">
                            <strong>العنوان:</strong> {order.addresses.address_text}
                          </div>
                        )}

                        {order.notes && (
                          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                            <strong>ملاحظة:</strong> {order.notes}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex-1 min-h-[40px] rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>طباعة البوليصة</span>
                          </button>
                          {order.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(order.id, 'cancelled')}
                              disabled={updatingId === order.id}
                              className="min-h-[40px] px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs"
                            >
                              إلغاء الطلب
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
