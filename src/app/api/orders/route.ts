import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createOrderSchema } from '@/lib/validators/order';
import { checkOrderRateLimit } from '@/lib/rateLimit';
import { notifyNewOrder } from '@/lib/telegram';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
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
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled'] as const;
    type OrderStatus = (typeof validStatuses)[number];
    if (status && validStatuses.includes(status as OrderStatus)) {
      query = query.eq('status', status as OrderStatus);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('[GET /api/orders] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(orders || []);
  } catch (err) {
    console.error('[GET /api/orders] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1. Validate body against Zod schema
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        { error: 'Corps de requête invalide', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const validation = createOrderSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.errors[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    // 1b. Honeypot check — البوتات تملأ هذا الحقل المخفي
    // القرار الأمني: إذا كان _hp غير فارغ → بوت → نرفض بهدوء (200 زائف لمنع الـ fingerprinting)
    if (validation.data._hp && validation.data._hp.length > 0) {
      // نعيد 201 زائف لأن البوت لا يحتاج أن يعرف أنه اكتُشف
      return NextResponse.json({ order_id: 'none', status: 'pending' }, { status: 201 });
    }

    const { customer, address, items, payment_type, notes } = validation.data;

    // 2. Rate-limit by phone + IP (§13.4)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateCheck = checkOrderRateLimit(ip, customer.phone);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason || 'Trop de tentatives de commande', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // 3. Verify stock & snapshot unit prices from database (NEVER trust client price)
    const variantIds = items.map((i) => i.product_variant_id);
    const { data: variants, error: varError } = await supabaseAdmin
      .from('product_variants')
      .select(`
        id,
        price_override,
        stock_qty,
        sku,
        product_id,
        products (
          id,
          slug,
          base_price,
          product_translations (
            locale,
            name
          )
        )
      `)
      .in('id', variantIds);

    if (varError || !variants || variants.length === 0) {
      console.error('[POST /api/orders] Failed to fetch variants:', varError);
      return NextResponse.json(
        { error: 'Variantes de produit introuvables', code: 'ITEMS_NOT_FOUND' },
        { status: 404 }
      );
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const unavailableItems: string[] = [];
    let subtotal = 0;
    const itemsToInsert: Array<{
      product_variant_id: string;
      quantity: number;
      unit_price: number;
      name: string;
      current_stock: number;
    }> = [];

    for (const item of items) {
      const v = variantMap.get(item.product_variant_id);
      if (!v) {
        unavailableItems.push(item.product_variant_id);
        continue;
      }

      if (v.stock_qty < item.quantity) {
        unavailableItems.push(item.product_variant_id);
        continue;
      }

      // Snapshot price from variant or product base_price
      const prod = v.products as unknown as {
        id: string;
        slug: string;
        base_price: number;
        product_translations?: Array<{ locale: string; name: string }>;
      } | null;

      const unitPrice =
        typeof v.price_override === 'number' && v.price_override >= 0
          ? v.price_override
          : prod?.base_price ?? 0;

      const prodName =
        prod?.product_translations?.find((t) => t.locale === 'ar')?.name ||
        prod?.product_translations?.find((t) => t.locale === 'fr')?.name ||
        prod?.slug ||
        'Produit';

      subtotal += unitPrice * item.quantity;

      itemsToInsert.push({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        name: prodName,
        current_stock: v.stock_qty,
      });
    }

    if (unavailableItems.length > 0) {
      return NextResponse.json(
        {
          error: 'Certains articles ne sont plus disponibles en quantité suffisante',
          code: 'OUT_OF_STOCK',
          unavailable_items: unavailableItems,
        },
        { status: 409 }
      );
    }

    // 4. Look up delivery fee from delivery_rates
    let deliveryFee = 600; // default baseline for Algeria
    let wilayaNameFr = '';
    let communeNameFr = '';

    const { data: wilaya } = await supabaseAdmin
      .from('wilayas')
      .select('name_fr, name_ar')
      .eq('id', address.wilaya_id)
      .single();

    if (wilaya) {
      wilayaNameFr = wilaya.name_fr;
    }

    if (address.commune_id) {
      const { data: com } = await supabaseAdmin
        .from('communes')
        .select('name_fr')
        .eq('id', address.commune_id)
        .single();
      if (com) communeNameFr = com.name_fr;
    }

    const { data: rateData } = await supabaseAdmin
      .from('delivery_rates')
      .select('home_price, desk_price')
      .eq('wilaya_id', address.wilaya_id)
      .maybeSingle();

    if (rateData) {
      if (address.delivery_type === 'desk' && typeof rateData.desk_price === 'number') {
        deliveryFee = rateData.desk_price;
      } else if (address.delivery_type === 'home' && typeof rateData.home_price === 'number') {
        deliveryFee = rateData.home_price;
      }
    } else {
      // Wilaya standard averages if not specifically configured
      deliveryFee = address.delivery_type === 'desk' ? 450 : 700;
    }

    const total = subtotal + deliveryFee;

    // 5. Upsert Customer by phone
    const { data: dbCustomer, error: custError } = await supabaseAdmin
      .from('customers')
      .upsert(
        {
          phone: customer.phone,
          full_name: customer.full_name,
          email: customer.email || null,
        },
        { onConflict: 'phone' }
      )
      .select('id')
      .single();

    if (custError || !dbCustomer) {
      console.error('[POST /api/orders] Customer upsert error:', custError);
      return NextResponse.json(
        { error: "Échec de l'enregistrement du client", code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // 6. Insert Address
    const { data: dbAddress, error: addrError } = await supabaseAdmin
      .from('addresses')
      .insert({
        customer_id: dbCustomer.id,
        wilaya_id: address.wilaya_id,
        commune_id: address.commune_id,
        address_text: address.address_text || null,
        delivery_type: address.delivery_type,
      })
      .select('id')
      .single();

    if (addrError || !dbAddress) {
      console.error('[POST /api/orders] Address insert error:', addrError);
      return NextResponse.json(
        { error: "Échec de l'enregistrement de l'adresse", code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // 7. Insert Order
    const { data: dbOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: dbCustomer.id,
        address_id: dbAddress.id,
        status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        total,
        deposit_paid: 0,
        payment_type: payment_type || 'cod_full',
        notes: notes || null,
        // confirmation_token يُولَّد تلقائياً من قاعدة البيانات (default encode(gen_random_bytes(32),'hex'))
      })
      .select('id, status, confirmation_token')
      .single();

    if (orderError || !dbOrder) {
      console.error('[POST /api/orders] Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Échec de la création de la commande', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // 8. Insert Order Items
    const orderItemsRows = itemsToInsert.map((item) => ({
      order_id: dbOrder.id,
      product_variant_id: item.product_variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsRows);

    if (itemsError) {
      console.error('[POST /api/orders] Order items error:', itemsError);
    }

    // 9. Decrement stock for each variant
    for (const item of itemsToInsert) {
      const nextStock = Math.max(0, item.current_stock - item.quantity);
      await supabaseAdmin
        .from('product_variants')
        .update({ stock_qty: nextStock })
        .eq('id', item.product_variant_id);
    }

    // 10. Record initial status history
    await supabaseAdmin.from('order_status_history').insert({
      order_id: dbOrder.id,
      status: 'pending',
      changed_by: 'system',
    });

    // 11. Fire-and-forget notification to Telegram (never block order completion)
    notifyNewOrder({
      order_id: dbOrder.id,
      customer_name: customer.full_name,
      phone: customer.phone,
      wilaya_name: `${address.wilaya_id} - ${wilayaNameFr}`,
      commune_name: communeNameFr,
      delivery_type: address.delivery_type,
      items_summary: itemsToInsert.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.unit_price,
      })),
      subtotal,
      delivery_fee: deliveryFee,
      total,
      notes,
    }).catch((e) => console.error('[POST /api/orders] Telegram notification error:', e));

    // 12. Return 201 — نعيد confirmation_token (عشوائي طويل) وليس رقم متسلسل
    // القرار الأمني: confirmation_token يمنع enumeration attacks على صفحة التأكيد
    return NextResponse.json(
      {
        confirmation_token: dbOrder.confirmation_token,
        status: 'pending',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/orders] Fatal error:', err);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
