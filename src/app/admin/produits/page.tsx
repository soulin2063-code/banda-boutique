'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CategoryTranslation {
  locale: string;
  name: string;
}

interface Category {
  id: string;
  slug: string;
  category_translations: CategoryTranslation[];
}

interface OptionTranslation {
  locale: string;
  label: string;
}

interface AttributeOption {
  id: string;
  value_slug: string;
  attribute_option_translations?: OptionTranslation[];
}

interface AttributeTranslation {
  locale: string;
  name: string;
}

interface CategoryAttributeDetail {
  id: string;
  slug: string;
  input_type: 'select' | 'multiselect' | 'text' | 'number' | 'boolean';
  is_variant_defining: boolean;
  is_required: boolean;
  attribute_translations: AttributeTranslation[];
  attribute_options: AttributeOption[];
}

interface ProductVariant {
  id?: string;
  sku?: string;
  price_override?: number | null;
  compare_at_price_override?: number | null;
  stock_qty: number;
  min_stock_threshold: number;
  attribute_option_ids: string[];
}

interface ProductImage {
  url: string;
  position: number;
}

interface ProductTranslation {
  locale: string;
  name: string;
  description?: string | null;
}

interface Product {
  id: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  status: 'draft' | 'active' | 'archived';
  badge?: 'new' | 'sale' | 'bestseller' | null;
  is_featured?: boolean;
  category_id: string;
  created_at: string;
  categories?: {
    id: string;
    slug: string;
    category_translations: CategoryTranslation[];
  };
  product_translations: ProductTranslation[];
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}

export default function AdminProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState<number>(3500);
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>('');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('active');
  const [badge, setBadge] = useState<'new' | 'sale' | 'bestseller' | ''>('');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [nameAr, setNameAr] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descFr, setDescFr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamically loaded attributes for selected category
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttributeDetail[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState(false);

  // Selected values for variant-defining attributes
  // e.g. { [attribute_id]: [option_id1, option_id2] }
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string[]>>({});

  // Generated variant list for stock and SKU configuration
  const [variants, setVariants] = useState<
    Array<{
      option_id: string;
      option_label: string;
      sku: string;
      stock_qty: number;
      price_override: number | null;
    }>
  >([]);

  // Selected non-variant display attribute values
  const [displayAttributes, setDisplayAttributes] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);

  // Helper: convert text to URL slug
  const toSlug = (text: string) =>
    text.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);

      if (!prodRes.ok || !catRes.ok) {
        throw new Error('Failed to load products or categories');
      }

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      setProducts(prodData);
      setCategories(catData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Dynamic attribute loader triggered when category changes — ZERO HARDCODED LOGIC
  const handleCategoryChange = async (newCatId: string) => {
    setCategoryId(newCatId);
    setSelectedVariantOptions({});
    setVariants([]);
    setDisplayAttributes({});

    if (!newCatId) {
      setCategoryAttributes([]);
      return;
    }

    setLoadingAttrs(true);
    try {
      const res = await fetch(`/api/categories/${newCatId}/attributes`);
      if (!res.ok) {
        throw new Error('Failed to load attributes for category');
      }
      const attrs = await res.json();
      setCategoryAttributes(attrs);
    } catch (err: unknown) {
      console.error(err);
      setCategoryAttributes([]);
    } finally {
      setLoadingAttrs(false);
    }
  };

  const toggleVariantOption = (attr: CategoryAttributeDetail, opt: AttributeOption) => {
    const current = selectedVariantOptions[attr.id] || [];
    const isSelected = current.includes(opt.id);
    const updated = isSelected
      ? current.filter((id) => id !== opt.id)
      : [...current, opt.id];

    const newMap = { ...selectedVariantOptions, [attr.id]: updated };
    setSelectedVariantOptions(newMap);

    // Rebuild variant list
    // For single variant-defining attribute (e.g. Size S/M/L)
    const activeVariants: Array<{
      option_id: string;
      option_label: string;
      sku: string;
      stock_qty: number;
      price_override: number | null;
    }> = [];

    // Collect all chosen option IDs across variant-defining attributes
    attr.attribute_options.forEach((o) => {
      if (updated.includes(o.id)) {
        const existing = variants.find((v) => v.option_id === o.id);
        const frLabel = o.attribute_option_translations?.find((t) => t.locale === 'fr')?.label || o.value_slug;
        activeVariants.push({
          option_id: o.id,
          option_label: frLabel,
          sku: existing?.sku || `${slug || 'prod'}-${o.value_slug}`.toUpperCase(),
          stock_qty: existing?.stock_qty ?? 10,
          price_override: existing?.price_override ?? null,
        });
      }
    });

    setVariants(activeVariants);
  };

  const updateVariant = (
    index: number,
    field: 'sku' | 'stock_qty' | 'price_override',
    value: any
  ) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    setVariants(next);
  };

  const openCreateModal = () => {
    setSlug('');
    setCategoryId(categories[0]?.id || '');
    setBasePrice(3500);
    setCompareAtPrice('');
    setStatus('active');
    setBadge('');
    setIsFeatured(false);
    setNameAr('');
    setNameFr('');
    setNameEn('');
    setDescAr('');
    setDescFr('');
    setDescEn('');
    setImageUrl('');
    setImageFile(null);
    setImagePreview('');
    setCategoryAttributes([]);
    setSelectedVariantOptions({});
    setVariants([]);
    setDisplayAttributes({});

    if (categories.length > 0) {
      handleCategoryChange(categories[0].id);
    }

    setIsModalOpen(true);
  };



  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl('');
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    let finalImageUrl = imageUrl.trim();

    // Upload file if selected
    if (imageFile) {
      try {
        setUploadingImage(true);
        finalImageUrl = await uploadImageToSupabase(imageFile);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Image upload error');
        setSubmitting(false);
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    const payload = {
      slug: slug.trim().toLowerCase(),
      category_id: categoryId,
      base_price: Number(basePrice),
      compare_at_price: compareAtPrice === '' ? null : Number(compareAtPrice),
      status,
      badge: badge || null,
      is_featured: isFeatured,
      name_ar: nameAr.trim(),
      name_fr: nameFr.trim(),
      name_en: nameEn.trim(),
      description_ar: descAr.trim(),
      description_fr: descFr.trim(),
      description_en: descEn.trim(),
      images: finalImageUrl ? [{ url: finalImageUrl, position: 0 }] : [],
      variants: variants.map((v) => ({
        sku: v.sku.trim(),
        price_override: v.price_override ? Number(v.price_override) : null,
        stock_qty: Number(v.stock_qty),
        min_stock_threshold: 3,
        attribute_option_ids: [v.option_id],
      })),
      display_attribute_option_ids: Object.values(displayAttributes).filter(Boolean),
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      setSuccessMsg(`Product "${nameFr || slug}" created successfully!`);
      setIsModalOpen(false);
      setImageFile(null);
      setImagePreview('');
      await fetchInitialData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, prodSlug: string) => {
    if (!confirm(`Delete product "${prodSlug}" and all variants?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete product');
      }
      setSuccessMsg(`Product "${prodSlug}" deleted.`);
      await fetchInitialData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            إدارة المنتجات والكتالوج
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            إضافة وتعديل المنتجات، الأسعار، الصور، والخيارات المتنوعة (المقاسات والألوان).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            🗂️ إدارة الفئات والتصنيفات
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
          >
            + إضافة منتج جديد
          </button>
        </div>
      </div>

      {categories.length === 0 && !loading && (
        <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-amber-900">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>
              <strong>تنبيه:</strong> لا توجد فئات في المتجر بعد. يرجى إضافة فئة أولاً (مثل: حجابات، عبايات) لتتمكن من ربط المنتجات بها.
            </span>
          </div>
          <Link
            href="/admin/categories"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-xs whitespace-nowrap transition-colors"
          >
            + إضافة أول فئة الآن
          </Link>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 border border-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900 border border-indigo-200 flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-indigo-500 hover:text-indigo-700">✕</button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white shadow-xs rounded-2xl border border-slate-200/90 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/60 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">
            كتالوج المنتجات ({products.length})
          </h2>
          <span className="text-xs text-slate-500">مزامنة مباشرة مع قاعدة البيانات</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">جاري تحميل المنتجات...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-medium text-slate-900">لا يوجد منتجات مسجلة حالياً</p>
            <p className="mt-1 text-sm text-slate-500">
              أضف أول منتج إلى متجرك للبدء في استقبال طلبات الزبائن.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
            >
              + إضافة أول منتج
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-right text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">المنتج</th>
                  <th className="px-6 py-3.5">التصنيف</th>
                  <th className="px-6 py-3.5">السعر الأساسي</th>
                  <th className="px-6 py-3.5">الحالة</th>
                  <th className="px-6 py-3.5">المخزون والخيارات</th>
                  <th className="px-6 py-3.5 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {products.map((p) => {
                  const img = p.product_images?.[0]?.url;
                  const nameFr = p.product_translations?.find((t) => t.locale === 'fr')?.name || p.slug;
                  const nameAr = p.product_translations?.find((t) => t.locale === 'ar')?.name || '';
                  const catName =
                    p.categories?.category_translations?.find((t) => t.locale === 'ar')?.name ||
                    p.categories?.category_translations?.find((t) => t.locale === 'fr')?.name ||
                    p.categories?.slug ||
                    'عام';

                  const totalStock = (p.product_variants || []).reduce(
                    (acc, v) => acc + (v.stock_qty || 0),
                    0
                  );

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        {img ? (
                          <img
                            src={img}
                            alt={nameAr || nameFr}
                            className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
                            بدون صورة
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {nameAr || nameFr}
                            {p.is_featured && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800" title="منتج مميز">
                                ⭐ مميز
                              </span>
                            )}
                            {p.badge && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                p.badge === 'bestseller'
                                  ? 'bg-purple-100 text-purple-800'
                                  : p.badge === 'sale'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {p.badge === 'bestseller' ? 'الأكثر طلباً' : p.badge === 'sale' ? 'تخفيض' : 'جديد'}
                              </span>
                            )}
                          </div>
                          {nameFr && nameAr && <div className="text-xs text-slate-500 font-sans">{nameFr}</div>}
                          <span className="text-[11px] text-slate-400 font-mono">/products/{p.slug}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                          {catName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                        {p.base_price.toLocaleString()} د.ج
                        {p.compare_at_price && (
                          <span className="mr-2 text-xs text-slate-400 line-through">
                            {p.compare_at_price.toLocaleString()} د.ج
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.status === 'active' ? (
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
                            نشط
                          </span>
                        ) : p.status === 'draft' ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                            مسودة
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                            مؤرشف
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        <div className="text-xs">
                          <span className="font-bold text-slate-900">
                            {p.product_variants?.length || 0}
                          </span>{' '}
                          خيار • المخزون:{' '}
                          <span
                            className={
                              totalStock <= 3 ? 'font-bold text-rose-600' : 'font-semibold text-indigo-700'
                            }
                          >
                            {totalStock} قطعة
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left space-x-2">
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.slug)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  إضافة منتج جديد للكتالوج
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  أدخل تفاصيل المنتج وحدد الفئة لتحميل خياراتها تلقائياً.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Category Selector */}
              <div className="rounded-2xl bg-indigo-50/70 p-4 border border-indigo-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-indigo-950">
                    1. اختيار فئة المنتج (Catégorie) *
                  </label>
                  <Link
                    href="/admin/categories"
                    target="_blank"
                    className="text-xs text-indigo-700 underline font-semibold hover:text-indigo-900"
                  >
                    + إضافة فئة جديدة ↗
                  </Link>
                </div>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-indigo-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="">-- اختر الفئة المناسبة --</option>
                  {categories.map((c) => {
                    const label =
                      c.category_translations?.find((t) => t.locale === 'ar')?.name ||
                      c.category_translations?.find((t) => t.locale === 'fr')?.name ||
                      c.slug;
                    return (
                      <option key={c.id} value={c.id}>
                        {label} ({c.slug})
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1.5 text-xs text-indigo-700">
                  عند اختيار الفئة، سيتم تحميل خياراتها تلقائياً (مثل المقاسات والألوان المتوفرة).
                </p>
              </div>

              {/* General Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  2. البيانات الأساسية للمنتج
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      معرف الرابط (Slug URL) *
                      <span className="mr-1 font-normal text-slate-400">(يتولّد تلقائياً من الاسم)</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="slug-url-auto"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-600 focus:outline-none bg-slate-50/50"
                      />
                      {nameFr && (
                        <button
                          type="button"
                          onClick={() => setSlug(toSlug(nameFr) + '-' + Date.now().toString().slice(-4))}
                          className="shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          🔄 توليد
                        </button>
                      )}
                    </div>
                    {slug && (
                      <p className="mt-1 text-[10px] text-slate-400 font-mono">/products/{slug}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      حالة المنتج *
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none bg-white"
                    >
                      <option value="active">نشط (معروض في المتجر)</option>
                      <option value="draft">مسودة (غير معروض)</option>
                      <option value="archived">مؤرشف</option>
                    </select>
                  </div>
                </div>

                {/* Badge & Featured */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      شارة تسويقية (تظهر على بطاقة المنتج)
                    </label>
                    <select
                      value={badge}
                      onChange={(e) => setBadge(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none bg-white"
                    >
                      <option value="">بدون شارة</option>
                      <option value="new">جديد (New)</option>
                      <option value="sale">تخفيض (Sale)</option>
                      <option value="bestseller">الأكثر طلباً (Bestseller)</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        ⭐ تمييز المنتج وعرضه في الصفحة الرئيسية (Featured)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Multilingual Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-700 mb-1">اسم المنتج بالعربية *</span>
                    <input
                      type="text"
                      required
                      dir="rtl"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      placeholder="مثال: حجاب حريري تركي"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-700 mb-1">الاسم بالفرنسية / الرابط *</span>
                    <input
                      type="text"
                      required
                      value={nameFr}
                      onChange={(e) => {
                        setNameFr(e.target.value);
                        if (!slug || slug === toSlug(nameFr) || slug === '') {
                          setSlug(toSlug(e.target.value));
                        }
                      }}
                      placeholder="Hijab Soie Turc"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-700 mb-1">الاسم بالإنجليزية (اختياري)</span>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="Turkish Silk Hijab"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Pricing & Image */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      السعر الأساسي (د.ج) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      السعر القديم قبل التخفيض (د.ج)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="اختياري"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      صورة المنتج الرئيسية
                    </label>
                    <div
                      className="relative border-2 border-dashed border-slate-300 rounded-xl p-3 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="معاينة"
                            className="h-28 w-full object-contain rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setImageFile(null);
                              setImagePreview('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-rose-600 shadow-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="py-3">
                          <div className="text-2xl mb-1">📸</div>
                          <p className="text-xs font-semibold text-slate-700">اضغط لرفع صورة</p>
                          <p className="text-[10px] text-slate-400">PNG, JPG, WEBP حتى 5MB</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                    </div>
                    {uploadingImage && (
                      <p className="text-xs text-indigo-600 mt-1 text-center font-semibold">⏳ جاري رفع الصورة إلى التخزين...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* DYNAMIC ATTRIBUTES SECTION */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      3. الخصائص والخيارات الخاصة بالفئة
                    </h4>
                    <p className="text-xs text-slate-500">
                      تتغير تلقائياً حسب الفئة المحددة (المقاسات، الألوان...).
                    </p>
                  </div>
                  {loadingAttrs && (
                    <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                      جاري تحميل الخصائص...
                    </span>
                  )}
                </div>

                {categoryAttributes.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-4 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    {categoryId
                      ? 'لا توجد خصائص إضافية مرتبطة بهذه الفئة حالياً.'
                      : 'يرجى اختيار الفئة أعلاه لعرض الخيارات والخصائص المتاحة.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* A. Variant-Defining Attributes */}
                    {categoryAttributes
                      .filter((a) => a.is_variant_defining)
                      .map((attr) => {
                        const attrNameAr =
                          attr.attribute_translations.find((t) => t.locale === 'ar')?.name || '';
                        const attrNameFr =
                          attr.attribute_translations.find((t) => t.locale === 'fr')?.name || attr.slug;

                        return (
                          <div key={attr.id} className="rounded-2xl bg-amber-50/50 p-4 border border-amber-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-amber-950">
                                {attrNameAr || attrNameFr} — <span className="underline">تحدد خيارات المنتج والمخزون</span>
                              </label>
                              <span className="text-[11px] text-amber-800 font-medium">حدد الخيارات المتوفرة :</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {attr.attribute_options.map((opt) => {
                                const isChecked = (selectedVariantOptions[attr.id] || []).includes(opt.id);
                                const optLabel =
                                  opt.attribute_option_translations?.find((t) => t.locale === 'ar')?.label ||
                                  opt.attribute_option_translations?.find((t) => t.locale === 'fr')?.label ||
                                  opt.value_slug;

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleVariantOption(attr, opt)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                      isChecked
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                                    }`}
                                  >
                                    {isChecked ? '✓ ' : '+ '}
                                    {optLabel}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Generated Variant Stock Matrix */}
                            {variants.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2">
                                <span className="text-xs font-bold text-amber-950 block">
                                  كمية المخزون لكل خيار ({variants.length}) :
                                </span>
                                <div className="space-y-2">
                                  {variants.map((v, vIdx) => (
                                    <div
                                      key={v.option_id}
                                      className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-amber-200 text-xs shadow-2xs"
                                    >
                                      <span className="font-bold text-slate-900 w-28">
                                        {v.option_label}
                                      </span>
                                      <div className="flex-1 flex items-center gap-2">
                                        <label className="text-slate-500 text-[11px]">رمز SKU:</label>
                                        <input
                                          type="text"
                                          value={v.sku}
                                          onChange={(e) => updateVariant(vIdx, 'sku', e.target.value)}
                                          className="w-32 rounded-lg border border-slate-300 px-2 py-1 font-mono text-xs"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <label className="text-slate-500 text-[11px]">المخزون:</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={v.stock_qty}
                                          onChange={(e) => updateVariant(vIdx, 'stock_qty', Number(e.target.value))}
                                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    {/* B. Non-Variant Display Attributes */}
                    {categoryAttributes
                      .filter((a) => !a.is_variant_defining)
                      .map((attr) => {
                        const attrNameAr =
                          attr.attribute_translations.find((t) => t.locale === 'ar')?.name || '';
                        const attrNameFr =
                          attr.attribute_translations.find((t) => t.locale === 'fr')?.name || attr.slug;

                        return (
                          <div key={attr.id} className="rounded-xl bg-slate-50/80 p-3 border border-slate-200">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              {attrNameAr || attrNameFr}
                            </label>
                            <select
                              value={displayAttributes[attr.id] || ''}
                              onChange={(e) =>
                                setDisplayAttributes({
                                  ...displayAttributes,
                                  [attr.id]: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                            >
                              <option value="">-- اختر قيمة --</option>
                              {attr.attribute_options.map((opt) => {
                                const optLabel =
                                  opt.attribute_option_translations?.find((t) => t.locale === 'ar')?.label ||
                                  opt.attribute_option_translations?.find((t) => t.locale === 'fr')?.label ||
                                  opt.value_slug;
                                return (
                                  <option key={opt.id} value={opt.id}>
                                    {optLabel}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ ونشر المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
