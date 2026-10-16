import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const syncRequestSchema = z.object({
  product_id: z.string().uuid().optional(),
  full_sync: z.boolean().optional().default(false),
});

// Build a Meilisearch-ready document from raw product data
function buildSearchDocument(product: {
  id: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  status: string;
  product_translations?: Array<{ locale: string; name: string; description: string | null }>;
  product_images?: Array<{ url: string; position: number }>;
  categories?: {
    slug: string;
    category_translations?: Array<{ locale: string; name: string }>;
  } | null;
}) {
  const nameAr = product.product_translations?.find((t) => t.locale === 'ar')?.name || '';
  const nameFr = product.product_translations?.find((t) => t.locale === 'fr')?.name || '';
  const nameEn = product.product_translations?.find((t) => t.locale === 'en')?.name || '';
  const descFr = product.product_translations?.find((t) => t.locale === 'fr')?.description || '';
  const imageUrl = product.product_images?.sort((a, b) => a.position - b.position)[0]?.url || null;

  return {
    id: product.id,
    slug: product.slug,
    base_price: product.base_price,
    compare_at_price: product.compare_at_price,
    status: product.status,
    name_ar: nameAr,
    name_fr: nameFr,
    name_en: nameEn,
    description_fr: descFr,
    image_url: imageUrl,
    category_slug: product.categories?.slug || null,
    search_text: [nameAr, nameFr, nameEn, descFr].filter(Boolean).join(' '),
  };
}

export async function POST(req: Request) {
  try {
    // 1. Authorize: either via X-Sync-Secret or via requireAdmin
    const syncSecret = req.headers.get('x-sync-secret');
    const hasValidSecret = process.env.SEARCH_SYNC_SECRET && syncSecret === process.env.SEARCH_SYNC_SECRET;

    if (!hasValidSecret) {
      const auth = await requireAdmin(req);
      if (!auth.ok) {
        return auth.response;
      }
    }

    const body = await req.json().catch(() => ({}));
    const result = syncRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { product_id, full_sync } = result.data;

    // Build query for products
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        slug,
        base_price,
        compare_at_price,
        status,
        product_translations (
          locale,
          name,
          description
        ),
        product_images (
          url,
          position
        ),
        categories (
          slug,
          category_translations (
            locale,
            name
          )
        )
      `)
      .eq('status', 'active');

    if (product_id && !full_sync) {
      query = query.eq('id', product_id);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('[POST /api/search-sync] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    const documents = (products || []).map(buildSearchDocument);

    // Try to sync to Meilisearch if configured
    if (process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_API_KEY) {
      try {
        const { meilisearchClient } = await import('@/lib/meilisearch');
        const index = meilisearchClient.index('products');
        await index.addDocuments(documents, { primaryKey: 'id' });

        return NextResponse.json({
          synced: documents.length,
          backend: 'meilisearch',
        });
      } catch (meiliErr) {
        console.error('[POST /api/search-sync] Meilisearch error:', meiliErr);
        // Fall through to return documents count
      }
    }

    // If Meilisearch not configured, return the documents for debugging
    return NextResponse.json({
      synced: documents.length,
      backend: 'none',
      message: 'No search backend configured. Set MEILISEARCH_HOST and MEILISEARCH_API_KEY.',
      sample: documents.slice(0, 2),
    });
  } catch (err) {
    console.error('[POST /api/search-sync] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
