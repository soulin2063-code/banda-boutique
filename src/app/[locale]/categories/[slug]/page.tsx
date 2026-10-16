import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { setRequestLocale } from 'next-intl/server';
import { ProductCard } from '@/components/product/ProductCard';
import { Package } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params;

  if (!['ar', 'fr', 'en'].includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const isArabic = locale === 'ar';

  // 1. Fetch category by slug
  const { data: category, error: catError } = await supabaseAdmin
    .from('categories')
    .select(`
      id,
      slug,
      parent_id,
      category_translations (
        locale,
        name
      )
    `)
    .eq('slug', slug)
    .single();

  if (catError || !category) {
    notFound();
  }

  const categoryName =
    category.category_translations?.find((t) => t.locale === locale)?.name ||
    category.category_translations?.find((t) => t.locale === 'fr')?.name ||
    category.slug;

  // 2. Fetch products in this category
  const { data: products } = await supabaseAdmin
    .from('products')
    .select(`
      id,
      slug,
      base_price,
      compare_at_price,
      status,
      product_translations (
        locale,
        name
      ),
      product_images (
        url,
        position
      ),
      product_variants (
        id,
        stock_qty
      )
    `)
    .eq('category_id', category.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link href={`/${locale}`} className="hover:text-slate-800">
          {isArabic ? 'الرئيسية' : 'Accueil'}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/produits`} className="hover:text-slate-800">
          {isArabic ? 'المنتجات' : 'Produits'}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{categoryName}</span>
      </nav>

      {/* Category Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
          {categoryName}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isArabic
            ? `استكشف جميع منتجات قسم ${categoryName} المتاحة للشحن السريع.`
            : `Découvrez tous les articles de la catégorie ${categoryName} disponibles pour expédition immédiate.`}
        </p>
      </div>

      {/* Product Grid */}
      {!products || products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Package className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h3 className="text-base font-bold text-slate-900">
            {isArabic ? 'لا توجد منتجات في هذا القسم بعد' : 'Aucun produit dans cette catégorie'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isArabic
              ? 'تفضل بزيارة الكتالوج العام لاكتشاف المنتجات الأخرى.'
              : 'Consultez notre catalogue général pour découvrir d’autres produits.'}
          </p>
          <div className="pt-2">
            <Link
              href={`/${locale}/produits`}
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {isArabic ? 'تصفح جميع المنتجات' : 'Voir tous les produits'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const pName =
              p.product_translations?.find((t) => t.locale === locale)?.name ||
              p.product_translations?.find((t) => t.locale === 'fr')?.name ||
              p.slug;

            const pImage = p.product_images?.[0]?.url;
            const totalStock = (p.product_variants || []).reduce(
              (acc, v) => acc + (v.stock_qty || 0),
              0
            );

            return (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={pName}
                categoryName={categoryName}
                basePrice={p.base_price}
                compareAtPrice={p.compare_at_price}
                imageUrl={pImage}
                inStock={totalStock > 0}
                locale={locale}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
