import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

const FALLBACK_FILE = path.join(process.cwd(), 'src', 'data', 'store_settings.json');

const DEFAULT_SETTINGS = {
  store_name: 'Banda Boutique | متجر باندا',
  store_tagline: 'أرقى الحجابات والعبايات والأزياء المحتشمة في الجزائر',
  phone: '0550123456',
  whatsapp: '0550123456',
  instagram: 'banda_boutique_dz',
  facebook: '',
  tiktok: '',
  free_shipping_enabled: true,
  free_shipping_threshold: 10000,
  default_home_delivery_price: 600,
  default_desk_delivery_price: 400,
  checkout_notice: 'الدفع عند الاستلام مع إمكانية فتح الطرد والمعاينة قبل الدفع.',
  announcement_enabled: true,
  announcement_bar: '🌸 مرحباً بكم في متجرنا — شحن متوفر لكافة ولايات الجزائر 58 ولاية مع الدفع عند الاستلام',
};

function getLocalSettings() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const content = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
    }
  } catch (err) {
    console.warn('Could not read local settings fallback:', err);
  }
  return DEFAULT_SETTINGS;
}

function saveLocalSettings(data: any) {
  try {
    const dir = path.dirname(FALLBACK_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save local settings fallback:', err);
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(getLocalSettings());
    }

    return NextResponse.json({ ...DEFAULT_SETTINGS, ...data });
  } catch (err) {
    return NextResponse.json(getLocalSettings());
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cleanSettings = {
      ...DEFAULT_SETTINGS,
      ...body,
      id: 'default',
      updated_at: new Date().toISOString(),
    };

    // Save locally as reliable fallback
    saveLocalSettings(cleanSettings);

    // Try saving to Supabase
    try {
      await supabaseAdmin.from('store_settings').upsert(cleanSettings);
    } catch (e) {
      console.warn('Supabase store_settings upsert error:', e);
    }

    return NextResponse.json({ success: true, settings: cleanSettings });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
