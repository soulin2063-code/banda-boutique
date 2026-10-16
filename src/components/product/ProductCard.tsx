'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';

export interface ProductCardProps {
  slug: string;
  name: string;
  categoryName?: string;
  basePrice: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  inStock?: boolean;
  locale?: string;
}

export function ProductCard({
  slug,
  name,
  categoryName,
  basePrice,
  compareAtPrice,
  imageUrl,
  inStock = true,
  locale = 'ar',
}: ProductCardProps) {
  const isArabic = locale === 'ar';
  const currencyLabel = isArabic ? 'د.ج' : 'DA';
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('shopdz_wishlist');
      if (stored) {
        const items = JSON.parse(stored);
        if (Array.isArray(items)) {
          setIsFavorite(items.some((i: any) => i.slug === slug));
        }
      }
    } catch {
      // ignore localStorage error
    }
  }, [slug]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('shopdz_wishlist');
      let items: any[] = [];
      if (stored) {
        try {
          items = JSON.parse(stored);
        } catch {
          items = [];
        }
      }
      if (!Array.isArray(items)) items = [];

      if (isFavorite) {
        items = items.filter((i: any) => i.slug !== slug);
        setIsFavorite(false);
      } else {
        items.push({
          slug,
          name,
          category: categoryName,
          price: basePrice,
          image_url: imageUrl,
        });
        setIsFavorite(true);
      }
      localStorage.setItem('shopdz_wishlist', JSON.stringify(items));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to update wishlist:', err);
    }
  };

  const discountPercent =
    compareAtPrice && compareAtPrice > basePrice
      ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
      : null;

  return (
    <div className="group relative flex flex-col rounded-[26px] sm:rounded-[28px] overflow-hidden bg-[#FAF7F5] border border-[#EAE1D9] transition-all duration-500 ease-out hover:border-[#C59B76]/70 hover:-translate-y-1.5 hover:shadow-[0_18px_38px_-12px_rgba(212,163,115,0.22)]">
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5EFEB]">
        <Link href={`/${locale}/produits/${slug}`} className="block h-full w-full" tabIndex={0}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#8C7F77] text-xs">
              {isArabic ? 'لا توجد صورة' : 'Aucune image'}
            </div>
          )}

          {/* Shimmer Sheen Light Sweep on Card Hover */}
          <div
            className="sheen-overlay pointer-events-none absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-25deg]"
            aria-hidden="true"
          />
        </Link>

        {/* Top Badges & Wishlist */}
        <div className="absolute top-3.5 start-3.5 end-3.5 flex items-start justify-between pointer-events-none">
          <div className="flex flex-col gap-1.5">
            {discountPercent && (
              <span className="inline-flex items-center rounded-full bg-[#1A1615] text-[#FAF7F5] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold shadow-sm border border-white/10">
                -{discountPercent}%
              </span>
            )}
            {!inStock && (
              <span className="inline-flex items-center rounded-full bg-[#be123c] text-white px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium shadow-sm">
                {isArabic ? 'نفذت الكمية' : 'Épuisé'}
              </span>
            )}
          </div>

          {/* Wishlist Button with Heart Pop Animation */}
          <button
            type="button"
            onClick={toggleWishlist}
            className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md transition-all duration-300 border border-[#EAE1D9]/70 hover:scale-110 shadow-sm ${
              isFavorite
                ? 'text-[#be123c] bg-white heart-pop'
                : 'text-[#8C7F77] hover:text-[#be123c] hover:border-[#E4B8AD]'
            }`}
            aria-label={
              isFavorite
                ? isArabic ? 'إزالة من المفضلة' : 'Retirer des favoris'
                : isArabic ? 'إضافة للمفضلة' : 'Ajouter aux favoris'
            }
          >
            <Heart className={`h-4 w-4 transition-transform ${isFavorite ? 'fill-current scale-110' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Info container */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 justify-between">
        <div>
          {categoryName && (
            <p className="mb-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#C59B76]">
              {categoryName}
            </p>
          )}

          <h3 className="font-serif text-sm sm:text-base font-bold text-[#1A1615] line-clamp-1 leading-snug">
            <Link
              href={`/${locale}/produits/${slug}`}
              className="hover:text-[#C59B76] transition-colors duration-200"
            >
              {name}
            </Link>
          </h3>
        </div>

        {/* Price & Quick Order Bag Button */}
        <div className="mt-3.5 pt-3 flex items-center justify-between border-t border-[#EAE1D9]/70">
          <div>
            <span className="font-sans text-base sm:text-lg font-extrabold text-[#1A1615]">
              {basePrice.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-[#8C7F77]">{currencyLabel}</span>
            </span>
            {compareAtPrice && compareAtPrice > basePrice && (
              <span className="block text-xs text-[#8C7F77]/70 line-through">
                {compareAtPrice.toLocaleString()} {currencyLabel}
              </span>
            )}
          </div>

          <Link
            href={`/${locale}/produits/${slug}`}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1A1615] text-[#FAF7F5] transition-all duration-300 hover:bg-[#C59B76] hover:scale-110 shadow-sm"
            aria-label={isArabic ? `طلب ${name}` : `Commander ${name}`}
          >
            <ShoppingBag className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
