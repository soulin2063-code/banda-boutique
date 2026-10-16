'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { OrderForm } from '@/components/forms/OrderForm';

export interface VariantOptionInfo {
  attribute_name: string;
  value_slug: string;
  label: string;
}

export interface ProductVariantItem {
  id: string;
  sku: string | null;
  price_override: number | null;
  compare_at_price_override: number | null;
  stock_qty: number;
  options: VariantOptionInfo[];
}

interface VariantSelectorProps {
  basePrice: number;
  compareAtPrice: number | null;
  variants: ProductVariantItem[];
  locale: string;
  productSlug: string;
  productId?: string;
  productName?: string;
}

export function VariantSelector({
  basePrice,
  compareAtPrice,
  variants,
  locale,
  productSlug,
  productId,
  productName,
}: VariantSelectorProps) {
  const isArabic = locale === 'ar';
  const currencyLabel = isArabic ? 'د.ج' : 'DA';

  // Default to first variant with stock, or just the first variant
  const initialVariant = variants.find((v) => v.stock_qty > 0) || variants[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantItem | undefined>(initialVariant);
  const [quantity, setQuantity] = useState(1);

  const currentPrice = selectedVariant?.price_override ?? basePrice;
  const currentCompareAt = selectedVariant?.compare_at_price_override ?? compareAtPrice;
  const inStock = (selectedVariant?.stock_qty || 0) > 0;
  const stockQty = selectedVariant?.stock_qty || 0;
  const isLowStock = stockQty <= 3 && stockQty > 0;

  return (
    <div className="space-y-6">
      {/* Price Header */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-black tracking-tight text-slate-950">
          {currentPrice.toLocaleString()} {currencyLabel}
        </span>
        {currentCompareAt && currentCompareAt > currentPrice && (
          <span className="text-base font-semibold text-slate-400 line-through">
            {currentCompareAt.toLocaleString()} {currencyLabel}
          </span>
        )}
      </div>

      {/* Stock status indicator */}
      <div>
        {inStock ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {isLowStock ? (
              <span className="text-amber-700">
                {isArabic ? `كمية محدودة متبقية (${stockQty} قطع فقط)` : `Stock limité (plus que ${stockQty} en stock)`}
              </span>
            ) : (
              <span>{isArabic ? 'متوفر في المخزن، جاهز للشحن السريع' : 'En stock, expédition immédiate'}</span>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span>{isArabic ? 'نفذت الكمية حالياً' : 'Rupture de stock'}</span>
          </div>
        )}
      </div>

      {/* Variants selection buttons */}
      {variants.length > 1 && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {isArabic ? 'اختر الخيار / المقاس :' : 'Sélectionner une option :'}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const optionLabel = v.options.map((o) => o.label).join(' - ') || v.sku || 'Standard';
              const variantHasStock = v.stock_qty > 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariant(v);
                    setQuantity(1);
                  }}
                  className={`min-w-14 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors duration-150 border ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : variantHasStock
                      ? 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-400 line-through opacity-60'
                  }`}
                >
                  {optionLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      {inStock && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {isArabic ? 'الكمية :' : 'Quantité :'}
          </label>
          <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white p-1">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 font-bold flex items-center justify-center"
            >
              -
            </button>
            <span className="w-12 text-center text-sm font-extrabold text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              disabled={quantity >= stockQty}
              onClick={() => setQuantity(Math.min(stockQty, quantity + 1))}
              className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Call to Action: Order Now (Cash on Delivery) */}
      <div className="pt-4 space-y-3">
        {inStock ? (
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('order-form-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 py-3.5 px-6 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            {isArabic ? 'اطلبي الآن، الدفع عند الاستلام' : 'Commander maintenant, paiement à la livraison'}
          </button>
        ) : (
          <button
            disabled
            className="w-full rounded-xl bg-slate-200 py-3.5 px-6 text-sm font-semibold text-slate-400 cursor-not-allowed"
          >
            {isArabic ? 'المنتج غير متوفر حالياً' : 'Produit actuellement indisponible'}
          </button>
        )}

        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
          <span>{isArabic ? 'توصيل لـ 58 ولاية' : 'Livraison 58 wilayas'}</span>
          <span>•</span>
          <span>{isArabic ? 'الدفع نقداً عند الاستلام' : 'Paiement à la livraison'}</span>
          <span>•</span>
          <span>{isArabic ? 'معاينة قبل الدفع' : 'Vérification avant paiement'}</span>
        </div>
      </div>

      {/* Embedded Live Algerian COD Fast Checkout Form */}
      {inStock && selectedVariant && (
        <div className="pt-6">
          <OrderForm
            productId={productId || ''}
            productName={productName || productSlug}
            productSlug={productSlug}
            variantId={selectedVariant.id}
            variantLabel={selectedVariant.options.map((o) => o.label).join(' - ') || selectedVariant.sku || undefined}
            unitPrice={currentPrice}
            quantity={quantity}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}
