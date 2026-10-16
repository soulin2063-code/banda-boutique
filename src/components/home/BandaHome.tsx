'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CollectionsCircles,
  CategoryCircleItem,
} from '@/components/home/CollectionsCircles';
import {
  TrendingCarousel,
  TrendingItem,
} from '@/components/home/TrendingCarousel';
import { ProductCard } from '@/components/product/ProductCard';
import { ShieldCheck, Truck, RotateCcw, Sparkles, ArrowRight, ArrowLeft, Heart, CheckCircle2 } from 'lucide-react';

export interface BandaProduct {
  id: string;
  slug: string;
  name: string;
  categorySlug?: string;
  categoryName?: string;
  basePrice: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  inStock?: boolean;
}

interface BandaHomeProps {
  categories: CategoryCircleItem[];
  products: BandaProduct[];
  trendingProducts: TrendingItem[];
  locale: string;
}

export function BandaHome({
  categories,
  products,
  trendingProducts,
  locale,
}: BandaHomeProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const isArabic = locale === 'ar';

  // Filter products by clicked circle category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') {
      return products;
    }
    return products.filter((p) => {
      if (!p.categorySlug) return false;
      return (
        p.categorySlug.toLowerCase() === activeCategory.toLowerCase() ||
        p.categorySlug.toLowerCase().includes(activeCategory.toLowerCase())
      );
    });
  }, [products, activeCategory]);

  const activeCategoryName = useMemo(() => {
    if (activeCategory === 'all') return isArabic ? 'جميع الأقسام' : 'Toutes les collections';
    const found = categories.find((c) => c.slug === activeCategory);
    if (!found) return activeCategory;
    const loc = locale as 'ar' | 'fr' | 'en';
    return found.name[loc] || found.name.ar;
  }, [categories, activeCategory, isArabic, locale]);

  return (
    <div className="flex flex-col gap-10 sm:gap-14 pb-24 md:pb-16 pt-2 sm:pt-4">
      {/* 0. High-Fashion Feminine Luxury Hero Banner */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-gradient-to-br from-[#1A1615] via-[#241C1A] to-[#120F0E] text-[#FAF7F5] border border-[#C59B76]/25 p-7 sm:p-12 lg:p-16 shadow-[0_24px_50px_-15px_rgba(26,22,21,0.35)]">
            {/* Ambient inner glowing orbs */}
            <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#E4B8AD]/30 to-[#C59B76]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -start-24 w-72 h-72 rounded-full bg-gradient-to-tr from-[#C59B76]/25 to-transparent blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-5">
              {/* Luxury Sub-badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1.5 border border-[#C59B76]/30 text-xs font-semibold text-[#E4B8AD] pulse-rose">
                <Sparkles className="h-3.5 w-3.5 text-[#C59B76] animate-pulse" />
                <span>{isArabic ? 'تشكيلة الأناقة والأنوثة الحصرية' : 'Édition Spéciale Féminine 2026'}</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
                {isArabic ? (
                  <>
                    تألّقي بلمسة <span className="bg-gradient-to-r from-[#E4B8AD] via-[#FDF5F2] to-[#C59B76] bg-clip-text text-transparent">أنثوية فاخرة</span> تليق بذوقكِ
                  </>
                ) : (
                  <>
                    Sublimez votre style avec une <span className="bg-gradient-to-r from-[#E4B8AD] via-[#FDF5F2] to-[#C59B76] bg-clip-text text-transparent">élégance pure</span>
                  </>
                )}
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-base text-[#D8CCC3] leading-relaxed max-w-xl font-normal">
                {isArabic
                  ? 'قطع أزياء محتشمة مختارة بعناية فائقة لتبرز جمالكِ الراقي. توصيل مريح لكافة الـ 58 ولاية، وتأكيد الدفع نقداً عند استلام ومعاينة الطرد.'
                  : 'Des créations raffinées et pudiques qui célèbrent votre féminité avec noblesse. Livraison partout en Algérie et paiement à la livraison après vérification.'}
              </p>

              {/* Call-To-Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href={`/${locale}/produits`}
                  className="group relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#C59B76] via-[#D4A373] to-[#E4B8AD] px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-bold text-[#1A1615] overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_25px_rgba(197,155,118,0.4)]"
                >
                  {/* Subtle sheen sweep */}
                  <div className="sheen-overlay pointer-events-none absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-[150%] skew-x-[-25deg]" />
                  <span>{isArabic ? 'تصفحي التشكيلة الآن' : 'Explorer la collection'}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">✦</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('popular-products');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-semibold text-white border border-white/15 transition-all duration-300 hover:border-[#E4B8AD]/40"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#C59B76]" />
                  <span>{isArabic ? 'المنتجات الرائجة' : 'Plus demandés'}</span>
                </button>
              </div>

              {/* Trust Micro-bullets */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] sm:text-xs text-[#EAE1D9]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#C59B76]" />
                  <span>{isArabic ? 'توصيل لـ 58 ولاية' : '58 Wilayas'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#C59B76]" />
                  <span>{isArabic ? 'معاينة الطرد قبل الدفع' : 'Vérification avant paiement'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#C59B76]" />
                  <span>{isArabic ? 'خامات فاخرة ونعومة مريحة' : 'Qualité Haute Couture'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1. COLLECTIONS Circles Filter (Matches Banda screenshot) */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <CollectionsCircles
            categories={categories}
            activeSlug={activeCategory}
            onSelectCategory={(slug) => setActiveCategory(slug)}
            locale={locale}
          />
        </div>
      </section>

      {/* 2. TRENDING NOW Editorial Showcase (Matches Banda screenshot) */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <TrendingCarousel items={trendingProducts} locale={locale} />
        </div>
      </section>

      {/* 3. POPULARS (Filtered by circle category!) */}
      <section id="popular-products" className="px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="mx-auto max-w-7xl space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-baseline gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#C59B76]" />
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#1A1615]">
                  {isArabic ? 'مختارات الأناقة اليومية' : 'Sélection Féminine'}
                </h2>
              </div>
              {activeCategory !== 'all' && (
                <span className="inline-flex items-center rounded-full bg-[#1A1615] text-[#FAF7F5] px-2.5 py-0.5 text-xs font-semibold shadow-sm">
                  {activeCategoryName} ({filteredProducts.length})
                </span>
              )}
            </div>

            {activeCategory !== 'all' ? (
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="text-xs font-bold text-[#8C7F77] hover:text-[#C59B76] underline transition-colors"
              >
                {isArabic ? 'إظهار كل الأقسام' : 'Tout afficher'}
              </button>
            ) : (
              <Link
                href={`/${locale}/produits`}
                className="text-xs font-bold text-[#8C7F77] hover:text-[#C59B76] transition-colors flex items-center gap-1 group"
              >
                <span>{isArabic ? 'عرض كل المنتجات' : 'Voir tout'}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">→</span>
              </Link>
            )}
          </div>

          {/* Product Grid: 2 columns on mobile, 4 columns on desktop */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#EAE1D9] bg-white/70 backdrop-blur-sm p-12 text-center space-y-4">
              <p className="text-sm font-semibold text-[#8C7F77]">
                {isArabic
                  ? 'لا توجد منتجات متوفرة حالياً في هذا القسم'
                  : 'Aucun article actuellement disponible dans cette collection'}
              </p>
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="inline-block rounded-full bg-[#1A1615] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#C59B76] transition-all shadow-md"
              >
                {isArabic ? 'عرض كافة الأقسام' : 'Voir toutes les pièces'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id || p.slug}
                  slug={p.slug}
                  name={p.name}
                  categoryName={p.categoryName}
                  basePrice={p.basePrice}
                  compareAtPrice={p.compareAtPrice}
                  imageUrl={p.imageUrl}
                  inStock={p.inStock}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Algerian Cash on Delivery Trust Bar with Luxury Feminine Touch */}
      <section className="px-4 sm:px-6 lg:px-8 mt-2">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[30px] border border-[#EAE1D9] bg-gradient-to-br from-white/90 via-[#FAF7F5] to-[#FBF4F1] p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-start">
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#EAE1D9] text-[#1A1615] shrink-0 shadow-sm">
                  <Truck className="h-5 w-5 text-[#C59B76]" />
                </div>
                <div>
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#1A1615]">
                    {isArabic ? 'توصيل معتمد لـ 58 ولاية' : 'Livraison express 58 wilayas'}
                  </h4>
                  <p className="text-xs text-[#8C7F77] mt-0.5">
                    {isArabic ? 'شحن سريع ومباشر لباب منزلك أو مقر عملك' : 'À domicile ou au bureau en toute discrétion'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#EAE1D9] text-[#1A1615] shrink-0 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-[#C59B76]" />
                </div>
                <div>
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#1A1615]">
                    {isArabic ? 'افحصي الطرد قبل الدفع' : 'Paiement à la livraison'}
                  </h4>
                  <p className="text-xs text-[#8C7F77] mt-0.5">
                    {isArabic ? 'معاينة القماش والمقاس قبل تسليم المبلغ' : 'Vérifiez la texture et le modèle avant de régler'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#EAE1D9] text-[#1A1615] shrink-0 shadow-sm">
                  <RotateCcw className="h-5 w-5 text-[#C59B76]" />
                </div>
                <div>
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#1A1615]">
                    {isArabic ? 'استبدال بكل سهولة ومحبة' : 'Échange simple et rapide'}
                  </h4>
                  <p className="text-xs text-[#8C7F77] mt-0.5">
                    {isArabic ? 'فريق خدمة زبائن جاهز لمساعدتكِ دائماً' : 'Notre équipe est à votre écoute pour vous conseiller'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
