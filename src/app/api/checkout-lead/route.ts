import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const checkoutLeadSchema = z.object({
  phone: z.string().regex(/^0[5-7]\d{8}$/, 'Invalid Algerian phone number'),
  product_id: z.string().uuid().nullable().optional(),
  wilaya_id: z.number().int().positive().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = checkoutLeadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.errors[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const { phone, product_id, wilaya_id } = result.data;

    // Check if lead already exists for this phone + product combo
    const { data: existing } = await supabaseAdmin
      .from('checkout_leads')
      .select('id, contacted')
      .eq('phone', phone)
      .eq('product_id', product_id || '')
      .maybeSingle();

    if (existing) {
      // Update timestamp but don't duplicate
      return NextResponse.json({ id: existing.id, already_exists: true });
    }

    const { data: lead, error } = await supabaseAdmin
      .from('checkout_leads')
      .insert({
        phone,
        product_id: product_id || null,
        wilaya_id: wilaya_id || null,
        contacted: false,
      })
      .select('id')
      .single();

    if (error || !lead) {
      console.error('[POST /api/checkout-lead] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to capture lead', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/checkout-lead] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const contacted = searchParams.get('contacted');

    let query = supabaseAdmin
      .from('checkout_leads')
      .select(`
        id,
        phone,
        product_id,
        wilaya_id,
        created_at,
        contacted
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (contacted === 'false') {
      query = query.eq('contacted', false);
    } else if (contacted === 'true') {
      query = query.eq('contacted', true);
    }

    const { data: leads, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch leads', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(leads || []);
  } catch (err) {
    console.error('[GET /api/checkout-lead] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
