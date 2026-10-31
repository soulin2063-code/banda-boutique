'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Plus,
  Minus,
  Package,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stock');
      if (!res.ok) {
        throw new Error('فشل تحميل بيانات المخزون');
      }
      const data = await res.json();
      setVariants(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطأ في جلب بيانات المخزون');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const updateQuantity = async (
    variantId: string,
    newQty: number,
    newThreshold?: number
  ) => {
    if (newQty < 0) return;
    setUpdatingId(variantId);
    try {
      const res = await fetch(`/api/stock/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_qty: newQty,
          ...(typeof newThreshold === 'number'
            ? { min_stock_threshold: newThreshold }
            : {}),
        }),
      });

      if (!res.ok) {
        throw new Error('فشل تحديث المخزون');
      }

      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId
            ? {
                ...v,
                stock_qty: newQty,
                ...(typeof newThreshold === 'number'
                  ? { min_stock_threshold: newThreshold }
                  : {}),
              }
            : v
        )
      );
      setSuccessToast('✓ تم تحديث كمية المخزون بنجاح!');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل التحديث');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalSKUs = variants.length;
  const lowStockCount = variants.filter(
    (v) => v.stock_qty < v.min_stock_threshold && v.stock_qty > 0
  ).length;
  const outOfStockCount = variants.filter((v) => v.stock_qty === 0).length;
  const healthyStockCount = variants.filter(
    (v) => v.stock_qty >= v.min_stock_threshold
  ).length;

  const filteredVariants = useMemo(() => {
    let list = variants;
    if (filter === 'low') {
      list = list.filter((v) => v.stock_qty < v.min_stock_threshold && v.stock_qty > 0);
    } else if (filter === 'out') {
      list = list.filter((v) => v.stock_qty === 0);
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((v) => {
      const prodNameAr =
        v.products?.product_translations?.find((t) => t.locale === 'ar')?.name || '';
      const prodNameFr =
        v.products?.product_translations?.find((t) => t.locale === 'fr')?.name || '';
      const slug = v.products?.slug || '';
      const sku = v.sku || '';

      return (
        prodNameAr.toLowerCase().includes(q) ||
        prodNameFr.toLowerCase().includes(q) ||
        slug.toLowerCase().includes(q) ||
        sku.toLowerCase().includes(q)
      );
    });
  }, [variants, filter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
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
            مراقبة وتحديث المخزون
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            تتبع الكميات اللحظية وتنبيهات النقص التلقائية عند النزول تحت حد الطلب الأدنى لكل متغير.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStock}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors min-h-[40px] self-start sm:self-auto"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
          />
          <span>تحديث المخزون</span>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      {/* ── KPI METRICS SUMMARY CARDS ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500">
              إجمالي المتغيرات (SKUs)
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
              {totalSKUs}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">كافة الخيارات والأحجام</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Boxes className="h-5 w-5" />
          </div>
        </div>

        {/* Healthy Stock */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-800">
              مخزون مريح
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
              {healthyStockCount}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600">أعلى من الحد الأدنى</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Low Stock (< Threshold) */}
        <div
          onClick={() => setFilter('low')}
          className={`rounded-2xl border p-5 shadow-xs cursor-pointer transition-all flex items-center justify-between ${
            lowStockCount > 0
              ? 'border-amber-300 bg-amber-50 hover:bg-amber-100/70 shadow-amber-500/10'
              : 'border-slate-200/80 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <span>كمية محدودة (&lt; الحد الأدنى)</span>
              {lowStockCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="mt-2 text-2xl font-black text-amber-800 font-mono">
              {lowStockCount}
            </div>
            <div className="mt-1 text-[11px] text-amber-700">تحتاج إعادة تموين عاجلة</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Out of Stock (0) */}
        <div
          onClick={() => setFilter('out')}
          className={`rounded-2xl border p-5 shadow-xs cursor-pointer transition-all flex items-center justify-between ${
            outOfStockCount > 0
              ? 'border-rose-300 bg-rose-50 hover:bg-rose-100/70 shadow-rose-500/10'
              : 'border-slate-200/80 bg-white'
          }`}
        >
          <div>
            <div className="text-xs font-bold text-rose-800">
              نفاد تام للمخزون (0 قطع)
            </div>
            <div className="mt-2 text-2xl font-black text-rose-700 font-mono">
              {outOfStockCount}
            </div>
            <div className="mt-1 text-[11px] text-rose-600">غير متوفرة للطلب حالياً</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ───────────────────────────────── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المنتج، الرمز (SKU)، أو المقاس واللون..."
            className="w-full rounded-2xl bg-white border border-slate-200 py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[40px] ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            كافة المنتجات ({totalSKUs})
          </button>

          <button
            onClick={() => setFilter('low')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 ${
              filter === 'low'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                : 'bg-white border border-slate-200 text-amber-800 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>كمية محدودة ({lowStockCount})</span>
          </button>

          <button
            onClick={() => setFilter('out')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 ${
              filter === 'out'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>نافذة بالكامل ({outOfStockCount})</span>
          </button>
        </div>
      </div>

      {/* ── STOCK ITEMS TABLE & CARDS ───────────────────────────────── */}
      <div className="bg-white shadow-xs rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-900">
            تفاصيل متغيرات المخزون ({filteredVariants.length})
          </h2>
          <span className="text-[11px] text-slate-500">
            حد التنبيه الافتراضي: 3 إلى 5 قطع
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-slate-100 animate-pulse w-full"
              />
            ))}
          </div>
        ) : filteredVariants.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Boxes className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">لا توجد نتائج مطابقة</p>
            <p className="text-xs text-slate-500">
              جرب تغيير خيارات الفلترة أو مسح كلمة البحث.
            </p>
          </div>
        ) : (
          <>
            {/* ── DESKTOP HIGH-DENSITY TABLE ───────────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">المنتج والخيارات</th>
                    <th className="px-5 py-3.5">رمز الصنف (SKU)</th>
                    <th className="px-5 py-3.5">السعر</th>
                    <th className="px-5 py-3.5">حد التنبيه الأدنى</th>
                    <th className="px-5 py-3.5">الكمية المتوفرة</th>
                    <th className="px-5 py-3.5">حالة المخزون</th>
                    <th className="px-5 py-3.5 text-center">تعديل سريع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredVariants.map((v) => {
                    const isLow =
                      v.stock_qty < v.min_stock_threshold && v.stock_qty > 0;
                    const isOut = v.stock_qty === 0;

                    const prodNameAr =
                      v.products?.product_translations?.find(
                        (t) => t.locale === 'ar'
                      )?.name;
                    const prodNameFr =
                      v.products?.product_translations?.find(
                        (t) => t.locale === 'fr'
                      )?.name;
                    const prodName =
                      prodNameAr || prodNameFr || v.products?.slug;
                    const prodImg = v.products?.product_images?.[0]?.url;

                    const optionLabels = (v.product_attribute_values || [])
                      .map((pav) => {
                        const opt = pav.attribute_options;
                        const labelAr = opt?.attribute_option_translations?.find(
                          (t) => t.locale === 'ar'
                        )?.label;
                        const labelFr = opt?.attribute_option_translations?.find(
                          (t) => t.locale === 'fr'
                        )?.label;
                        const attrNameAr =
                          opt?.attributes?.attribute_translations?.find(
                            (t) => t.locale === 'ar'
                          )?.name;
                        const label = labelAr || labelFr || opt?.value_slug;
                        return attrNameAr ? `${attrNameAr}: ${label}` : label;
                      })
                      .filter(Boolean);

                    return (
                      <tr
                        key={v.id}
                        className={`transition-colors ${
                          isOut
                            ? 'bg-rose-50/30 hover:bg-rose-50/60'
                            : isLow
                            ? 'bg-amber-50/30 hover:bg-amber-50/60'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Product Image & Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {prodImg ? (
                              <img
                                src={prodImg}
                                alt=""
                                className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">
                                {prodName}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {optionLabels.length > 0 ? (
                                  <span className="inline-flex gap-1 flex-wrap">
                                    {optionLabels.map((l, i) => (
                                      <span
                                        key={i}
                                        className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 text-[10px]"
                                      >
                                        {l}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">
                                    متغير قياسي
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                          {v.sku || '-'}
                        </td>

                        {/* Price */}
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                          {(
                            v.price_override ??
                            v.products?.base_price ??
                            0
                          ).toLocaleString()}{' '}
                          د.ج
                        </td>

                        {/* Min Threshold Input */}
                        <td className="px-5 py-3.5">
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
                              className="w-16 rounded-xl border border-slate-300 px-2 py-1 text-xs text-center font-mono focus:border-indigo-600 focus:outline-none"
                            />
                            <span className="text-[11px] text-slate-400">قطع</span>
                          </div>
                        </td>

                        {/* Stock Qty */}
                        <td className="px-5 py-3.5 font-mono font-black text-sm">
                          <span
                            className={
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }
                          >
                            {v.stock_qty}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 text-[11px] font-bold">
                              <XCircle className="h-3 w-3" />
                              <span>نفذت الكمية</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold animate-pulse">
                              <AlertTriangle className="h-3 w-3" />
                              <span>كمية محدودة (&lt; {v.min_stock_threshold})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>متوفر في المخزن</span>
                            </span>
                          )}
                        </td>

                        {/* Quick Adjust Buttons (+ / -) */}
                        <td className="px-5 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              disabled={v.stock_qty <= 0 || updatingId === v.id}
                              onClick={() =>
                                updateQuantity(v.id, v.stock_qty - 1)
                              }
                              className="h-7 w-7 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center shadow-xs transition-colors"
                              title="إنقاص قطعة واحدة"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-10 text-center font-mono font-bold text-xs text-slate-900">
                              {v.stock_qty}
                            </span>
                            <button
                              type="button"
                              disabled={updatingId === v.id}
                              onClick={() =>
                                updateQuantity(v.id, v.stock_qty + 1)
                              }
                              className="h-7 w-7 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center shadow-xs transition-colors"
                              title="إضافة قطعة واحدة"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE SMART COMPACT CARDS ───────────────────────────── */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredVariants.map((v) => {
                const isLow =
                  v.stock_qty < v.min_stock_threshold && v.stock_qty > 0;
                const isOut = v.stock_qty === 0;

                const prodNameAr =
                  v.products?.product_translations?.find(
                    (t) => t.locale === 'ar'
                  )?.name;
                const prodNameFr =
                  v.products?.product_translations?.find(
                    (t) => t.locale === 'fr'
                  )?.name;
                const prodName =
                  prodNameAr || prodNameFr || v.products?.slug;
                const prodImg = v.products?.product_images?.[0]?.url;

                const optionLabels = (v.product_attribute_values || [])
                  .map((pav) => {
                    const opt = pav.attribute_options;
                    const label =
                      opt?.attribute_option_translations?.find(
                        (t) => t.locale === 'ar'
                      )?.label ||
                      opt?.attribute_option_translations?.find(
                        (t) => t.locale === 'fr'
                      )?.label ||
                      opt?.value_slug;
                    return label;
                  })
                  .filter(Boolean);

                return (
                  <div
                    key={v.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isOut
                        ? 'bg-rose-50/30'
                        : isLow
                        ? 'bg-amber-50/30'
                        : 'bg-white'
                    }`}
                  >
                    {/* Top Row: Product and Stock Status */}
                    <div className="flex items-center gap-3">
                      {prodImg ? (
                        <img
                          src={prodImg}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {prodName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          {optionLabels.join(' • ') || 'متغير قياسي'}
                          {v.sku && (
                            <span className="font-mono text-slate-400">
                              ({v.sku})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Quick Adjustment Bar (>= 44px) */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          الكمية المتوفرة:
                        </span>
                        <span
                          className={`font-mono font-black text-base ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {v.stock_qty} قطع
                        </span>
                      </div>

                      {/* Touch-friendly Stepper */}
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 min-h-[44px]">
                        <button
                          type="button"
                          disabled={v.stock_qty <= 0 || updatingId === v.id}
                          onClick={() => updateQuantity(v.id, v.stock_qty - 1)}
                          className="h-9 w-9 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center shadow-xs"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-mono font-bold text-sm text-slate-900">
                          {v.stock_qty}
                        </span>
                        <button
                          type="button"
                          disabled={updatingId === v.id}
                          onClick={() => updateQuantity(v.id, v.stock_qty + 1)}
                          className="h-9 w-9 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center shadow-xs"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
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
