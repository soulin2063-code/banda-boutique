import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { setRequestLocale } from 'next-intl/server';
import { ProductGallery } from '@/components/product/ProductGallery';
import { VariantSelector } from '@/components/product/VariantSelector';
import { ProductCard } from '@/components/product/ProductCard';
import { BackButton } from '@/components/common/BackButton';
import { Truck, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}



export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `${slug} | ShopDZ`,
    description: `توصيل متوفر لـ 58 ولاية والدفع عند الاستلام بعد المعاينة`,
    openGraph: {
      title: slug,
      images: [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;

  if (!['ar', 'fr', 'en'].includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const isArabic = locale === 'ar';

  let product: any = null;
  let productName = '';
  let productDescription = '';
  let categoryName = '';
  let images: any[] = [];
  let formattedVariants: any[] = [];
  let basePrice = 0;
  let compareAtPrice: number | null = null;
  let productId = '';

  // 1. Try fetching from DB
  try {
    const { data } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        slug,
        base_price,
        compare_at_price,
        status,
        category_id,
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
          sku,
          price_override,
          compare_at_price_override,
          stock_qty,
          min_stock_threshold,
          product_attribute_values (
            attribute_options (
              value_slug,
              attribute_option_translations (
                locale,
                label
              ),
              attributes (
                slug,
                attribute_translations (
                  locale,
                  name
                )
              )
            )
          )
        )
      `)
      .eq('slug', slug)
      .single();

    if (data) {
      product = data;
      productId = product.id;
      basePrice = product.base_price;
      compareAtPrice = product.compare_at_price;

      productName =
        product.product_translations?.find((t: any) => t.locale === locale)?.name ||
        product.product_translations?.find((t: any) => t.locale === 'fr')?.name ||
        product.slug;

      productDescription =
        product.product_translations?.find((t: any) => t.locale === locale)?.description ||
        product.product_translations?.find((t: any) => t.locale === 'fr')?.description ||
        '';

      categoryName =
        product.categories?.category_translations?.find((t: any) => t.locale === locale)?.name ||
        product.categories?.category_translations?.find((t: any) => t.locale === 'fr')?.name ||
        product.categories?.slug || '';

      images = (product.product_images || []).sort((a: any, b: any) => a.position - b.position);

      formattedVariants = (product.product_variants || []).map((v: any) => {
        const options = (v.product_attribute_values || []).map((pav: any) => {
          const opt = pav.attribute_options;
          const attrName =
            opt?.attributes?.attribute_translations?.find((t: any) => t.locale === locale)?.name ||
            opt?.attributes?.slug ||
            '';
          const label =
            opt?.attribute_option_translations?.find((t: any) => t.locale === locale)?.label ||
            opt?.value_slug ||
            '';

          return {
            attribute_name: attrName,
            value_slug: opt?.value_slug || '',
            label,
          };
        });

        return {
          id: v.id,
          sku: v.sku,
          price_override: v.price_override,
          compare_at_price_override: v.compare_at_price_override,
          stock_qty: v.stock_qty,
          options,
        };
      });
    }
  } catch (err) {
    console.warn('[ProductDetailPage] DB query error, using fallback:', err);
  }

  // If product not found in DB, return 404
  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-10">
      {/* Navigation Header with BackButton */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <BackButton locale={locale} fallbackUrl={`/${locale}/produits`} />
          <nav className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:text-slate-800">
              {isArabic ? 'الرئيسية' : 'Accueil'}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/produits`} className="hover:text-slate-800">
              {isArabic ? 'المنتجات' : 'Produits'}
            </Link>
            {categoryName && (
              <>
                <span>/</span>
                <span className="text-slate-600 font-medium">{categoryName}</span>
              </>
            )}
          </nav>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
          <Truck className="h-3.5 w-3.5" />
          <span>{isArabic ? 'توصيل متوفر لجميع الـ 58 ولاية' : 'Livraison sur 58 Wilayas'}</span>
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14 items-start">
        {/* Gallery */}
        <div className="sticky top-24">
          <ProductGallery images={images} productName={productName} />

          {/* Trust Guarantees Box below gallery */}
          <div className="mt-6 rounded-3xl bg-slate-100/80 border border-slate-200/80 p-5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              {isArabic ? 'ضمانات المتجر والتوصيل :' : 'Nos Garanties :'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{isArabic ? 'معاينة الطرد قبل الدفع' : 'Vérification avant paiement'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{isArabic ? 'شحن سريع لباب منزلك' : 'Livraison express à domicile'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{isArabic ? 'منتج أصلي ومضمون 100%' : 'Produit 100% Authentique'}</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{isArabic ? 'إمكانية الاستبدال السريع' : 'Échange facile & rapide'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Fast COD Order Form */}
        <div className="space-y-6">
          <div>
            {categoryName && (
              <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg mb-2">
                {categoryName}
              </span>
            )}
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight">
              {productName}
            </h1>
          </div>

          {/* Variant Selector and Instant Order Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
            <VariantSelector
              basePrice={basePrice}
              compareAtPrice={compareAtPrice}
              variants={formattedVariants}
              locale={locale}
              productSlug={slug}
              productId={productId}
              productName={productName}
            />
          </div>

          {/* Description */}
          {productDescription && (
            <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-8 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {isArabic ? 'تفاصيل ومميزات المنتج' : 'Description du Produit'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {productDescription}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
