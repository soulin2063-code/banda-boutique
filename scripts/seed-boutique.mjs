import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf-8');
} catch (e) {
  console.error('Could not read .env.local');
}

const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function seed() {
  console.log('🌸 Starting Hijab & Abaya boutique seed...');

  // 1. Categories
  const categories = [
    {
      slug: 'hijabs',
      translations: [
        { locale: 'ar', name: 'حجابات وشالات' },
        { locale: 'fr', name: 'Hijabs & Châles' },
        { locale: 'en', name: 'Hijabs & Scarves' },
      ],
    },
    {
      slug: 'abayas',
      translations: [
        { locale: 'ar', name: 'عبايات إسلامية فاخرة' },
        { locale: 'fr', name: 'Abayas Modernes & Orientales' },
        { locale: 'en', name: 'Luxury Abayas' },
      ],
    },
    {
      slug: 'dresses',
      translations: [
        { locale: 'ar', name: 'فساتين وجلابيات محتشمة' },
        { locale: 'fr', name: 'Robes & Jalabiyas' },
        { locale: 'en', name: 'Modest Dresses' },
      ],
    },
    {
      slug: 'accessories',
      translations: [
        { locale: 'ar', name: 'نقاب، بونيهات وإكسسوارات' },
        { locale: 'fr', name: 'Niqabs, Bonnets & Accessoires' },
        { locale: 'en', name: 'Niqabs & Hijab Accessories' },
      ],
    },
    {
      slug: 'prayer-sets',
      translations: [
        { locale: 'ar', name: 'إسدالات وأطقم صلاة' },
        { locale: 'fr', name: 'Ensembles & Tenues de Prière' },
        { locale: 'en', name: 'Prayer Sets' },
      ],
    },
  ];

  const catMap = {};

  for (const cat of categories) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', cat.slug)
      .maybeSingle();

    let catId = existing?.id;
    if (!catId) {
      const { data: inserted, error } = await supabase
        .from('categories')
        .insert({ slug: cat.slug })
        .select('id')
        .single();
      if (error) {
        console.error(`Error inserting category ${cat.slug}:`, error);
        continue;
      }
      catId = inserted.id;
    }
    catMap[cat.slug] = catId;

    for (const t of cat.translations) {
      await supabase
        .from('category_translations')
        .upsert({ category_id: catId, locale: t.locale, name: t.name });
    }
    console.log(`✓ Category ready: ${cat.slug} (${cat.translations[0].name})`);
  }

  // 2. Attributes
  const attributes = [
    {
      slug: 'color',
      input_type: 'select',
      is_variant_defining: true,
      translations: [
        { locale: 'ar', name: 'اللون' },
        { locale: 'fr', name: 'Couleur' },
        { locale: 'en', name: 'Color' },
      ],
      options: [
        { slug: 'noir-royal', hex: '#1a1a1a', pos: 1, ar: 'أسود ملكي', fr: 'Noir Royal' },
        { slug: 'beige-nude', hex: '#d8c3b0', pos: 2, ar: 'بيج نيود', fr: 'Beige Nude' },
        { slug: 'rose-poudre', hex: '#d9a5b3', pos: 3, ar: 'وردي بودري', fr: 'Rose Poudré' },
        { slug: 'vert-kaki', hex: '#4b5320', pos: 4, ar: 'زيتي / كاكي', fr: 'Vert Kaki' },
        { slug: 'bleu-marine', hex: '#1b263b', pos: 5, ar: 'كحلي داكن', fr: 'Bleu Marine' },
        { slug: 'marron-moka', hex: '#5c4033', pos: 6, ar: 'بني موكا', fr: 'Marron Moka' },
        { slug: 'gris-clair', hex: '#b0b0b0', pos: 7, ar: 'رمادي فضي', fr: 'Gris Argenté' },
        { slug: 'bordeaux', hex: '#58111a', pos: 8, ar: 'عنابي / بوردو', fr: 'Bordeaux' },
        { slug: 'blanc-creme', hex: '#faf0e6', pos: 9, ar: 'أبيض كريمي', fr: 'Blanc Crème' },
      ],
    },
    {
      slug: 'size',
      input_type: 'select',
      is_variant_defining: true,
      translations: [
        { locale: 'ar', name: 'المقاس / الطول' },
        { locale: 'fr', name: 'Taille / Longueur' },
        { locale: 'en', name: 'Size / Length' },
      ],
      options: [
        { slug: 'standard', hex: null, pos: 1, ar: 'قياس موحد (Standard)', fr: 'Taille Unique' },
        { slug: 'size-52', hex: null, pos: 2, ar: '52 (طول 132 سم)', fr: '52 (Longueur 132 cm)' },
        { slug: 'size-54', hex: null, pos: 3, ar: '54 (طول 137 سم)', fr: '54 (Longueur 137 cm)' },
        { slug: 'size-56', hex: null, pos: 4, ar: '56 (طول 142 سم)', fr: '56 (Longueur 142 cm)' },
        { slug: 'size-58', hex: null, pos: 5, ar: '58 (طول 147 سم)', fr: '58 (Longueur 147 cm)' },
      ],
    },
    {
      slug: 'fabric',
      input_type: 'select',
      is_variant_defining: false,
      translations: [
        { locale: 'ar', name: 'نوع القماش' },
        { locale: 'fr', name: 'Type de Tissu' },
        { locale: 'en', name: 'Fabric Material' },
      ],
      options: [
        { slug: 'soie-de-medine', hex: null, pos: 1, ar: 'حرير مديني تركي فاخر', fr: 'Soie de Médine Turque' },
        { slug: 'crepe-coreen-royal', hex: null, pos: 2, ar: 'كريب كوري ملكي ثقيل', fr: 'Crêpe Coréen Royal' },
        { slug: 'mousseline-georgette', hex: null, pos: 3, ar: 'شيفون جورجيت غير شفاف', fr: 'Mousseline Georgette Opaque' },
        { slug: 'crepe-turc', hex: null, pos: 4, ar: 'كريب تركي خفيف وانسيابي', fr: 'Crêpe Turc Léger' },
        { slug: 'coton-naturel', hex: null, pos: 5, ar: 'قطن طبيعي 100% بارد', fr: 'Coton Naturel 100%' },
      ],
    },
  ];

  const attrMap = {};

  for (const attr of attributes) {
    const { data: existing } = await supabase
      .from('attributes')
      .select('id')
      .eq('slug', attr.slug)
      .maybeSingle();

    let attrId = existing?.id;
    if (!attrId) {
      const { data: inserted, error } = await supabase
        .from('attributes')
        .insert({
          slug: attr.slug,
          input_type: attr.input_type,
          is_variant_defining: attr.is_variant_defining,
        })
        .select('id')
        .single();
      if (error) {
        console.error(`Error inserting attribute ${attr.slug}:`, error);
        continue;
      }
      attrId = inserted.id;
    }
    attrMap[attr.slug] = attrId;

    for (const t of attr.translations) {
      await supabase
        .from('attribute_translations')
        .upsert({ attribute_id: attrId, locale: t.locale, name: t.name });
    }

    // Options
    for (const opt of attr.options) {
      const { data: existingOpt } = await supabase
        .from('attribute_options')
        .select('id')
        .eq('attribute_id', attrId)
        .eq('value_slug', opt.slug)
        .maybeSingle();

      let optId = existingOpt?.id;
      if (!optId) {
        const { data: insOpt, error: optErr } = await supabase
          .from('attribute_options')
          .insert({
            attribute_id: attrId,
            value_slug: opt.slug,
            position: opt.pos,
            hex_color: opt.hex,
          })
          .select('id')
          .single();
        if (optErr) {
          console.error(`Error inserting option ${opt.slug}:`, optErr);
          continue;
        }
        optId = insOpt.id;
      }

      await supabase.from('attribute_option_translations').upsert([
        { option_id: optId, locale: 'ar', label: opt.ar },
        { option_id: optId, locale: 'fr', label: opt.fr },
      ]);
    }
    console.log(`✓ Attribute ready: ${attr.slug} with ${attr.options.length} options`);
  }

  // 3. Category Attributes Linking
  const links = [
    // Hijabs: Color, Fabric
    { cat: 'hijabs', attr: 'color', req: true },
    { cat: 'hijabs', attr: 'fabric', req: true },
    // Abayas: Size, Color, Fabric
    { cat: 'abayas', attr: 'size', req: true },
    { cat: 'abayas', attr: 'color', req: true },
    { cat: 'abayas', attr: 'fabric', req: true },
    // Dresses: Size, Color, Fabric
    { cat: 'dresses', attr: 'size', req: true },
    { cat: 'dresses', attr: 'color', req: true },
    { cat: 'dresses', attr: 'fabric', req: true },
    // Prayer sets: Color, Fabric
    { cat: 'prayer-sets', attr: 'color', req: true },
    { cat: 'prayer-sets', attr: 'fabric', req: true },
    // Accessories: Color
    { cat: 'accessories', attr: 'color', req: false },
  ];

  for (const l of links) {
    const cId = catMap[l.cat];
    const aId = attrMap[l.attr];
    if (cId && aId) {
      await supabase
        .from('category_attributes')
        .upsert({ category_id: cId, attribute_id: aId, is_required: l.req });
    }
  }

  console.log('✓ All Category Attributes linked successfully!');
  console.log('🎉 Seed complete! You can now add products directly.');
}

seed().catch(console.error);
