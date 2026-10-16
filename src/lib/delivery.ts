import { supabaseAdmin } from '@/lib/supabase/server';

export type CarrierType = 'yalidine' | 'zr_express' | 'maystro' | 'noest' | 'ecotrack';

export interface CourierCredentials {
  api_id: string;
  api_token: string;
  carrier: CarrierType;
}

export interface DeliveryRateResult {
  home_price: number | null;
  desk_price: number | null;
  eta_days: number | null;
  carrier: string;
  source: 'dzship_live' | 'local_table' | 'default_table';
}

export interface CreateShipmentPayload {
  order_id: string;
  customer_name: string;
  phone: string;
  address_text: string;
  wilaya_id: number;
  wilaya_name: string;
  commune_name: string;
  delivery_type: 'home' | 'desk';
  total_price: number;
  product_summary: string;
  weight_kg?: number;
}

const DZSHIP_BASE_URL = 'https://freeship.dzbuild.com';

/**
 * Fetch delivery rates via dzship unified API with local database cache and fallback
 */
export async function getRates(
  carrier: CarrierType = 'yalidine',
  credentials?: { api_id?: string; api_token?: string },
  wilaya_id?: number,
  commune_id?: string
): Promise<DeliveryRateResult> {
  const apiId = credentials?.api_id || process.env.YALIDINE_API_ID || '';
  const apiToken = credentials?.api_token || process.env.YALIDINE_API_TOKEN || '';

  // 1. If credentials and wilaya provided, attempt dzship unified API
  if (apiId && apiToken && wilaya_id) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(`${DZSHIP_BASE_URL}/api/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier,
          credentials: { api_id: apiId, api_token: apiToken },
          wilaya_id,
          commune_id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const liveData = await res.json();
        const homePrice = Number(liveData.home_price) || 600;
        const deskPrice = Number(liveData.desk_price) || 400;
        const etaDays = Number(liveData.eta_days) || 2;

        // Upsert into local delivery_rates cache
        await supabaseAdmin.from('delivery_rates').upsert(
          {
            wilaya_id,
            commune_id: commune_id || null,
            home_price: homePrice,
            desk_price: deskPrice,
            carrier,
            eta_days: etaDays,
          },
          { onConflict: 'wilaya_id,commune_id,carrier' }
        );

        return {
          home_price: homePrice,
          desk_price: deskPrice,
          eta_days: etaDays,
          carrier,
          source: 'dzship_live',
        };
      }
    } catch (e) {
      console.warn('[getRates] dzship API request failed or timed out, falling back to local table:', e);
    }
  }

  // 2. Fallback to local delivery_rates database table
  if (wilaya_id) {
    const { data: localRate } = await supabaseAdmin
      .from('delivery_rates')
      .select('home_price, desk_price, eta_days, carrier')
      .eq('wilaya_id', wilaya_id)
      .maybeSingle();

    if (localRate) {
      return {
        home_price: localRate.home_price,
        desk_price: localRate.desk_price,
        eta_days: localRate.eta_days,
        carrier: localRate.carrier || carrier,
        source: 'local_table',
      };
    }
  }

  // 3. Fallback defaults for Algerian wilayas
  const defaultHome = wilaya_id && wilaya_id === 16 ? 450 : wilaya_id && wilaya_id <= 35 ? 600 : 800;
  const defaultDesk = wilaya_id && wilaya_id === 16 ? 300 : wilaya_id && wilaya_id <= 35 ? 400 : 500;

  return {
    home_price: defaultHome,
    desk_price: defaultDesk,
    eta_days: 2,
    carrier,
    source: 'default_table',
  };
}

/**
 * Create courier parcel shipment via dzship unified API
 */
export async function createShipment(
  carrier: CarrierType = 'yalidine',
  credentials: { api_id: string; api_token: string },
  shipment: CreateShipmentPayload
): Promise<{ success: boolean; tracking_id?: string; carrier: string; raw_response?: any }> {
  try {
    const res = await fetch(`${DZSHIP_BASE_URL}/api/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carrier,
        credentials,
        order: {
          reference: `ORD-${shipment.order_id.slice(0, 8).toUpperCase()}`,
          recipient_name: shipment.customer_name,
          recipient_phone: shipment.phone,
          recipient_address: shipment.address_text,
          to_wilaya_id: shipment.wilaya_id,
          to_wilaya_name: shipment.wilaya_name,
          to_commune_name: shipment.commune_name,
          stop_desk: shipment.delivery_type === 'desk',
          cod_amount: shipment.total_price,
          product_list: shipment.product_summary,
          weight: shipment.weight_kg || 0.5,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        tracking_id: data.tracking_id || data.tracking || data.reference,
        carrier,
        raw_response: data,
      };
    }

    const errData = await res.text();
    console.error('[createShipment] dzship API error:', errData);
    return {
      success: false,
      carrier,
      raw_response: errData,
    };
  } catch (err) {
    console.error('[createShipment] Fatal error:', err);
    return {
      success: false,
      carrier,
      raw_response: String(err),
    };
  }
}
