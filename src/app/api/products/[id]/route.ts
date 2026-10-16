import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    const isAdmin = auth.ok;

    const { id } = await params;

    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        slug,
        base_price,
        compare_at_price,
        status,
        badge,
        is_featured,
        category_id,
        brand_id,
        product_translations (
          locale,
          name,
          description
        ),
        product_images (
          id,
          url,
          position,
          variant_color_option_id
        ),
        product_variants (
          id,
          sku,
          price_override,
          compare_at_price_override,
          stock_qty,
          product_attribute_values (
            attribute_option_id
          )
        ),
        product_attribute_values (
          id,
          variant_id,
          attribute_option_id
        )
      `)
      .eq('id', id);

    if (!isAdmin) {
      query = query.eq('status', 'active');
    }

    const { data: product, error } = await query.maybeSingle();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error('[GET /api/products/[id]] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/products/[id]] Error:', error);
      return NextResponse.json(
        { error: 'Failed to delete product', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/products/[id]] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
