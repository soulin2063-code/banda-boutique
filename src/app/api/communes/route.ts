import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const querySchema = z.object({
  wilaya_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawWilayaId = searchParams.get('wilaya_id') || undefined;
    const rawLimit = searchParams.get('limit') || '100';

    const result = querySchema.safeParse({ wilaya_id: rawWilayaId, limit: rawLimit });
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { wilaya_id, limit } = result.data;

    let query = supabaseAdmin
      .from('communes')
      .select('id, wilaya_id, name_ar, name_fr')
      .order('name_fr', { ascending: true })
      .limit(typeof limit === 'number' ? limit : 100);

    if (wilaya_id) {
      query = query.eq('wilaya_id', wilaya_id);
    }

    const { data: communes, error } = await query;

    if (error) {
      console.error('[GET /api/communes] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch communes', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(communes || [], {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('[GET /api/communes] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
