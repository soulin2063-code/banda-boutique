'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export interface TrendingItem {
  id: string;
  slug: string;
  name: string;
  categoryName?: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string;
}

interface TrendingCarouselProps {
  items: TrendingItem[];
  locale: string;
}

export function TrendingCarousel({ items, locale }: TrendingCarouselProps) {
  const isArabic = locale === 'ar';
  const currency = isArabic ? 'د.ج' : 'DA';

  if (!items || items.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#C59B76] animate-pulse" />
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#1A1615]">
            {isArabic ? 'المختارات الأكثر طلباً' : 'Coups de Cœur'}
          </h2>
        </div>
        <Link
          href={`/${locale}/produits`}
          className="text-xs font-bold text-[#8C7F77] hover:text-[#C59B76] transition-colors flex items-center gap-1 group"
        >
          <span>{isArabic ? 'اكتشفي الكل' : 'Découvrir tout'}</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">→</span>
        </Link>
      </div>

      {/* Cards container: swipeable on mobile, 3-column spread on desktop */}
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
        {items.slice(0, 3).map((item, idx) => (
          <div
            key={item.id || item.slug}
            className={`group relative flex-shrink-0 w-[80vw] sm:w-[320px] lg:w-auto snap-center rounded-[30px] overflow-hidden bg-[#FAF7F5] border border-[#EAE1D9] transition-all duration-500 hover:border-[#C59B76]/70 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(212,163,115,0.25)] ${
              idx === 0 ? 'ring-1 ring-[#C59B76]/20' : ''
            }`}
          >
            {/* Image link */}
            <Link
              href={`/${locale}/produits/${item.slug}`}
              className="block relative aspect-[3/4] w-full overflow-hidden bg-[#F5EFEB]"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                loading="lazy"
              />

              {/* Shimmer Sheen Light Sweep on Hover */}
              <div
                className="sheen-overlay pointer-events-none absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[150%] skew-x-[-25deg]"
                aria-hidden="true"
              />

              {/* Top Badges */}
              <div className="absolute top-4 start-4 end-4 flex items-center justify-between pointer-events-none">
                {item.categoryName ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1 text-[11px] font-bold text-[#1A1615] border border-[#EAE1D9]/60 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59B76]" />
                    {item.categoryName}
                  </span>
                ) : <span />}

                <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1615]/80 backdrop-blur-md px-3 py-1 text-[10px] font-semibold text-[#EAE1D9]">
                  <Sparkles className="h-2.5 w-2.5 text-[#C59B76]" />
                  {isArabic ? 'حصري' : 'Exclusive'}
                </span>
              </div>

              {/* Bottom Gradient with warm tint */}
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

              {/* Bottom Content Overlay matching Haute Couture style */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between gap-3 text-white">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug line-clamp-1 drop-shadow-sm group-hover:text-[#FBF4F1] transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-sans text-base sm:text-lg font-extrabold text-[#FBF4F1]">
                      {item.price.toLocaleString()} {currency}
                    </span>
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                      <span className="text-xs text-white/60 line-through">
                        {item.compareAtPrice.toLocaleString()} {currency}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Order Circular Bag Button with Rose-Gold Accent */}
                <div className="flex-shrink-0">
                  <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-[#1A1615] transition-all duration-300 group-hover:bg-[#C59B76] group-hover:text-white group-hover:scale-110 shadow-lg">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
