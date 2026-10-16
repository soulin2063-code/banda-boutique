import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const updateStockSchema = z.object({
  stock_qty: z.number().int().min(0, 'Stock cannot be negative'),
  min_stock_threshold: z.number().int().min(0).optional(),
});

export async function PATCH(
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
    const result = updateStockSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Validation error', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { stock_qty, min_stock_threshold } = result.data;

    const updatePayload: { stock_qty: number; min_stock_threshold?: number } = { stock_qty };
    if (typeof min_stock_threshold === 'number') {
      updatePayload.min_stock_threshold = min_stock_threshold;
    }

    const { error } = await supabaseAdmin
      .from('product_variants')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('[PATCH /api/stock/[id]] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update stock', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, stock_qty });
  } catch (err) {
    console.error('[PATCH /api/stock/[id]] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
