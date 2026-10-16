import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
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

    // 1. Delete translations
    await supabaseAdmin
      .from('category_translations')
      .delete()
      .eq('category_id', id);

    // 2. Delete category attributes link
    await supabaseAdmin
      .from('category_attributes')
      .delete()
      .eq('category_id', id);

    // 3. Delete category
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/categories/[id]] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete category', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/categories/[id]] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
