'use client';

import React from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
  currentCategory?: string;
  locale: string;
  isArabic?: boolean;
}

export function ProductFilters({ categories, currentCategory, locale, isArabic }: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/${locale}/produits`}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-150 ${
          !currentCategory
            ? 'bg-slate-900 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {isArabic ? 'الكل' : 'Tous'}
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/${locale}/produits?category=${cat.slug}`}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-150 ${
            currentCategory === cat.slug
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
