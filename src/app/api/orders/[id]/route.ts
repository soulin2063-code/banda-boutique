import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled'] as const;
type OrderStatus = (typeof validStatuses)[number];

const updateOrderSchema = z.object({
  status: z.enum(validStatuses).optional(),
  notes: z.string().optional(),
  confirmed_at: z.string().datetime().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        status,
        subtotal,
        delivery_fee,
        total,
        deposit_paid,
        payment_type,
        notes,
        created_at,
        confirmed_at,
        customers (
          id,
          phone,
          full_name,
          email
        ),
        addresses (
          wilaya_id,
          commune_id,
          address_text,
          delivery_type
        ),
        order_items (
          id,
          quantity,
          unit_price,
          product_variant_id
        ),
        order_status_history (
          id,
          status,
          changed_by,
          changed_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error('[GET /api/orders/[id]] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

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
    const result = updateOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.errors[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const updates: {
      status?: OrderStatus;
      confirmed_at?: string;
      notes?: string;
    } = {};

    if (result.data.status) {
      updates.status = result.data.status;
      if (result.data.status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      }
    }

    if (result.data.notes !== undefined) {
      updates.notes = result.data.notes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'NO_UPDATE' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('[PATCH /api/orders/[id]] DB error:', error);
      return NextResponse.json(
        { error: 'Failed to update order', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Record status change in history
    if (result.data.status) {
      await supabaseAdmin.from('order_status_history').insert({
        order_id: id,
        status: result.data.status,
        changed_by: 'admin',
      });
    }

    return NextResponse.json({ success: true, id, ...updates });
  } catch (err) {
    console.error('[PATCH /api/orders/[id]] Unexpected error:', err);
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

    // Only allow deleting cancelled orders
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', id)
      .single();

    if (order && order.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Only cancelled orders can be deleted', code: 'INVALID_STATUS' },
        { status: 422 }
      );
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete order', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/orders/[id]] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
