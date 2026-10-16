import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const shipmentSchema = z.object({
  order_id: z.string().uuid('Valid order ID is required'),
  // Yalidine parcel details
  parcel_type: z.enum(['Colis', 'Document']).default('Colis'),
  weight: z.number().min(0.1).default(0.5),
  width: z.number().min(1).optional(),
  length: z.number().min(1).optional(),
  height: z.number().min(1).optional(),
  has_exchange: z.boolean().default(false),
  product_list: z.string().min(1),
  price: z.number().min(0),
  fragile: z.boolean().default(false),
  stop_desk: z.boolean().default(false),
  declared_value: z.number().min(0).optional(),
  from_wilaya_name: z.string().optional().default('Alger'),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const result = shipmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.errors[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR',
          details: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { order_id, ...shipmentData } = result.data;

    // Verify order exists
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        status,
        customers ( full_name, phone ),
        addresses ( wilaya_id, commune_id, address_text, delivery_type )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (order.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Order must be confirmed before creating a shipment', code: 'INVALID_STATUS' },
        { status: 422 }
      );
    }

    // Yalidine API credentials
    const yalidineId = process.env.YALIDINE_API_ID;
    const yalidineToken = process.env.YALIDINE_API_TOKEN;

    if (!yalidineId || !yalidineToken) {
      // Return a mock response if not configured
      console.warn('[POST /api/yalidine-shipment] Yalidine credentials not configured. Returning mock response.');
      return NextResponse.json({
        success: false,
        message: 'Yalidine API not configured. Set YALIDINE_API_ID and YALIDINE_API_TOKEN env vars.',
        order_id,
        order_status: order.status,
      });
    }

    // Get wilaya and commune names for Yalidine
    const addr = order.addresses as { wilaya_id?: number; commune_id?: string; address_text?: string; delivery_type?: string } | null;
    if (!addr) {
      return NextResponse.json(
        { error: 'Order address is missing', code: 'INVALID_DATA' },
        { status: 422 }
      );
    }

    const { data: wilaya } = await supabaseAdmin
      .from('wilayas')
      .select('name_fr, code')
      .eq('id', addr.wilaya_id!)
      .single();

    const { data: commune } = await supabaseAdmin
      .from('communes')
      .select('name_fr')
      .eq('id', addr.commune_id!)
      .single();

    const cust = order.customers as { full_name?: string; phone?: string } | null;

    const yalidinePayload = {
      from_wilaya_name: shipmentData.from_wilaya_name,
      firstname: cust?.full_name?.split(' ')[0] || 'Client',
      familyname: cust?.full_name?.split(' ').slice(1).join(' ') || '',
      contact_phone: cust?.phone || '',
      address: addr.address_text || `${commune?.name_fr || ''}, ${wilaya?.name_fr || ''}`,
      to_commune_name: commune?.name_fr || '',
      to_wilaya_name: wilaya?.name_fr || '',
      product_list: shipmentData.product_list,
      price: shipmentData.price,
      parcel_type: shipmentData.parcel_type,
      weight: shipmentData.weight,
      length: shipmentData.length || 20,
      width: shipmentData.width || 15,
      height: shipmentData.height || 10,
      stop_desk: shipmentData.stop_desk,
      is_stopdesk: addr.delivery_type === 'desk',
      has_exchange: shipmentData.has_exchange,
      fragile: shipmentData.fragile,
      declared_value: shipmentData.declared_value || shipmentData.price,
    };

    // Call Yalidine API
    const yalidineRes = await fetch('https://api.yalidine.app/v1/parcels/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-ID': yalidineId,
        'X-API-TOKEN': yalidineToken,
      },
      body: JSON.stringify([yalidinePayload]),
    });

    const yalidineData = await yalidineRes.json();

    if (!yalidineRes.ok) {
      console.error('[POST /api/yalidine-shipment] Yalidine API error:', yalidineData);
      return NextResponse.json(
        { error: 'Yalidine shipment creation failed', code: 'YALIDINE_ERROR', details: yalidineData },
        { status: 502 }
      );
    }

    // Update order status to 'shipped'
    await supabaseAdmin
      .from('orders')
      .update({ status: 'shipped' })
      .eq('id', order_id);

    await supabaseAdmin.from('order_status_history').insert({
      order_id,
      status: 'shipped',
      changed_by: 'yalidine_api',
    });

    return NextResponse.json({
      success: true,
      yalidine_response: yalidineData,
      order_id,
    });
  } catch (err) {
    console.error('[POST /api/yalidine-shipment] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
