import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { attributeSchema } from '@/lib/validators/attribute';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET() {
  try {
    const { data: attributes, error } = await supabaseAdmin
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
        ),
        category_attributes (
          category_id,
          is_required
        )
      `)
      .order('slug', { ascending: true });

    if (error) {
      console.error('[GET /api/attributes] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attributes', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(attributes || []);
  } catch (err) {
    console.error('[GET /api/attributes] Unexpected error:', err);
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
    const result = attributeSchema.safeParse(body);

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
      input_type,
      is_variant_defining,
      name_ar,
      name_fr,
      name_en,
      options,
      category_ids,
    } = result.data;

    // 1. Insert attribute
    const { data: attrData, error: attrError } = await supabaseAdmin
      .from('attributes')
      .insert({
        slug,
        input_type,
        is_variant_defining,
      })
      .select('id')
      .single();

    if (attrError || !attrData) {
      console.error('[POST /api/attributes] Insert attribute error:', attrError);
      return NextResponse.json(
        { error: attrError?.message || 'Failed to create attribute', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    const attributeId = attrData.id;

    // 2. Insert attribute translations
    const translations = [
      { attribute_id: attributeId, locale: 'ar' as const, name: name_ar },
      { attribute_id: attributeId, locale: 'fr' as const, name: name_fr },
      { attribute_id: attributeId, locale: 'en' as const, name: name_en },
    ];

    const { error: transError } = await supabaseAdmin
      .from('attribute_translations')
      .insert(translations);

    if (transError) {
      console.error('[POST /api/attributes] Translation error:', transError);
    }

    // 3. Insert attribute options & option translations
    if (options && options.length > 0) {
      for (const opt of options) {
        const { data: optData, error: optError } = await supabaseAdmin
          .from('attribute_options')
          .insert({
            attribute_id: attributeId,
            value_slug: opt.value_slug,
            hex_color: opt.hex_color || null,
          })
          .select('id')
          .single();

        if (optError || !optData) {
          console.error('[POST /api/attributes] Option insert error:', optError);
          continue;
        }

        const optTranslations = [
          { option_id: optData.id, locale: 'ar' as const, label: opt.label_ar },
          { option_id: optData.id, locale: 'fr' as const, label: opt.label_fr },
          { option_id: optData.id, locale: 'en' as const, label: opt.label_en },
        ];

        await supabaseAdmin
          .from('attribute_option_translations')
          .insert(optTranslations);
      }
    }

    // 4. Assign to categories via category_attributes
    if (category_ids && category_ids.length > 0) {
      const catAttrs = category_ids.map((catId) => ({
        category_id: catId,
        attribute_id: attributeId,
        is_required: false,
      }));

      const { error: catAttrError } = await supabaseAdmin
        .from('category_attributes')
        .insert(catAttrs);

      if (catAttrError) {
        console.error('[POST /api/attributes] Category assignment error:', catAttrError);
      }
    }

    return NextResponse.json({ id: attributeId, slug }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/attributes] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
