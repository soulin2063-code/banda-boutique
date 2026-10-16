'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BackButton } from '@/components/common/BackButton';
import { Heart, Trash2, ArrowRight, ArrowLeft, ShoppingBag, ShoppingCart } from 'lucide-react';

interface WishlistItem {
  slug: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
}

export default function WishlistPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isArabic = locale === 'ar';
  const currency = isArabic ? 'د.ج' : 'DA';

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('shopdz_wishlist');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to read wishlist:', e);
    }
  }, []);

  const removeItem = (slug: string) => {
    const next = items.filter((item) => item.slug !== slug);
    setItems(next);
    try {
      localStorage.setItem('shopdz_wishlist', JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to update wishlist:', e);
    }
  };

  const clearAll = () => {
    setItems([]);
    try {
      localStorage.removeItem('shopdz_wishlist');
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to clear wishlist:', e);
    }
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-400">
        <div className="h-8 w-8 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* Header & BackButton */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <BackButton locale={locale} fallbackUrl={`/${locale}`} />
          <nav className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:text-slate-800">
              {isArabic ? 'الرئيسية' : 'Accueil'}
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900">
              {isArabic ? 'قائمة المفضلة' : 'Mes Favoris'}
            </span>
          </nav>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isArabic ? 'مسح الكل' : 'Vider la liste'}</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3 bg-white">
          <Heart className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
          <h3 className="text-base font-bold text-slate-900">
            {isArabic ? 'قائمة المفضلة فارغة حالياً' : 'Votre liste de favoris est vide'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isArabic
              ? 'تصفح منتجاتنا واضغط على علامة القلب لحفظ المنتجات التي تنال إعجابك.'
              : 'Explorez notre catalogue et cliquez sur le cœur pour sauvegarder vos articles préférés.'}
          </p>
          <div className="pt-2">
            <Link
              href={`/${locale}/produits`}
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {isArabic ? 'تصفح الكتالوج الآن' : 'Découvrir nos produits'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.slug}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors duration-150 ease-out hover:border-slate-300"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                <Link href={`/${locale}/produits/${item.slug}`} className="block h-full w-full">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      {isArabic ? 'لا توجد صورة' : 'Aucune image'}
                    </div>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.slug)}
                  className="absolute top-2 end-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-slate-200/60"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col p-4">
                {item.category && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    {item.category}
                  </span>
                )}
                <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 hover:text-emerald-700 transition-colors">
                  <Link href={`/${locale}/produits/${item.slug}`}>{item.name}</Link>
                </h4>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-base font-bold text-slate-950">
                    {item.price.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={`/${locale}/produits/${item.slug}`}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{isArabic ? 'طلب المنتج' : 'Commander'}</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
