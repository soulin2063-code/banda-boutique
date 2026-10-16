-- =========================================================================
-- CLEAR ALL PRODUCTS & CATEGORIES (مسح جميع المنتجات والفئات)
-- 
-- يمسح هذا السكريبت:
-- جميع المنتجات (products)
-- صور المنتجات (product_images)
-- ترجمات المنتجات (product_translations)
-- متغيرات المنتجات (product_variants)
-- قيم الصفات
-- الفئات وترجماتها وصفاتها
-- 
-- يبقى:
-- الولايات والبلديات (wilayas & communes)
-- أسعار التوصيل (delivery_rates)
--
-- طريقة التشغيل:
-- 1. افتح Supabase Dashboard → SQL Editor
-- 2. انسخ هذا الملف كاملاً والصقه
-- 3. اضغط RUN
-- =========================================================================

TRUNCATE TABLE public.product_variant_attribute_values RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_attribute_values RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_variants RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_images RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_translations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.products RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.attribute_option_translations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.attribute_options RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.attribute_translations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.category_attributes RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.attributes RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.category_translations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.categories RESTART IDENTITY CASCADE;

-- التحقق (يجب ان تكون كلها = 0)
SELECT 
  (SELECT COUNT(*) FROM public.products) AS products_count,
  (SELECT COUNT(*) FROM public.categories) AS categories_count,
  (SELECT COUNT(*) FROM public.product_images) AS images_count,
  (SELECT COUNT(*) FROM public.product_variants) AS variants_count;
