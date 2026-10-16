import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { setRequestLocale } from 'next-intl/server';
import { BandaHome, BandaProduct } from '@/components/home/BandaHome';
import { CategoryCircleItem } from '@/components/home/CollectionsCircles';
import { TrendingItem } from '@/components/home/TrendingCarousel';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!['ar', 'fr', 'en'].includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // Fetch Categories and Products in parallel (2x faster)
  let categories: CategoryCircleItem[] = [];
  let productsList: BandaProduct[] = [];

  try {
    const [catsRes, prodsRes] = await Promise.all([
      supabaseAdmin
        .from('categories')
        .select(`
          id,
          slug,
          category_translations ( locale, name )
        `)
        .order('slug', { ascending: true }),
      supabaseAdmin
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
            category_translations ( locale, name )
          ),
          product_translations ( locale, name ),
          product_images ( url, position ),
          product_variants ( id, stock_qty )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
    ]);

    const dbCats = catsRes.data;
    if (dbCats && dbCats.length > 0) {
      categories = dbCats.map((c) => {
        const arName = c.category_translations?.find((t: { locale: string; name: string }) => t.locale === 'ar')?.name || c.slug;
        const frName = c.category_translations?.find((t: { locale: string; name: string }) => t.locale === 'fr')?.name || c.slug;
        const enName = c.category_translations?.find((t: { locale: string; name: string }) => t.locale === 'en')?.name || c.slug;
        return {
          id: c.id,
          slug: c.slug,
          name: { ar: arName, fr: frName, en: enName },
          imageUrl: undefined,
        };
      });
    }

    const dbProds = prodsRes.data;
    if (dbProds && dbProds.length > 0) {
      productsList = dbProds.map((p) => {
        const name =
          p.product_translations?.find((t: { locale: string; name: string }) => t.locale === locale)?.name ||
          p.product_translations?.find((t: { locale: string; name: string }) => t.locale === 'fr')?.name ||
          p.slug;

        const catData = p.categories as { category_translations?: { locale: string; name: string }[]; slug?: string } | null;
        const categoryName =
          catData?.category_translations?.find((t) => t.locale === locale)?.name ||
          catData?.category_translations?.find((t) => t.locale === 'fr')?.name ||
          catData?.slug;

        const sortedImages = [...(p.product_images || [])].sort(
          (a: { position: number }, b: { position: number }) => a.position - b.position
        );
        const imageUrl = sortedImages[0]?.url || undefined;

        const totalStock = (p.product_variants || []).reduce(
          (acc: number, v: { stock_qty?: number }) => acc + (v.stock_qty || 0),
          0
        );

        return {
          id: p.id,
          slug: p.slug,
          name,
          categorySlug: catData?.slug,
          categoryName,
          basePrice: p.base_price,
          compareAtPrice: p.compare_at_price,
          imageUrl,
          inStock: totalStock > 0,
        };
      });
    }
  } catch (err) {
    console.warn('[HomePage] Could not fetch products from DB:', err);
  }

  // 3. Trending — first 3 products with images
  const trendingItems: TrendingItem[] = productsList
    .filter((p) => !!p.imageUrl)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      categoryName: p.categoryName,
      price: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      imageUrl: p.imageUrl || '',
    }));

  return (
    <main>
      <BandaHome
        categories={categories}
        products={productsList}
        trendingProducts={trendingItems}
        locale={locale}
      />
    </main>
  );
}

