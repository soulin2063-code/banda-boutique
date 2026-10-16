import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    let query = supabaseAdmin
      .from('customers')
      .select('id, phone, full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (phone) {
      query = query.eq('phone', phone);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('[GET /api/customers] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customers', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(customers || []);
  } catch (err) {
    console.error('[GET /api/customers] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
