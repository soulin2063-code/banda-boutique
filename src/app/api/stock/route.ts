import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { data: variants, error } = await supabaseAdmin
      .from('product_variants')
      .select(`
        id,
        sku,
        stock_qty,
        min_stock_threshold,
        price_override,
        cost_price,
        products (
          id,
          slug,
          base_price,
          status,
          product_translations (
            locale,
            name
          ),
          product_images (
            url,
            position
          )
        ),
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
      `)
      .order('stock_qty', { ascending: true });

    if (error) {
      console.error('[GET /api/stock] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stock', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(variants || []);
  } catch (err) {
    console.error('[GET /api/stock] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
