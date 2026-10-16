import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const createCategorySchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9_-]+$/),
  parent_id: z.string().uuid().nullable().optional(),
  name_ar: z.string().min(1),
  name_fr: z.string().min(1),
  name_en: z.string().min(1),
});

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select(`
        id,
        parent_id,
        slug,
        category_translations (
          locale,
          name
        )
      `)
      .order('slug', { ascending: true });

    if (error) {
      console.error('[GET /api/categories] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(categories || []);
  } catch (err) {
    console.error('[GET /api/categories] Unexpected error:', err);
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
    const result = createCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { slug, parent_id, name_ar, name_fr, name_en } = result.data;

    // 1. Insert category
    const { data: catData, error: catError } = await supabaseAdmin
      .from('categories')
      .insert({
        slug,
        parent_id: parent_id || null,
      })
      .select('id')
      .single();

    if (catError || !catData) {
      console.error('[POST /api/categories] Category insert error:', catError);
      return NextResponse.json(
        { error: catError?.message || 'Failed to create category', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // 2. Insert translations
    const translations = [
      { category_id: catData.id, locale: 'ar' as const, name: name_ar },
      { category_id: catData.id, locale: 'fr' as const, name: name_fr },
      { category_id: catData.id, locale: 'en' as const, name: name_en },
    ];

    const { error: transError } = await supabaseAdmin
      .from('category_translations')
      .insert(translations);

    if (transError) {
      console.error('[POST /api/categories] Translation insert error:', transError);
      return NextResponse.json(
        { error: 'Failed to create category translations', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: catData.id, slug }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/categories] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
