import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { attributeSchema } from '@/lib/validators/attribute';
import { requireAdmin } from '@/lib/auth/requireAdmin';

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
      .from('attributes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/attributes/[id]] Error:', error);
      return NextResponse.json(
        { error: 'Failed to delete attribute', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/attributes/[id]] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const body = await req.json();
    const result = attributeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Validation error', code: 'VALIDATION_ERROR' },
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

    // 1. Update base attribute
    const { error: attrError } = await supabaseAdmin
      .from('attributes')
      .update({
        slug,
        input_type,
        is_variant_defining,
      })
      .eq('id', id);

    if (attrError) {
      console.error('[PUT /api/attributes/[id]] Attribute update error:', attrError);
      return NextResponse.json(
        { error: 'Failed to update attribute', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // 2. Update translations
    await supabaseAdmin
      .from('attribute_translations')
      .upsert([
        { attribute_id: id, locale: 'ar' as const, name: name_ar },
        { attribute_id: id, locale: 'fr' as const, name: name_fr },
        { attribute_id: id, locale: 'en' as const, name: name_en },
      ]);

    // 3. Sync options
    // Remove options that are no longer present
    const { data: existingOptions } = await supabaseAdmin
      .from('attribute_options')
      .select('id, value_slug, hex_color')
      .eq('attribute_id', id);

    const newOptionSlugs = new Set(options.map((o) => o.value_slug));
    const toDeleteOptionIds = (existingOptions || [])
      .filter((o) => !newOptionSlugs.has(o.value_slug))
      .map((o) => o.id);

    if (toDeleteOptionIds.length > 0) {
      await supabaseAdmin
        .from('attribute_options')
        .delete()
        .in('id', toDeleteOptionIds);
    }

    // Insert or update remaining options
    for (const opt of options) {
      const existing = (existingOptions || []).find((o) => o.value_slug === opt.value_slug);
      let optId = existing?.id;

      if (!optId) {
        const { data: newOpt } = await supabaseAdmin
          .from('attribute_options')
          .insert({
            attribute_id: id,
            value_slug: opt.value_slug,
            hex_color: opt.hex_color || null,
          })
          .select('id')
          .single();
        optId = newOpt?.id;
      } else {
        await supabaseAdmin
          .from('attribute_options')
          .update({
            hex_color: opt.hex_color || null,
          })
          .eq('id', optId);
      }

      if (optId) {
        await supabaseAdmin
          .from('attribute_option_translations')
          .upsert([
            { option_id: optId, locale: 'ar' as const, label: opt.label_ar },
            { option_id: optId, locale: 'fr' as const, label: opt.label_fr },
            { option_id: optId, locale: 'en' as const, label: opt.label_en },
          ]);
      }
    }

    // 4. Sync category associations
    await supabaseAdmin
      .from('category_attributes')
      .delete()
      .eq('attribute_id', id);

    if (category_ids && category_ids.length > 0) {
      await supabaseAdmin
        .from('category_attributes')
        .insert(
          category_ids.map((catId) => ({
            category_id: catId,
            attribute_id: id,
            is_required: false,
          }))
        );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PUT /api/attributes/[id]] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
