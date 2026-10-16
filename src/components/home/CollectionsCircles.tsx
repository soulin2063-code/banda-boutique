'use client';

import React from 'react';
import Image from 'next/image';

export interface CategoryCircleItem {
  id: string;
  slug: string;
  name: {
    ar: string;
    fr: string;
    en: string;
  };
  imageUrl?: string;
}

interface CollectionsCirclesProps {
  categories: CategoryCircleItem[];
  activeSlug: string;
  onSelectCategory: (slug: string) => void;
  locale: string;
}

export function CollectionsCircles({
  categories,
  activeSlug,
  onSelectCategory,
  locale,
}: CollectionsCirclesProps) {
  const isArabic = locale === 'ar';
  const loc = locale as 'ar' | 'fr' | 'en';

  const allItem: CategoryCircleItem = {
    id: 'all',
    slug: 'all',
    name: {
      ar: 'الكل',
      fr: 'Tout',
      en: 'All',
    },
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
  };

  const list = [allItem, ...categories];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-[#141414]">
          {isArabic ? 'الأقسام' : 'Collections'}
        </h2>
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className="text-xs font-semibold text-[#8A8275] hover:text-[#141414] transition-colors"
        >
          {isArabic ? 'عرض الكل' : 'See All'}
        </button>
      </div>

      {/* Horizontal scrollable circles */}
      <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
        {list.map((cat) => {
          const isActive = activeSlug === cat.slug;
          const label = cat.name[loc] || cat.name.ar;

          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className="group flex flex-col items-center flex-shrink-0 cursor-pointer snap-start focus:outline-none"
              aria-label={label}
            >
              {/* Circle Avatar with Rose-Gold Glow */}
              <div
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 transition-all duration-300 ease-out ${
                  isActive
                    ? 'ring-2 ring-[#C59B76] ring-offset-2 ring-offset-[#FAF7F5] scale-105 shadow-[0_0_18px_rgba(228,184,173,0.5)]'
                    : 'ring-1 ring-[#EAE1D9] hover:ring-[#C59B76]/70 hover:scale-105'
                }`}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden bg-[#FBF4F1] flex items-center justify-center">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={label}
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-115"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FBF4F1] to-[#EAE1D9] text-[#1A1615] font-serif font-bold text-xs sm:text-sm">
                      {label.slice(0, 2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs sm:text-sm font-bold tracking-tight transition-colors duration-200 ${
                  isActive ? 'text-[#1A1615]' : 'text-[#8C7F77] group-hover:text-[#1A1615]'
                }`}
              >
                {label}
              </span>

              {/* Active Indicator Underline with Rose-Gold Gradient */}
              <div
                className={`h-0.5 rounded-full transition-all duration-300 mt-1 ${
                  isActive ? 'w-6 bg-gradient-to-r from-[#C59B76] to-[#E4B8AD]' : 'w-0 bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
