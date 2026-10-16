import { supabaseAdmin } from '@/lib/supabase/server';
import { meilisearchClient } from '@/lib/meilisearch';

export interface SearchFilters {
  query?: string;
  locale?: string;
  categorySlug?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  limit?: number;
  offset?: number;
}

export interface SearchProductItem {
  id: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  status: string;
  category_id: string;
  category_name?: string;
  name: string;
  description?: string;
  image_url?: string;
  in_stock: boolean;
  stock_qty: number;
  created_at: string;
}

export interface SearchResult {
  products: SearchProductItem[];
  total: number;
  source: 'meilisearch' | 'postgres_fts';
}

/**
 * Universal search function per §10 & §14.
 * Tries Meilisearch first if configured, with automatic graceful fallback to Postgres FTS.
 */
export async function searchProducts(filters: SearchFilters): Promise<SearchResult> {
  const locale = filters.locale || 'ar';
  const limit = filters.limit || 24;
  const offset = filters.offset || 0;

  // Try Meilisearch first if configured
  if (process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_ADMIN_KEY) {
    try {
      const index = meilisearchClient.index('products');
      const filterConditions: string[] = ["status = 'active'"];

      if (filters.categoryId) {
        filterConditions.push(`category_id = '${filters.categoryId}'`);
      }
      if (filters.brandId) {
        filterConditions.push(`brand_id = '${filters.brandId}'`);
      }
      if (filters.minPrice !== undefined) {
        filterConditions.push(`price >= ${filters.minPrice}`);
      }
      if (filters.maxPrice !== undefined) {
        filterConditions.push(`price <= ${filters.maxPrice}`);
      }
      if (filters.inStockOnly) {
        filterConditions.push('in_stock = true');
      }

      const sortRules: string[] = [];
      if (filters.sort === 'price_asc') sortRules.push('price:asc');
      if (filters.sort === 'price_desc') sortRules.push('price:desc');
      if (filters.sort === 'newest') sortRules.push('created_at:desc');

      const msRes = await index.search(filters.query || '', {
        filter: filterConditions.length > 0 ? filterConditions.join(' AND ') : undefined,
        sort: sortRules.length > 0 ? sortRules : undefined,
        limit,
        offset,
      });

      const formatted: SearchProductItem[] = msRes.hits.map((hit: any) => ({
        id: hit.id,
        slug: hit.slug,
        base_price: hit.price,
        compare_at_price: hit.compare_at_price ?? null,
        status: hit.status,
        category_id: hit.category_id,
        name: hit[`name_${locale}`] || hit.name_ar || hit.name_fr || hit.slug,
        description: hit[`description_${locale}`] || hit.description_fr || '',
        in_stock: hit.in_stock,
        stock_qty: hit.stock_qty || (hit.in_stock ? 5 : 0),
        created_at: hit.created_at || new Date().toISOString(),
      }));

      return {
        products: formatted,
        total: msRes.estimatedTotalHits || formatted.length,
        source: 'meilisearch',
      };
    } catch (msError) {
      console.warn('[searchProducts] Meilisearch query failed, falling back to Postgres FTS:', msError);
    }
  }

  // Postgres Full-Text Search Fallback (§10)
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
      `, { count: 'exact' })
      .eq('status', 'active');

    // Filter by Category
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    // Price filters
    if (filters.minPrice !== undefined) {
      query = query.gte('base_price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('base_price', filters.maxPrice);
    }

    // Sort order
    if (filters.sort === 'price_asc') {
      query = query.order('base_price', { ascending: true });
    } else if (filters.sort === 'price_desc') {
      query = query.order('base_price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: rawProducts, count, error } = await query;

    if (error || !rawProducts) {
      console.error('[searchProducts] Postgres FTS query error:', error);
      return { products: [], total: 0, source: 'postgres_fts' };
    }

    let products: SearchProductItem[] = rawProducts.map((p) => {
      const trans =
        p.product_translations?.find((t) => t.locale === locale) ||
        p.product_translations?.find((t) => t.locale === 'fr') ||
        p.product_translations?.[0];

      const catTrans =
        p.categories?.category_translations?.find((t) => t.locale === locale) ||
        p.categories?.category_translations?.find((t) => t.locale === 'fr');

      const totalStock = (p.product_variants || []).reduce(
        (acc, v) => acc + (v.stock_qty || 0),
        0
      );

      const firstImage = (p.product_images || []).sort(
        (a, b) => a.position - b.position
      )[0]?.url;

      return {
        id: p.id,
        slug: p.slug,
        base_price: p.base_price,
        compare_at_price: p.compare_at_price,
        status: p.status,
        category_id: p.category_id,
        category_name: catTrans?.name || p.categories?.slug,
        name: trans?.name || p.slug,
        description: trans?.description || '',
        image_url: firstImage,
        in_stock: totalStock > 0,
        stock_qty: totalStock,
        created_at: p.created_at,
      };
    });

    // In-memory text matching if query is provided (Postgres FTS fallback)
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.slug.toLowerCase().includes(q)
      );
    }

    // In-stock only filter
    if (filters.inStockOnly) {
      products = products.filter((p) => p.in_stock);
    }

    return {
      products,
      total: count || products.length,
      source: 'postgres_fts',
    };
  } catch (err) {
    console.error('[searchProducts] Search execution error:', err);
    return { products: [], total: 0, source: 'postgres_fts' };
  }
}
