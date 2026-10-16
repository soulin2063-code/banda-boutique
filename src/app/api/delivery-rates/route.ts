import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const querySchema = z.object({
  wilaya_id: z.string().regex(/^\d+$/).transform(Number),
  commune_id: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawWilayaId = searchParams.get('wilaya_id');
    const rawCommuneId = searchParams.get('commune_id') || undefined;

    if (!rawWilayaId) {
      return NextResponse.json(
        { error: 'wilaya_id is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const result = querySchema.safeParse({
      wilaya_id: rawWilayaId,
      commune_id: rawCommuneId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid parameters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { wilaya_id, commune_id } = result.data;

    // Build query — start with wilaya-level rates
    let query = supabaseAdmin
      .from('delivery_rates')
      .select('id, wilaya_id, commune_id, home_price, desk_price, carrier, eta_days')
      .eq('wilaya_id', wilaya_id)
      .order('commune_id', { ascending: true, nullsFirst: false });

    // If commune specified, filter to commune-specific + wilaya-wide rates
    if (commune_id) {
      query = query.or(`commune_id.eq.${commune_id},commune_id.is.null`);
    } else {
      query = query.is('commune_id', null);
    }

    const { data: rates, error } = await query;

    if (error) {
      console.error('[GET /api/delivery-rates] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch delivery rates', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Also fetch the wilaya info
    const { data: wilaya } = await supabaseAdmin
      .from('wilayas')
      .select('id, code, name_ar, name_fr')
      .eq('id', wilaya_id)
      .single();

    const primaryRate =
      rates?.find((r) => commune_id && r.commune_id === commune_id) ||
      rates?.find((r) => !r.commune_id) ||
      null;

    const defaultHome = wilaya_id === 16 ? 450 : wilaya_id <= 35 ? 600 : 800;
    const defaultDesk = wilaya_id === 16 ? 300 : wilaya_id <= 35 ? 400 : 500;

    return NextResponse.json({
      home_price: primaryRate?.home_price ?? defaultHome,
      desk_price: primaryRate?.desk_price ?? defaultDesk,
      eta_days: primaryRate?.eta_days ?? 2,
      source: 'local_table',
      wilaya: wilaya || null,
      rates: rates || [],
      count: rates?.length || 0,
    });
  } catch (err) {
    console.error('[GET /api/delivery-rates] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();

    const rateSchema = z.object({
      wilaya_id: z.number().int().positive(),
      commune_id: z.string().uuid().nullable().optional(),
      home_price: z.number().min(0).nullable().optional(),
      desk_price: z.number().min(0).nullable().optional(),
      carrier: z.string().min(1).default('internal'),
      eta_days: z.number().int().positive().nullable().optional(),
    });

    const result = rateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Validation error', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { wilaya_id, commune_id, home_price, desk_price, carrier, eta_days } = result.data;

    const { data: rate, error } = await supabaseAdmin
      .from('delivery_rates')
      .upsert(
        {
          wilaya_id,
          commune_id: commune_id || null,
          home_price: home_price ?? null,
          desk_price: desk_price ?? null,
          carrier,
          eta_days: eta_days ?? null,
        },
        { onConflict: 'wilaya_id,commune_id' }
      )
      .select('id')
      .single();

    if (error) {
      console.error('[PUT /api/delivery-rates] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update delivery rate', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: rate?.id, success: true });
  } catch (err) {
    console.error('[PUT /api/delivery-rates] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
