import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { searchProducts } from '@/lib/search';
import { ProductCard } from '@/components/product/ProductCard';
import { BackButton } from '@/components/common/BackButton';
import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; sort?: 'price_asc' | 'price_desc' | 'newest' }>;
}



export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;
  const { q = '', sort } = await searchParams;

  if (!['ar', 'fr', 'en'].includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const isArabic = locale === 'ar';

  const searchResult = await searchProducts({
    query: q,
    locale,
    sort,
    limit: 30,
  });

  // No fallback — show real DB results only
  const productsToRender = searchResult.products;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* BackButton & Header */}
      <div className="flex items-center gap-3">
        <BackButton locale={locale} fallbackUrl={`/${locale}`} />
        <span className="text-xs font-bold text-slate-500">
          {isArabic ? 'البحث في المتجر' : 'Recherche dans la boutique'}
        </span>
      </div>

      {/* Search Header Banner */}
      <div className="rounded-xl bg-slate-900 p-6 sm:p-10 text-white">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isArabic ? 'ما الذي تبحث عنه اليوم؟' : 'Que recherchez-vous ?'}
          </h1>

          {/* Search Form */}
          <form action={`/${locale}/recherche`} method="GET" className="relative flex items-center">
            <Search className="absolute start-4 h-5 w-5 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder={
                isArabic
                  ? 'ابحث باسم المنتج أو الصنف...'
                  : 'Rechercher un produit, une catégorie...'
              }
              className="w-full rounded-xl bg-slate-800 border border-slate-700 py-3 ps-12 pe-24 text-sm text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="absolute end-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {isArabic ? 'بحث' : 'Chercher'}
            </button>
          </form>
        </div>
      </div>

      {/* Results Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-3.5 rounded-xl border border-slate-200">
        <div>
          {q ? (
            <p className="text-xs sm:text-sm font-semibold text-slate-800">
              {isArabic ? 'نتائج البحث عن : ' : 'Résultats pour : '}
              <span className="text-emerald-700 font-bold">&ldquo;{q}&rdquo;</span>
              <span className="text-xs text-slate-500 ms-2">({productsToRender.length} {isArabic ? 'منتج' : 'produits'})</span>
            </p>
          ) : (
            <p className="text-xs font-semibold text-slate-600">
              {isArabic ? 'أحدث المنتجات المقترحة' : 'Produits suggérés'}
            </p>
          )}
        </div>

        {/* Sort Links */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {isArabic ? 'الترتيب :' : 'Trier :'}
          </span>
          <Link
            href={`/${locale}/recherche?q=${encodeURIComponent(q)}&sort=newest`}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              sort === 'newest' || !sort
                ? 'bg-white text-emerald-700 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isArabic ? 'الأحدث' : 'Plus récents'}
          </Link>
          <Link
            href={`/${locale}/recherche?q=${encodeURIComponent(q)}&sort=price_asc`}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              sort === 'price_asc'
                ? 'bg-white text-emerald-700 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isArabic ? 'الأقل سعراً' : 'Prix croissant'}
          </Link>
          <Link
            href={`/${locale}/recherche?q=${encodeURIComponent(q)}&sort=price_desc`}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              sort === 'price_desc'
                ? 'bg-white text-emerald-700 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isArabic ? 'الأعلى سعراً' : 'Prix décroissant'}
          </Link>
        </div>
      </div>

      {/* Grid or Empty State */}
      {productsToRender.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3 bg-white">
          <Search className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h3 className="text-base font-bold text-slate-900">
            {isArabic ? 'لم نتمكن من العثور على أي منتج يطابق بحثك' : 'Aucun produit ne correspond à votre recherche'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isArabic
              ? 'تأكد من كتابة الكلمات بشكل صحيح أو تصفح الأقسام الكاملة في الكتالوج.'
              : 'Vérifiez l’orthographe ou explorez notre catalogue complet.'}
          </p>
          <div className="pt-2">
            <Link
              href={`/${locale}/produits`}
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {isArabic ? 'تصفح كل المنتجات' : 'Voir tout le catalogue'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {productsToRender.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              categoryName={p.category_name}
              basePrice={p.base_price}
              compareAtPrice={p.compare_at_price}
              imageUrl={p.image_url}
              inStock={p.in_stock}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
