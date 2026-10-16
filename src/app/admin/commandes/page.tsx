'use client';

import React, { useState, useEffect, useCallback } from 'react';

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

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; next?: OrderStatus; nextLabel?: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700 border-amber-200', next: 'confirmed', nextLabel: 'تأكيد الطلب ✓' },
  confirmed: { label: 'مؤكد', color: 'bg-blue-50 text-blue-700 border-blue-200', next: 'shipped', nextLabel: 'تسليم للشحن 🚚' },
  shipped: { label: 'قيد الشحن', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', next: 'delivered', nextLabel: 'تم التوصيل ✅' },
  delivered: { label: 'تم التوصيل', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  returned: { label: 'مسترجع', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelled: { label: 'ملغي', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function AdminCommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterStatus ? `/api/orders?status=${filterStatus}` : '/api/orders';
      const res = await fetch(url);
      if (!res.ok) throw new Error('فشل تحميل الطلبات');
      const data = await res.json();
      setOrders(data);
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
      setSuccessMsg(`تم تحديث حالة الطلب إلى: ${STATUS_CONFIG[newStatus].label}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل التحديث');
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">إدارة ومتابعة الطلبات</h1>
          <p className="mt-1 text-sm text-slate-500">
            تأكيد اتصالات الزبائن (COD)، متابعة الشحن والتوصيل عبر 58 ولاية.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300 animate-pulse">
              ⏰ {pendingCount} بانتظار التأكيد
            </span>
          )}
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            🔄 تحديث
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 border border-rose-200">
          <strong>خطأ:</strong> {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900 border border-indigo-200">
          ✓ {successMsg}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: '', label: `كافة الطلبات (${orders.length})` },
          { value: 'pending', label: `⏰ بانتظار التأكيد (${pendingCount})` },
          { value: 'confirmed', label: `✓ مؤكدة (${confirmedCount})` },
          { value: 'shipped', label: '🚚 قيد الشحن' },
          { value: 'delivered', label: '✅ تم التوصيل' },
          { value: 'cancelled', label: '❌ ملغية' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              filterStatus === tab.value
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-xs rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">
            قائمة الطلبات ({orders.length})
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            إجمالي المبالغ: {orders.reduce((a, o) => a + o.total, 0).toLocaleString()} د.ج
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">جاري تحميل الطلبات...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-base font-medium text-slate-900">لا توجد طلبات تطابق الفلتر المحدد</p>
            <p className="mt-1 text-sm text-slate-500">
              ستظهر الطلبات هنا فور قيام الزبائن بالطلب من المتجر.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-right text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">الطلب</th>
                  <th className="px-6 py-3.5">الزبون والاتصال</th>
                  <th className="px-6 py-3.5">المبلغ الإجمالي</th>
                  <th className="px-6 py-3.5">التوصيل</th>
                  <th className="px-6 py-3.5">الحالة</th>
                  <th className="px-6 py-3.5 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
                  const isExpanded = expandedId === order.id;
                  const isPending = order.status === 'pending';

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`transition-colors ${isPending ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs font-bold text-slate-800">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('ar-DZ', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {order.order_items.length} منتج
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">
                            {order.customers?.full_name || 'زبون غير مسجل'}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {order.customers?.phone && (
                              <>
                                <a
                                  href={`tel:${order.customers.phone}`}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                                  title="اتصال مباشر"
                                >
                                  📞 {order.customers.phone}
                                </a>
                                <a
                                  href={`https://wa.me/213${order.customers.phone.replace(/\D/g, '').slice(-9)}?text=${encodeURIComponent(
                                    `السلام عليكم ${order.customers.full_name}، نتصل بك من متجر ShopDZ بخصوص طلبيتك رقم #${order.id.slice(0, 8).toUpperCase()}. هل تؤكد رغبتك في استلام الطلب؟`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  title="فتح واتساب"
                                >
                                  💬 واتساب
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-black text-slate-900">
                            {order.total.toLocaleString()} د.ج
                          </div>
                          <div className="text-xs text-slate-500">
                            سعر المنتجات: {order.subtotal.toLocaleString()} د.ج
                          </div>
                          <div className="text-xs text-slate-500">
                            التوصيل: {order.delivery_fee.toLocaleString()} د.ج
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${
                            order.addresses?.delivery_type === 'desk'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {order.addresses?.delivery_type === 'desk' ? '🏢 مكتب التوصيل' : '🏠 توصيل للمنزل'}
                          </span>
                          <div className="text-xs text-slate-400 mt-1">الولاية #{order.addresses?.wilaya_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left space-y-1.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : order.id)}
                              className="text-xs font-bold text-slate-600 hover:text-slate-900"
                            >
                              {isExpanded ? '▲ إخفاء' : '▼ التفاصيل'}
                            </button>
                            {statusCfg.next && (
                              <button
                                onClick={() => updateStatus(order.id, statusCfg.next!)}
                                disabled={updatingId === order.id}
                                className="rounded-xl bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-2xs"
                              >
                                {updatingId === order.id
                                  ? '...'
                                  : (statusCfg.nextLabel || `→ ${STATUS_CONFIG[statusCfg.next].label}`)}
                              </button>
                            )}
                            {order.status === 'pending' && (
                              <button
                                onClick={() => updateStatus(order.id, 'cancelled')}
                                disabled={updatingId === order.id}
                                className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors"
                              >
                                إلغاء
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-slate-50/80 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <h4 className="font-bold text-slate-800 mb-2 text-xs">
                                  المنتجات في الطلب
                                </h4>
                                <div className="space-y-1">
                                  {order.order_items.map((item) => (
                                    <div key={item.id} className="flex justify-between rounded-xl bg-white p-2.5 border border-slate-200">
                                      <span className="font-mono text-slate-500 text-[11px]">
                                        #{item.product_variant_id.slice(0, 8)}
                                      </span>
                                      <span className="font-bold text-slate-900">
                                        {item.quantity} × {item.unit_price.toLocaleString()} د.ج
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 mb-2 text-xs">
                                  عنوان وبيانات التوصيل
                                </h4>
                                <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-1">
                                  <div><strong>الولاية:</strong> #{order.addresses?.wilaya_id}</div>
                                  {order.addresses?.address_text && (
                                    <div><strong>العنوان:</strong> {order.addresses.address_text}</div>
                                  )}
                                  <div><strong>نوع التوصيل:</strong> {order.addresses?.delivery_type === 'desk' ? 'استلام من مكتب التوصيل' : 'توصيل لباب المنزل'}</div>
                                </div>
                                {order.notes && (
                                  <div className="mt-2 rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-amber-900">
                                    <strong>ملاحظة الزبون:</strong> {order.notes}
                                  </div>
                                )}
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
        )}
      </div>
    </div>
  );
}
