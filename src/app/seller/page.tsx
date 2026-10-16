import React from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  confirmed: {
    label: 'Confirmé',
    color: 'bg-blue-100 text-blue-800',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  shipped: {
    label: 'Expédié',
    color: 'bg-indigo-100 text-indigo-800',
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  delivered: {
    label: 'Livré',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  returned: {
    label: 'Retourné',
    color: 'bg-orange-100 text-orange-800',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-800',
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
        communes ( name_fr )
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
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Commandes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {allOrders.length} commande{allOrders.length !== 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4 text-center">
          <p className="text-2xl font-black text-yellow-700">{pendingCount}</p>
          <p className="text-xs font-semibold text-yellow-600 mt-1">En attente</p>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
          <p className="text-2xl font-black text-blue-700">{confirmedCount}</p>
          <p className="text-xs font-semibold text-blue-600 mt-1">Confirmées</p>
        </div>
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center">
          <p className="text-2xl font-black text-indigo-700">{shippedCount}</p>
          <p className="text-xs font-semibold text-indigo-600 mt-1">Expédiées</p>
        </div>
      </div>

      {/* Orders list */}
      {allOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-16 text-center">
          <Package className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-500">Aucune commande pour l&apos;instant</p>
          <p className="text-xs text-stone-400 mt-1">Les nouvelles commandes apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allOrders.map((order) => {
            const customer = order.customers as { full_name: string; phone: string } | null;
            const address = order.addresses as {
              wilaya_id: number;
              address_text: string | null;
              delivery_type: string;
              communes: { name_fr: string } | null;
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
            const createdAt = new Date(order.created_at).toLocaleDateString('fr-DZ', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="rounded-xl bg-white border border-stone-200 p-4 sm:p-5 space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-stone-400 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {customer?.full_name || '—'}
                    </p>
                    <a
                      href={`tel:${customer?.phone}`}
                      className="text-xs text-amber-600 font-semibold hover:underline"
                    >
                      📞 {customer?.phone}
                    </a>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${statusInfo.color}`}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                    <p className="text-sm font-black text-slate-900">
                      {(order.total || 0).toLocaleString('fr-DZ')} DA
                    </p>
                  </div>
                </div>

                {/* Delivery info */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Truck className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Wilaya {address?.wilaya_id}
                    {address?.communes?.name_fr ? ` — ${address.communes.name_fr}` : ''}
                    {' · '}
                    {address?.delivery_type === 'home' ? '🏠 Domicile' : '🏢 Bureau'}
                  </span>
                </div>

                {/* Items */}
                <div className="border-t border-stone-100 pt-2.5 space-y-1">
                  {items.map((item, i) => {
                    const productName =
                      item.product_variants?.products?.product_translations?.find(
                        (t) => t.locale === 'fr'
                      )?.name ||
                      item.product_variants?.products?.product_translations?.[0]?.name ||
                      item.product_variants?.sku ||
                      '—';
                    return (
                      <div key={i} className="flex justify-between text-xs text-slate-600">
                        <span>
                          ×{item.quantity} {productName}
                        </span>
                        <span className="font-semibold">
                          {(item.quantity * item.unit_price).toLocaleString('fr-DZ')} DA
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-stone-400">{createdAt}</span>
                  {order.notes && (
                    <span className="text-xs text-stone-500 italic max-w-[50%] truncate">
                      💬 {order.notes}
                    </span>
                  )}
                  {/* Update status — links to admin for now; sellers can use admin commandes page */}
                  <Link
                    href={`/admin/commandes`}
                    className="text-xs font-semibold text-amber-600 hover:underline"
                  >
                    Gérer →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
