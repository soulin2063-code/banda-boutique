import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { setRequestLocale } from 'next-intl/server';
import { ProductCard } from '@/components/product/ProductCard';
import { BackButton } from '@/components/common/BackButton';
import { SlidersHorizontal, ShoppingBag } from 'lucide-react';

interface ProduitsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    sort?: 'price_asc' | 'price_desc' | 'newest';
    in_stock?: string;
    min_price?: string;
    max_price?: string;
  }>;
}


export default async function ProduitsPage({
  params,
  searchParams,
}: ProduitsPageProps) {
  const { locale } = await params;
  const {
    category: categorySlug,
    sort = 'newest',
    in_stock,
    min_price,
    max_price,
  } = await searchParams;

  if (!['ar', 'fr', 'en'].includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const isArabic = locale === 'ar';

  // 1. Fetch categories
  let categories: any[] = [];
  try {
    const { data } = await supabaseAdmin
      .from('categories')
      .select(`
        id,
        slug,
        category_translations (
          locale,
          name
        )
      `)
      .order('slug', { ascending: true });
    if (data && data.length > 0) categories = data;
  } catch (err) {
    console.warn('[ProduitsPage] Could not fetch categories:', err);
  }

  // 2. Fetch active products with filters
  let products: any[] = [];
  try {
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        slug,
        base_price,
        compare_at_price,
        status,
        category_id,
        created_at,
        categories (
          id,
          slug,
          category_translations (
            locale,
            name
          )
        ),
        product_translations (
          locale,
          name,
          description
        ),
        product_images (
          url,
          position
        ),
        product_variants (
          id,
          stock_qty,
          price_override
        )
      `)
      .eq('status', 'active');

    if (categorySlug && categories.length > 0) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) query = query.eq('category_id', cat.id);
    }

    if (min_price && !isNaN(Number(min_price))) {
      query = query.gte('base_price', Number(min_price));
    }
    if (max_price && !isNaN(Number(max_price))) {
      query = query.lte('base_price', Number(max_price));
    }

    if (sort === 'price_asc') {
      query = query.order('base_price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('base_price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data } = await query;
    if (data && data.length > 0) {
      products = data.map((p) => {
        const totalStock = (p.product_variants || []).reduce(
          (acc: number, v: any) => acc + (v.stock_qty || 0),
          0
        );
        return {
          ...p,
          in_stock: totalStock > 0,
        };
      });
    }
  } catch (err) {
    console.warn('[ProduitsPage] Could not fetch products, using fallback:', err);
  }


  // No fallback — show empty state if DB has no products
  const displayProducts = products;


  const buildFilterUrl = (overrides: Record<string, string | undefined>) => {
    const currentParams = new URLSearchParams();
    if (categorySlug) currentParams.set('category', categorySlug);
    if (sort) currentParams.set('sort', sort);
    if (in_stock) currentParams.set('in_stock', in_stock);
    if (min_price) currentParams.set('min_price', min_price);
    if (max_price) currentParams.set('max_price', max_price);

    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === '') {
        currentParams.delete(k);
      } else {
        currentParams.set(k, v);
      }
    }
    const qStr = currentParams.toString();
    return `/${locale}/produits${qStr ? `?${qStr}` : ''}`;
  };

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
              {isArabic ? 'جميع المنتجات' : 'Tous les Produits'}
            </span>
          </nav>
        </div>

        <span className="text-xs font-bold text-slate-500">
          {displayProducts.length} {isArabic ? 'منتج متوفر' : 'produits disponibles'}
        </span>
      </div>

      {/* Category Pills Bar */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href={buildFilterUrl({ category: undefined })}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors duration-150 ${
              !categorySlug
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isArabic ? 'جميع الأقسام' : 'Toutes les catégories'}
          </Link>
          {categories.map((cat: any) => {
            const catName =
              cat.category_translations?.find((t: any) => t.locale === locale)?.name ||
              cat.category_translations?.find((t: any) => t.locale === 'fr')?.name ||
              cat.slug;
            return (
              <Link
                key={cat.slug}
                href={buildFilterUrl({ category: cat.slug })}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors duration-150 ${
                  categorySlug === cat.slug
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {catName}
              </Link>
            );
          })}
        </div>
      )}

      {/* Sorting & Filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {isArabic ? 'الترتيب :' : 'Trier par :'}
          </span>
          <Link
            href={buildFilterUrl({ sort: 'newest' })}
            className={`rounded-lg px-3 py-1.5 font-semibold text-xs transition-colors ${
              sort === 'newest' || !sort
                ? 'bg-white text-emerald-700 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isArabic ? 'الأحدث' : 'Plus récents'}
          </Link>
          <Link
            href={buildFilterUrl({ sort: 'price_asc' })}
            className={`rounded-lg px-3 py-1.5 font-semibold text-xs transition-colors ${
              sort === 'price_asc'
                ? 'bg-white text-emerald-700 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isArabic ? 'الأقل سعراً' : 'Prix croissant'}
          </Link>
          <Link
            href={buildFilterUrl({ sort: 'price_desc' })}
            className={`rounded-lg px-3 py-1.5 font-semibold text-xs transition-colors ${
              sort === 'price_desc'
                ? 'bg-white text-emerald-700 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isArabic ? 'الأعلى سعراً' : 'Prix décroissant'}
          </Link>
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {displayProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center space-y-4 bg-white">
          <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <h3 className="text-base font-bold text-slate-800">
            {isArabic ? 'لا توجد منتجات في هذا القسم حالياً' : 'Aucun produit disponible pour le moment'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isArabic
              ? 'يعمل فريقنا على إضافة منتجات جديدة، تفقد الصفحة قريباً!'
              : 'Notre équipe travaille à ajouter de nouveaux produits, revenez bientôt !'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {displayProducts.map((p) => {
            const name =
              p.name ||
              p.product_translations?.find((t: any) => t.locale === locale)?.name ||
              p.product_translations?.find((t: any) => t.locale === 'fr')?.name ||
              p.slug;

            const categoryName =
              p.categoryName ||
              p.categories?.category_translations?.find((t: any) => t.locale === locale)?.name ||
              p.categories?.category_translations?.find((t: any) => t.locale === 'fr')?.name ||
              p.categories?.slug;

            const imageUrl = p.imageUrl || p.product_images?.[0]?.url;

            return (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={name}
                categoryName={categoryName}
                basePrice={p.base_price}
                compareAtPrice={p.compare_at_price}
                imageUrl={imageUrl}
                inStock={p.in_stock}
                locale={locale}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
