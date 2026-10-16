-- =========================================================================
-- 🌸 BANDA / SHOPDZ — متجر الحجابات والعبايات الجزائري
-- سكريبت إضافة الفئات الأساسية، الصفات، الخيارات وربطها تلقائياً
-- =========================================================================
-- طريقة الاستخدام:
-- 1. افتح لوحة تحكم Supabase Dashboard (https://supabase.com/dashboard)
-- 2. اذهب إلى: SQL Editor من القائمة الجانبية
-- 3. أنشئ New query والصق كامل هذا الكود واضغط على: RUN (Ctrl+Enter)
-- =========================================================================

DO $$
DECLARE
  -- Category IDs
  cat_hijabs uuid;
  cat_abayas uuid;
  cat_dresses uuid;
  cat_accessories uuid;
  cat_prayers uuid;

  -- Attribute IDs
  attr_color uuid;
  attr_size uuid;
  attr_fabric uuid;

  -- Option IDs
  opt_id uuid;
BEGIN

  -- =====================================================================
  -- 1. الفئات الأساسية (Categories)
  -- =====================================================================
  
  -- فئة الحجابات
  INSERT INTO public.categories (slug) VALUES ('hijabs')
  ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
  RETURNING id INTO cat_hijabs;

  INSERT INTO public.category_translations (category_id, locale, name) VALUES
    (cat_hijabs, 'ar', 'حجابات وشالات'),
    (cat_hijabs, 'fr', 'Hijabs & Châles'),
    (cat_hijabs, 'en', 'Hijabs & Scarves')
  ON CONFLICT (category_id, locale) DO UPDATE SET name = EXCLUDED.name;

  -- فئة العبايات
  INSERT INTO public.categories (slug) VALUES ('abayas')
  ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
  RETURNING id INTO cat_abayas;

  INSERT INTO public.category_translations (category_id, locale, name) VALUES
    (cat_abayas, 'ar', 'عبايات إسلامية فاخرة'),
    (cat_abayas, 'fr', 'Abayas Modernes & Orientales'),
    (cat_abayas, 'en', 'Luxury Abayas')
  ON CONFLICT (category_id, locale) DO UPDATE SET name = EXCLUDED.name;

  -- فئة الفساتين والجلابيات
  INSERT INTO public.categories (slug) VALUES ('dresses')
  ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
  RETURNING id INTO cat_dresses;

  INSERT INTO public.category_translations (category_id, locale, name) VALUES
    (cat_dresses, 'ar', 'فساتين وجلابيات محتشمة'),
    (cat_dresses, 'fr', 'Robes & Jalabiyas'),
    (cat_dresses, 'en', 'Modest Dresses')
  ON CONFLICT (category_id, locale) DO UPDATE SET name = EXCLUDED.name;

  -- فئة النقاب والإكسسوارات
  INSERT INTO public.categories (slug) VALUES ('accessories')
  ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
  RETURNING id INTO cat_accessories;

  INSERT INTO public.category_translations (category_id, locale, name) VALUES
    (cat_accessories, 'ar', 'نقاب، بونيهات وإكسسوارات'),
    (cat_accessories, 'fr', 'Niqabs, Bonnets & Accessoires'),
    (cat_accessories, 'en', 'Niqabs & Hijab Accessories')
  ON CONFLICT (category_id, locale) DO UPDATE SET name = EXCLUDED.name;

  -- فئة أطقم وإسدالات الصلاة
  INSERT INTO public.categories (slug) VALUES ('prayer-sets')
  ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
  RETURNING id INTO cat_prayers;

  INSERT INTO public.category_translations (category_id, locale, name) VALUES
    (cat_prayers, 'ar', 'إسدالات وأطقم صلاة'),
    (cat_prayers, 'fr', 'Ensembles & Tenues de Prière'),
    (cat_prayers, 'en', 'Prayer Sets')
  ON CONFLICT (category_id, locale) DO UPDATE SET name = EXCLUDED.name;


  -- =====================================================================
  -- 2. السمات والصفات الأساسية (Attributes)
  -- =====================================================================

  -- صفة اللون (Color) - تحدد خيارات المنتج والمخزون
  INSERT INTO public.attributes (slug, input_type, is_variant_defining) VALUES
    ('color', 'select', true)
  ON CONFLICT (slug) DO UPDATE SET is_variant_defining = true
  RETURNING id INTO attr_color;

  INSERT INTO public.attribute_translations (attribute_id, locale, name) VALUES
    (attr_color, 'ar', 'اللون'),
    (attr_color, 'fr', 'Couleur'),
    (attr_color, 'en', 'Color')
  ON CONFLICT (attribute_id, locale) DO UPDATE SET name = EXCLUDED.name;

  -- صفة المقاس (Size) - تحدد خيارات المنتج والمخزون
  INSERT INTO public.attributes (slug, input_type, is_variant_defining) VALUES
    ('size', 'select', true)
  ON CONFLICT (slug) DO UPDATE SET is_variant_defining = true
  RETURNING id INTO attr_size;

  INSERT INTO public.attribute_translations (attribute_id, locale, name) VALUES
    (attr_size, 'ar', 'المقاس / الطول'),
    (attr_size, 'fr', 'Taille / Longueur'),
    (attr_size, 'en', 'Size / Length')
  ON CONFLICT (attribute_id, locale) DO UPDATE SET name = EXCLUDED.name;

  -- صفة نوع القماش (Fabric)
  INSERT INTO public.attributes (slug, input_type, is_variant_defining) VALUES
    ('fabric', 'select', false)
  ON CONFLICT (slug) DO UPDATE SET is_variant_defining = false
  RETURNING id INTO attr_fabric;

  INSERT INTO public.attribute_translations (attribute_id, locale, name) VALUES
    (attr_fabric, 'ar', 'نوع القماش'),
    (attr_fabric, 'fr', 'Type de Tissu'),
    (attr_fabric, 'en', 'Fabric Material')
  ON CONFLICT (attribute_id, locale) DO UPDATE SET name = EXCLUDED.name;


  -- =====================================================================
  -- 3. خيارات الألوان (Color Options with Hex codes)
  -- =====================================================================
  
  -- أسود ملكي
  INSERT INTO public.attribute_options (attribute_id, value_slug, position, hex_color)
  VALUES (attr_color, 'noir-royal', 1, '#1a1a1a')
  ON CONFLICT (attribute_id, value_slug) DO UPDATE SET hex_color = EXCLUDED.hex_color
  RETURNING id INTO opt_id;
  INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
    (opt_id, 'ar', 'أسود ملكي'), (opt_id, 'fr', 'Noir Royal')
  ON CONFLICT (option_id, locale) DO UPDATE SET label = EXCLUDED.label;

  -- بيج نيود
  INSERT INTO public.attribute_options (attribute_id, value_slug, position, hex_color)
  VALUES (attr_color, 'beige-nude', 2, '#d8c3b0')
  ON CONFLICT (attribute_id, value_slug) DO UPDATE SET hex_color = EXCLUDED.hex_color
  RETURNING id INTO opt_id;
  INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
    (opt_id, 'ar', 'بيج نيود'), (opt_id, 'fr', 'Beige Nude')
  ON CONFLICT (option_id, locale) DO UPDATE SET label = EXCLUDED.label;

  -- وردي بودري
  INSERT INTO public.attribute_options (attribute_id, value_slug, position, hex_color)
  VALUES (attr_color, 'rose-poudre', 3, '#d9a5b3')
  ON CONFLICT (attribute_id, value_slug) DO UPDATE SET hex_color = EXCLUDED.hex_color
  RETURNING id INTO opt_id;
  INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
    (opt_id, 'ar', 'وردي بودري'), (opt_id, 'fr', 'Rose Poudré')
  ON CONFLICT (option_id, locale) DO UPDATE SET label = EXCLUDED.label;

  -- زيتي / كاكي
  INSERT INTO public.attribute_options (attribute_id, value_slug, position, hex_color)
  VALUES (attr_color, 'vert-kaki', 4, '#4b5320')
  ON CONFLICT (attribute_id, value_slug) DO UPDATE SET hex_color = EXCLUDED.hex_color
  RETURNING id INTO opt_id;
  INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
    (opt_id, 'ar', 'زيتي / كاكي'), (opt_id, 'fr', 'Vert Kaki')
  ON CONFLICT (option_id, locale) DO UPDATE SET label = EXCLUDED.label;

  -- كحلي داكن
  INSERT INTO public.attribute_options (attribute_id, value_slug, position, hex_color)
  VALUES (attr_color, 'bleu-marine', 5, '#1b263b')
  ON CONFLICT (attribute_id, value_slug) DO UPDATE SET hex_color = EXCLUDED.hex_color
  RETURNING id INTO opt_id;
  INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
    (opt_id, 'ar', 'كحلي داكن'), (opt_id, 'fr', 'Bleu Marine')
  ON CONFLICT (option_id, locale) DO UPDATE SET label = EXCLUDED.label;

  -- بني موكا
  INSERT INTO public.attribute_options (attribute_id, value_slug, position, hex_color)
  VALUES (attr_color, 'marron-moka', 6, '#5c4033')
  ON CONFLICT (attribute_id, value_slug) DO UPDATE SET hex_color = EXCLUDED.hex_color
  RETURNING id INTO opt_id;
  INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
    (opt_id, 'ar', 'بني موكا'), (opt_id, 'fr', 'Marron Moka')
  ON CONFLICT (option_id, locale) DO UPDATE SET label = EXCLUDED.label;

  -- رمادي فاتح
  INSERT INTO public.attribute_options (attribute_id, value_slug, position, hex_color)
  VALUES (attr_color, 'gris-clair', 7, '#b0b0b0')
  ON CONFLICT (attribute_id, value_slug) DO UPDATE SET hex_color = EXCLUDED.hex_color
  RETURNING id INTO opt_id;
  INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
    (opt_id, 'ar', 'رمادي فضي'), (opt_id, 'fr', 'Gris Argenté')
  ON CONFLICT (option_id, locale) DO UPDATE SET label = EXCLUDED.label;

  -- عنابي / برغندي
  INSERT INTO public.attribute_options (attribute_id, value_slug, position, hex_color)
  VALUES (attr_color, 'bordeaux', 8, '#58111a')
  ON CONFLICT (attribute_id, value_slug) DO UPDATE SET hex_color = EXCLUDED.hex_color
  RETURNING id INTO opt_id;
  INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
    (opt_id, 'ar', 'عنابي / بوردو'), (opt_id, 'fr', 'Bordeaux')
  ON CONFLICT (option_id, locale) DO UPDATE SET label = EXCLUDED.label;

  -- أبيض سكري
  INSERT INTO public.attribute_options (attribute_id, value_slug, position, hex_color)
  VALUES (attr_color, 'blanc-creme', 9, '#faf0e6')
  ON CONFLICT (attribute_id, value_slug) DO UPDATE SET hex_color = EXCLUDED.hex_color
  RETURNING id INTO opt_id;
  INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
    (opt_id, 'ar', 'أبيض كريمي'), (opt_id, 'fr', 'Blanc Crème')
  ON CONFLICT (option_id, locale) DO UPDATE SET label = EXCLUDED.label;


  -- =====================================================================
  -- 4. خيارات المقاسات (Sizes Options)
  -- =====================================================================

  -- قياس موحد
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_size, 'standard', 1)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', 'قياس موحد (Standard)'), (opt_id, 'fr', 'Taille Unique');
  END IF;

  -- مقاس 52 (طول 132 سم)
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_size, 'size-52', 2)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', '52 (طول 132 سم)'), (opt_id, 'fr', '52 (Longueur 132 cm)');
  END IF;

  -- مقاس 54 (طول 137 سم)
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_size, 'size-54', 3)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', '54 (طول 137 سم)'), (opt_id, 'fr', '54 (Longueur 137 cm)');
  END IF;

  -- مقاس 56 (طول 142 سم)
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_size, 'size-56', 4)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', '56 (طول 142 سم)'), (opt_id, 'fr', '56 (Longueur 142 cm)');
  END IF;

  -- مقاس 58 (طول 147 سم)
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_size, 'size-58', 5)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', '58 (طول 147 سم)'), (opt_id, 'fr', '58 (Longueur 147 cm)');
  END IF;


  -- =====================================================================
  -- 5. خيارات الأقمشة (Fabrics Options)
  -- =====================================================================

  -- حرير مديني
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_fabric, 'soie-de-medine', 1)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', 'حرير مديني تركي فاخر'), (opt_id, 'fr', 'Soie de Médine Turque');
  END IF;

  -- كريب كوري ملكي
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_fabric, 'crepe-coreen-royal', 2)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', 'كريب كوري ملكي ثقيل'), (opt_id, 'fr', 'Crêpe Coréen Royal');
  END IF;

  -- شيفون جورجيت
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_fabric, 'mousseline-georgette', 3)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', 'شيفون جورجيت غير شفاف'), (opt_id, 'fr', 'Mousseline Georgette Opaque');
  END IF;

  -- كريب تركي صيفي
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_fabric, 'crepe-turc', 4)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', 'كريب تركي خفيف وانسيابي'), (opt_id, 'fr', 'Crêpe Turc Léger');
  END IF;

  -- قطن طبيعي
  INSERT INTO public.attribute_options (attribute_id, value_slug, position)
  VALUES (attr_fabric, 'coton-naturel', 5)
  ON CONFLICT (attribute_id, value_slug) DO NOTHING
  RETURNING id INTO opt_id;
  IF opt_id IS NOT NULL THEN
    INSERT INTO public.attribute_option_translations (option_id, locale, label) VALUES
      (opt_id, 'ar', 'قطن طبيعي 100% بارد'), (opt_id, 'fr', 'Coton Naturel 100%');
  END IF;


  -- =====================================================================
  -- 6. ربط الفئات بالصفات (Category Attributes)
  -- =====================================================================

  -- الحجابات تحتاج: (اللون + نوع القماش)
  INSERT INTO public.category_attributes (category_id, attribute_id, is_required) VALUES
    (cat_hijabs, attr_color, true),
    (cat_hijabs, attr_fabric, true)
  ON CONFLICT (category_id, attribute_id) DO NOTHING;

  -- العبايات تحتاج: (المقاس + اللون + نوع القماش)
  INSERT INTO public.category_attributes (category_id, attribute_id, is_required) VALUES
    (cat_abayas, attr_size, true),
    (cat_abayas, attr_color, true),
    (cat_abayas, attr_fabric, true)
  ON CONFLICT (category_id, attribute_id) DO NOTHING;

  -- الفساتين تحتاج: (المقاس + اللون + نوع القماش)
  INSERT INTO public.category_attributes (category_id, attribute_id, is_required) VALUES
    (cat_dresses, attr_size, true),
    (cat_dresses, attr_color, true),
    (cat_dresses, attr_fabric, true)
  ON CONFLICT (category_id, attribute_id) DO NOTHING;

  -- أطقم الصلاة تحتاج: (اللون + القماش)
  INSERT INTO public.category_attributes (category_id, attribute_id, is_required) VALUES
    (cat_prayers, attr_color, true),
    (cat_prayers, attr_fabric, true)
  ON CONFLICT (category_id, attribute_id) DO NOTHING;

  -- الإكسسوارات والنقاب تحتاج: (اللون)
  INSERT INTO public.category_attributes (category_id, attribute_id, is_required) VALUES
    (cat_accessories, attr_color, false)
  ON CONFLICT (category_id, attribute_id) DO NOTHING;

END $$;
