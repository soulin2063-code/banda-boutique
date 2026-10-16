import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data: wilayas, error } = await supabaseAdmin
      .from('wilayas')
      .select('id, code, name_ar, name_fr')
      .order('id', { ascending: true });

    if (error) {
      console.error('[GET /api/wilayas] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch wilayas', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(wilayas || [], {
      headers: {
        // Cache for 24h since wilayas never change
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('[GET /api/wilayas] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
