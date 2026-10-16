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

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; next?: OrderStatus }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-300', next: 'confirmed' },
  confirmed: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800 border-blue-300', next: 'shipped' },
  shipped: { label: 'Expédié', color: 'bg-purple-100 text-purple-800 border-purple-300', next: 'delivered' },
  delivered: { label: 'Livré ✓', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  returned: { label: 'Retourné', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800 border-red-300' },
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
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching orders');
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
      if (!res.ok) throw new Error('Failed to update status');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setSuccessMsg(`Statut mis à jour → ${STATUS_CONFIG[newStatus].label}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestion des Commandes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivi et gestion du cycle de vie complet des commandes COD.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300 animate-pulse">
              ⏰ {pendingCount} en attente de confirmation
            </span>
          )}
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <strong>Erreur:</strong> {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
          ✓ {successMsg}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: '', label: `Toutes (${orders.length})` },
          { value: 'pending', label: `⏰ En attente (${pendingCount})` },
          { value: 'confirmed', label: `✓ Confirmées (${confirmedCount})` },
          { value: 'shipped', label: '📦 Expédiées' },
          { value: 'delivered', label: '✅ Livrées' },
          { value: 'cancelled', label: '❌ Annulées' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === tab.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-900">
            Commandes ({orders.length})
          </h2>
          <span className="text-xs text-slate-400">
            Total CA: {orders.reduce((a, o) => a + o.total, 0).toLocaleString()} DA
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Chargement des commandes...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-base font-medium text-slate-900">Aucune commande trouvée</p>
            <p className="mt-1 text-sm text-slate-500">
              Les commandes apparaîtront ici dès que des clients passeront commande.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Commande</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Montant</th>
                  <th className="px-6 py-3">Livraison</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status];
                  const isExpanded = expandedId === order.id;
                  const isPending = order.status === 'pending';

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`transition-colors ${isPending ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs font-semibold text-slate-700">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('fr-DZ', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {order.order_items.length} article(s)
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {order.customers?.full_name || 'Inconnu'}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {order.customers?.phone && (
                              <>
                                <a
                                  href={`tel:${order.customers.phone}`}
                                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                                  title="Appeler directement"
                                >
                                  📞 {order.customers.phone}
                                </a>
                                <a
                                  href={`https://wa.me/213${order.customers.phone.replace(/\D/g, '').slice(-9)}?text=${encodeURIComponent(
                                    `Bonjour ${order.customers.full_name}, nous vous contactons depuis ShopDZ concernant votre commande #${order.id.slice(0, 8).toUpperCase()}. Pourriez-vous confirmer votre disponibilité pour la livraison ?`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  title="Ouvrir WhatsApp"
                                >
                                  💬 WhatsApp
                                </a>
                              </>
                            )}
                          </div>
                          {order.customers?.email && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{order.customers.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900">
                            {order.total.toLocaleString()} DA
                          </div>
                          <div className="text-xs text-slate-500">
                            Sous-total: {order.subtotal.toLocaleString()} DA
                          </div>
                          <div className="text-xs text-slate-500">
                            Livraison: {order.delivery_fee.toLocaleString()} DA
                          </div>
                          {order.payment_type !== 'cod_full' && (
                            <div className="text-xs text-emerald-700 font-semibold">
                              Acompte: {order.deposit_paid.toLocaleString()} DA
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${
                            order.addresses?.delivery_type === 'desk'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {order.addresses?.delivery_type === 'desk' ? '🏢 Bureau' : '🏠 Domicile'}
                          </span>
                          <div className="text-xs text-slate-400 mt-1">Wilaya #{order.addresses?.wilaya_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-y-1.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : order.id)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                            >
                              {isExpanded ? '▲ Réduire' : '▼ Détails'}
                            </button>
                            {statusCfg.next && (
                              <button
                                onClick={() => updateStatus(order.id, statusCfg.next!)}
                                disabled={updatingId === order.id}
                                className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                              >
                                {updatingId === order.id
                                  ? '...'
                                  : `→ ${STATUS_CONFIG[statusCfg.next].label}`}
                              </button>
                            )}
                            {order.status === 'pending' && (
                              <button
                                onClick={() => updateStatus(order.id, 'cancelled')}
                                disabled={updatingId === order.id}
                                className="text-xs font-semibold text-red-600 hover:text-red-800"
                              >
                                Annuler
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">
                                  Articles commandés
                                </h4>
                                <div className="space-y-1">
                                  {order.order_items.map((item) => (
                                    <div key={item.id} className="flex justify-between rounded bg-white p-2 border border-slate-200">
                                      <span className="font-mono text-slate-500 text-[11px]">
                                        {item.product_variant_id.slice(0, 8)}...
                                      </span>
                                      <span className="font-semibold">
                                        {item.quantity}× {item.unit_price.toLocaleString()} DA
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">
                                  Adresse de livraison
                                </h4>
                                <div className="rounded bg-white p-3 border border-slate-200 space-y-1">
                                  <div><strong>Wilaya:</strong> #{order.addresses?.wilaya_id}</div>
                                  <div><strong>Commune:</strong> {order.addresses?.commune_id?.slice(0, 8)}...</div>
                                  {order.addresses?.address_text && (
                                    <div><strong>Adresse:</strong> {order.addresses.address_text}</div>
                                  )}
                                  <div><strong>Type:</strong> {order.addresses?.delivery_type === 'desk' ? 'Bureau de livraison' : 'Domicile'}</div>
                                </div>
                                {order.notes && (
                                  <div className="mt-2 rounded bg-amber-50 p-2 border border-amber-200 text-amber-800">
                                    <strong>Notes:</strong> {order.notes}
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
