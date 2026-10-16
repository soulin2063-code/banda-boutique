'use client';

import React, { useState, useEffect } from 'react';

interface OptionTranslation {
  locale: string;
  label: string;
}

interface AttributeTranslation {
  locale: string;
  name: string;
}

interface AttributeOption {
  value_slug: string;
  attribute_option_translations?: OptionTranslation[];
  attributes?: {
    slug: string;
    attribute_translations?: AttributeTranslation[];
  };
}

interface ProductAttributeValue {
  attribute_options: AttributeOption;
}

interface ProductTranslation {
  locale: string;
  name: string;
}

interface ProductImage {
  url: string;
  position: number;
}

interface StockVariant {
  id: string;
  sku: string | null;
  stock_qty: number;
  min_stock_threshold: number;
  price_override: number | null;
  cost_price: number | null;
  products: {
    id: string;
    slug: string;
    base_price: number;
    status: string;
    product_translations: ProductTranslation[];
    product_images: ProductImage[];
  };
  product_attribute_values: ProductAttributeValue[];
}

export default function AdminStockPage() {
  const [variants, setVariants] = useState<StockVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stock');
      if (!res.ok) {
        throw new Error('Failed to load stock data');
      }
      const data = await res.json();
      setVariants(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const updateQuantity = async (variantId: string, newQty: number, newThreshold?: number) => {
    if (newQty < 0) return;
    setUpdatingId(variantId);
    try {
      const res = await fetch(`/api/stock/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_qty: newQty,
          ...(typeof newThreshold === 'number' ? { min_stock_threshold: newThreshold } : {}),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update stock');
      }

      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId
            ? {
                ...v,
                stock_qty: newQty,
                ...(typeof newThreshold === 'number' ? { min_stock_threshold: newThreshold } : {}),
              }
            : v
        )
      );
      setSuccessToast('Stock mis à jour !');
      setTimeout(() => setSuccessToast(null), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalSKUs = variants.length;
  const lowStockCount = variants.filter((v) => v.stock_qty < v.min_stock_threshold && v.stock_qty > 0).length;
  const outOfStockCount = variants.filter((v) => v.stock_qty === 0).length;
  const healthyStockCount = variants.filter((v) => v.stock_qty >= v.min_stock_threshold).length;

  const filteredVariants = variants.filter((v) => {
    if (filter === 'low') return v.stock_qty < v.min_stock_threshold && v.stock_qty > 0;
    if (filter === 'out') return v.stock_qty === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventaire & Stock
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivi des quantités et alertes visuelles automatiques lorsque le stock est inférieur au seuil min (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">min_stock_threshold</code>).
          </p>
        </div>
        <button
          onClick={fetchStock}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Références (SKUs)
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{totalSKUs}</div>
          <div className="mt-1 text-xs text-slate-400">Toutes variantes confondues</div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Stock Confortable
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700">{healthyStockCount}</div>
          <div className="mt-1 text-xs text-emerald-600">Au-dessus du seuil minimum</div>
        </div>

        <div
          onClick={() => setFilter('low')}
          className={`rounded-xl border p-5 shadow-sm cursor-pointer transition-all ${
            lowStockCount > 0
              ? 'border-amber-300 bg-amber-50 hover:bg-amber-100/70'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
              ⚠️ Stock Faible (&lt; Seuil)
            </span>
            {lowStockCount > 0 && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-800">{lowStockCount}</div>
          <div className="mt-1 text-xs text-amber-700">À réapprovisionner rapidement</div>
        </div>

        <div
          onClick={() => setFilter('out')}
          className={`rounded-xl border p-5 shadow-sm cursor-pointer transition-all ${
            outOfStockCount > 0
              ? 'border-red-300 bg-red-50 hover:bg-red-100/70'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-red-800">
            🚫 Ruptures de Stock (0)
          </div>
          <div className="mt-2 text-3xl font-extrabold text-red-700">{outOfStockCount}</div>
          <div className="mt-1 text-xs text-red-600">Articles indisponibles à la vente</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex rounded-lg bg-slate-200/80 p-1 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({totalSKUs})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              filter === 'low'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 hover:text-amber-900'
            }`}
          >
            ⚠️ Stock Faible ({lowStockCount})
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              filter === 'out'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-700 hover:text-red-900'
            }`}
          >
            🚫 Rupture ({outOfStockCount})
          </button>
        </div>

        {successToast && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 animate-fade-in">
            ✓ {successToast}
          </span>
        )}
      </div>

      {/* Stock Table */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-900">
            Détail des Stocks par Variante ({filteredVariants.length})
          </h2>
          <span className="text-xs text-slate-500">Seuil par défaut: 3 unités</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Chargement de l&apos;inventaire...</div>
        ) : filteredVariants.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Aucune variante ne correspond au filtre sélectionné.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Produit & Options</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Prix</th>
                  <th className="px-6 py-3">Seuil Alerte (Min)</th>
                  <th className="px-6 py-3">Quantité en Stock</th>
                  <th className="px-6 py-3">État du Stock</th>
                  <th className="px-6 py-3 text-right">Ajustement Rapide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredVariants.map((v) => {
                  const isLow = v.stock_qty < v.min_stock_threshold && v.stock_qty > 0;
                  const isOut = v.stock_qty === 0;

                  const prodNameFr =
                    v.products?.product_translations?.find((t) => t.locale === 'fr')?.name ||
                    v.products?.slug;

                  const prodImg = v.products?.product_images?.[0]?.url;

                  // Extract option labels (e.g. Size: L)
                  const optionLabels = (v.product_attribute_values || [])
                    .map((pav) => {
                      const opt = pav.attribute_options;
                      const label =
                        opt?.attribute_option_translations?.find((t) => t.locale === 'fr')?.label ||
                        opt?.value_slug;
                      const attrName =
                        opt?.attributes?.attribute_translations?.find((t) => t.locale === 'fr')?.name ||
                        opt?.attributes?.slug;
                      return attrName ? `${attrName}: ${label}` : label;
                    })
                    .filter(Boolean);

                  return (
                    <tr
                      key={v.id}
                      className={`transition-colors ${
                        isOut
                          ? 'bg-red-50/40 hover:bg-red-50/70'
                          : isLow
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        {prodImg ? (
                          <img
                            src={prodImg}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                            📦
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{prodNameFr}</div>
                          <div className="text-xs text-slate-500">
                            {optionLabels.length > 0 ? (
                              <span className="inline-flex gap-1">
                                {optionLabels.map((l, i) => (
                                  <span
                                    key={i}
                                    className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700"
                                  >
                                    {l}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="italic text-slate-400">Variante standard</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-700">
                        {v.sku || '-'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {(v.price_override ?? v.products?.base_price ?? 0).toLocaleString()} DA
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            defaultValue={v.min_stock_threshold}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (val !== v.min_stock_threshold) {
                                updateQuantity(v.id, v.stock_qty, val);
                              }
                            }}
                            className="w-16 rounded border border-slate-300 px-2 py-1 text-xs text-center focus:border-emerald-600 focus:outline-none"
                          />
                          <span className="text-[11px] text-slate-400">unités</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-base font-extrabold ${
                            isOut
                              ? 'text-red-700'
                              : isLow
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {v.stock_qty}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 border border-red-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                            Rupture de Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300 shadow-sm animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                            Stock Faible (&lt; {v.min_stock_threshold})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            En Stock
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            disabled={v.stock_qty <= 0 || updatingId === v.id}
                            onClick={() => updateQuantity(v.id, v.stock_qty - 1)}
                            className="h-7 w-7 rounded bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center shadow-xs"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-bold text-xs text-slate-800">
                            {v.stock_qty}
                          </span>
                          <button
                            type="button"
                            disabled={updatingId === v.id}
                            onClick={() => updateQuantity(v.id, v.stock_qty + 1)}
                            className="h-7 w-7 rounded bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
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
