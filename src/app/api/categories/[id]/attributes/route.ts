import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;

    // 1. Get attribute IDs linked to this category
    const { data: catAttrs, error: catAttrError } = await supabaseAdmin
      .from('category_attributes')
      .select('attribute_id, is_required')
      .eq('category_id', categoryId);

    if (catAttrError) {
      console.error('[GET /api/categories/[id]/attributes] Error fetching category_attributes:', catAttrError);
      return NextResponse.json(
        { error: 'Failed to fetch category attributes', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    if (!catAttrs || catAttrs.length === 0) {
      return NextResponse.json([]);
    }

    const attributeIds = catAttrs.map((ca) => ca.attribute_id);

    // 2. Fetch attributes with their translations and options
    const { data: attributes, error: attrError } = await supabaseAdmin
      .from('attributes')
      .select(`
        id,
        slug,
        input_type,
        is_variant_defining,
        attribute_translations (
          locale,
          name
        ),
        attribute_options (
          id,
          value_slug,
          hex_color,
          attribute_option_translations (
            locale,
            label
          )
        )
      `)
      .in('id', attributeIds);

    if (attrError) {
      console.error('[GET /api/categories/[id]/attributes] Error fetching attributes:', attrError);
      return NextResponse.json(
        { error: 'Failed to fetch attributes', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Attach is_required flag
    const result = (attributes || []).map((attr) => {
      const catAttr = catAttrs.find((ca) => ca.attribute_id === attr.id);
      return {
        ...attr,
        is_required: catAttr?.is_required || false,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/categories/[id]/attributes] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
