import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { productSchema } from '@/lib/validators/product';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    const isAdmin = auth.ok;

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category_id');

    // Admin can see all statuses if specified, otherwise public only sees 'active'
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
        created_at,
        brand_id,
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
        )
      `)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('status', 'active');
    } else {
      const statusParam = searchParams.get('status');
      if (statusParam && ['draft', 'active', 'archived'].includes(statusParam)) {
        query = query.eq('status', statusParam as 'draft' | 'active' | 'archived');
      }
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('[GET /api/products] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(products || []);
  } catch (err) {
    console.error('[GET /api/products] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.errors[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR',
          details: result.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      slug,
      category_id,
      brand_id,
      base_price,
      compare_at_price,
      status,
      badge,
      is_featured,
      name_ar,
      name_fr,
      name_en,
      description_ar,
      description_fr,
      description_en,
      images,
      variants,
      display_attribute_option_ids,
    } = result.data;

    // 1. Insert product
    const { data: prodData, error: prodError } = await supabaseAdmin
      .from('products')
      .insert({
        slug,
        category_id,
        brand_id: brand_id || null,
        base_price,
        compare_at_price: compare_at_price || null,
        status,
        badge: badge || null,
        is_featured: is_featured || false,
      })
      .select('id')
      .single();

    if (prodError || !prodData) {
      console.error('[POST /api/products] Insert product error:', prodError);
      return NextResponse.json(
        { error: prodError?.message || 'Failed to create product', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    const productId = prodData.id;

    // 2. Insert product translations
    const translations = [
      {
        product_id: productId,
        locale: 'ar' as const,
        name: name_ar,
        description: description_ar || null,
      },
      {
        product_id: productId,
        locale: 'fr' as const,
        name: name_fr,
        description: description_fr || null,
      },
      {
        product_id: productId,
        locale: 'en' as const,
        name: name_en,
        description: description_en || null,
      },
    ];

    const { error: transError } = await supabaseAdmin
      .from('product_translations')
      .insert(translations);

    if (transError) {
      console.error('[POST /api/products] Translation error:', transError);
    }

    // 3. Insert product images
    if (images && images.length > 0) {
      const imgInserts = images.map((img, idx) => ({
        product_id: productId,
        url: img.url,
        position: img.position ?? idx,
        variant_color_option_id: img.variant_color_option_id || null,
      }));

      await supabaseAdmin.from('product_images').insert(imgInserts);
    }

    // 4. Insert variants
    if (variants && variants.length > 0) {
      for (const v of variants) {
        const { data: varData, error: varError } = await supabaseAdmin
          .from('product_variants')
          .insert({
            product_id: productId,
            sku: v.sku || null,
            price_override: v.price_override || null,
            compare_at_price_override: v.compare_at_price_override || null,
            stock_qty: v.stock_qty,
            min_stock_threshold: v.min_stock_threshold,
            cost_price: v.cost_price || null,
          })
          .select('id')
          .single();

        if (varError || !varData) {
          console.error('[POST /api/products] Variant error:', varError);
          continue;
        }

        // Link variant-defining attribute options
        if (v.attribute_option_ids && v.attribute_option_ids.length > 0) {
          const pavInserts = v.attribute_option_ids.map((optId) => ({
            product_id: productId,
            variant_id: varData.id,
            attribute_option_id: optId,
          }));

          await supabaseAdmin.from('product_attribute_values').insert(pavInserts);
        }
      }
    } else {
      // Default single variant
      await supabaseAdmin.from('product_variants').insert({
        product_id: productId,
        sku: `${slug}-default`,
        stock_qty: 10,
        min_stock_threshold: 3,
      });
    }

    // 5. Insert display attribute values
    if (display_attribute_option_ids && display_attribute_option_ids.length > 0) {
      const displayPavs = display_attribute_option_ids.map((optId) => ({
        product_id: productId,
        variant_id: null,
        attribute_option_id: optId,
      }));

      await supabaseAdmin.from('product_attribute_values').insert(displayPavs);
    }

    return NextResponse.json({ id: productId, slug }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/products] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
