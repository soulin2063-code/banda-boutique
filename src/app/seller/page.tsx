import React from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'قيد الانتظار',
    color: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  confirmed: {
    label: 'مؤكد',
    color: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  shipped: {
    label: 'قيد الشحن',
    color: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  delivered: {
    label: 'تم التوصيل',
    color: 'bg-teal-50 text-teal-700 border border-teal-200',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  returned: {
    label: 'مسترجع',
    color: 'bg-slate-100 text-slate-700 border border-slate-200',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: 'ملغي',
    color: 'bg-rose-50 text-rose-700 border border-rose-200',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

export default async function SellerOrdersPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      status,
      total,
      notes,
      created_at,
      customers (
        full_name,
        phone
      ),
      addresses (
        wilaya_id,
        address_text,
        delivery_type,
        communes ( name_ar, name_fr )
      ),
      order_items (
        quantity,
        unit_price,
        product_variants (
          sku,
          products (
            slug,
            product_translations ( locale, name )
          )
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  const allOrders = orders || [];
  const pendingCount = allOrders.filter((o) => o.status === 'pending').length;
  const confirmedCount = allOrders.filter((o) => o.status === 'confirmed').length;
  const shippedCount = allOrders.filter((o) => o.status === 'shipped').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">طلبات المتجر والمبيعات</h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة فورية لطلبات الزبائن، تأكيد الاتصالات الهاتفية وشحن الطرود.
          </p>
        </div>
        <Link
          href="/seller/produits"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
        >
          <span>+ إضافة منتج جديد</span>
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/70 p-4 text-center">
          <p className="text-3xl font-black text-amber-800">{pendingCount}</p>
          <p className="text-xs font-bold text-amber-700 mt-1">بانتظار التأكيد (اتصال / واتساب)</p>
        </div>
        <div className="rounded-2xl bg-blue-50/70 border border-blue-200/70 p-4 text-center">
          <p className="text-3xl font-black text-blue-800">{confirmedCount}</p>
          <p className="text-xs font-bold text-blue-700 mt-1">طلبات مؤكدة جاهزة للتجهيز</p>
        </div>
        <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200/70 p-4 text-center">
          <p className="text-3xl font-black text-indigo-800">{shippedCount}</p>
          <p className="text-xs font-bold text-indigo-700 mt-1">طلبات قيد الشحن والتوصيل</p>
        </div>
      </div>

      {/* Orders List */}
      {allOrders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
          <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-800">لا توجد طلبات مسجلة حتى الآن</p>
          <p className="text-xs text-slate-400 mt-1">الطلبات الجديدة التي يطلبها الزبائن ستظهر هنا مباشرة مع بيانات الاتصال.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allOrders.map((order) => {
            const customer = order.customers as { full_name: string; phone: string } | null;
            const address = order.addresses as {
              wilaya_id: number;
              address_text: string | null;
              delivery_type: string;
              communes: { name_ar?: string; name_fr?: string } | null;
            } | null;
            const items = (order.order_items || []) as Array<{
              quantity: number;
              unit_price: number;
              product_variants: {
                sku: string | null;
                products: {
                  slug: string;
                  product_translations: { locale: string; name: string }[];
                } | null;
              } | null;
            }>;
            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS['pending'];
            const createdAt = new Date(order.created_at).toLocaleDateString('ar-DZ', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            });

            const cleanPhone = customer?.phone?.replace(/\D/g, '') || '';
            const waNumber = cleanPhone.startsWith('0') ? '213' + cleanPhone.slice(1) : cleanPhone;

            return (
              <div
                key={order.id}
                className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-3.5"
              >
                {/* Top Row: Customer & Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {customer?.full_name || 'زبون غير مسجل'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`tel:${customer?.phone}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 hover:bg-indigo-100 transition-colors"
                      >
                        📞 {customer?.phone}
                      </a>
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 hover:bg-emerald-100 transition-colors"
                        >
                          💬 واتساب
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusInfo.color}`}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                    <p className="text-lg font-black text-slate-950">
                      {(order.total || 0).toLocaleString()} د.ج
                    </p>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <Truck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>
                    <strong>الولاية:</strong> {address?.wilaya_id}
                    {address?.communes?.name_ar ? ` — ${address.communes.name_ar}` : address?.communes?.name_fr ? ` — ${address.communes.name_fr}` : ''}
                  </span>
                  <span>•</span>
                  <span>
                    {address?.delivery_type === 'home' ? '🏠 توصيل للمنزل' : '🏢 استلام من مكتب التوصيل'}
                  </span>
                  {address?.address_text && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500">العنوان: {address.address_text}</span>
                    </>
                  )}
                </div>

                {/* Items Breakdown */}
                <div className="border-t border-slate-100 pt-3 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400">المنتجات المطلوبة:</p>
                  {items.map((item, i) => {
                    const productName =
                      item.product_variants?.products?.product_translations?.find(
                        (t) => t.locale === 'ar'
                      )?.name ||
                      item.product_variants?.products?.product_translations?.find(
                        (t) => t.locale === 'fr'
                      )?.name ||
                      item.product_variants?.sku ||
                      'منتج';

                    return (
                      <div key={i} className="flex justify-between text-xs text-slate-700 bg-slate-50/50 px-2 py-1 rounded-lg">
                        <span className="font-medium">
                          ×{item.quantity} {productName}
                        </span>
                        <span className="font-bold text-slate-900">
                          {(item.quantity * item.unit_price).toLocaleString()} د.ج
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Notes & Time */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                  <span>🕒 {createdAt}</span>
                  {order.notes && (
                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                      ملاحظة الزبون: {order.notes}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
