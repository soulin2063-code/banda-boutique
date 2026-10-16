'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Package, Upload, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SellerAddProductPage() {
  const [nameFr, setNameFr] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descFr, setDescFr] = useState('');
  const [basePrice, setBasePrice] = useState<number>(3500);
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('الصورة كبيرة جداً — الحد الأقصى 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `seller-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw new Error(`فشل رفع الصورة: ${uploadError.message}`);
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFr.trim()) { setError('اسم المنتج بالفرنسية مطلوب'); return; }
    if (!basePrice || basePrice <= 0) { setError('السعر يجب أن يكون أكبر من 0'); return; }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    let imageUrl = '';
    if (imageFile) {
      try {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'خطأ في رفع الصورة');
        setSubmitting(false);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const slug = nameFr.trim().toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff\s-]/g, '')
      .replace(/\s+/g, '-')
      + '-' + Date.now();

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          base_price: Number(basePrice),
          compare_at_price: compareAtPrice === '' ? null : Number(compareAtPrice),
          status: 'draft', // seller products start as draft for admin review
          name_ar: nameAr.trim(),
          name_fr: nameFr.trim(),
          name_en: nameFr.trim(),
          description_ar: '',
          description_fr: descFr.trim(),
          description_en: '',
          images: imageUrl ? [{ url: imageUrl, position: 0 }] : [],
          variants: [],
          display_attribute_option_ids: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء المنتج');

      setSuccess(`✅ تم إرسال المنتج "${nameFr}" للمراجعة بنجاح!`);
      setNameFr(''); setNameAr(''); setDescFr('');
      setBasePrice(3500); setCompareAtPrice('');
      setImageFile(null); setImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
          <Plus className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">إضافة منتج جديد للمتجر</h1>
          <p className="text-xs text-slate-500">سيُحفظ المنتج كمسودة وتتم مراجعته وتفعيله من طرف الإدارة</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-4">
          <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
          <button onClick={() => setError(null)} className="mr-auto text-rose-400 hover:text-rose-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-xl bg-indigo-50 border border-indigo-200 p-4">
          <CheckCircle className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-800 font-semibold">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            صورة المنتج الرئيسية *
          </label>
          <div
            className={`relative border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all
              ${imagePreview
                ? 'border-indigo-400 bg-indigo-50/20'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/10'
              }`}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="p-3 relative">
                <img
                  src={imagePreview}
                  alt="معاينة"
                  className="h-52 w-full object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(); }}
                  className="absolute top-5 right-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full h-7 w-7 flex items-center justify-center shadow-md transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="mt-2 text-xs text-indigo-600 hover:underline font-bold"
                >
                  🔄 تغيير الصورة
                </button>
              </div>
            ) : (
              <div className="py-10 px-4">
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">اضغط لرفع صورة المنتج</p>
                <p className="text-xs text-slate-400 mt-1">PNG، JPG، WEBP — حتى 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          {uploading && (
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-indigo-600 font-bold">جاري رفع الصورة إلى التخزين...</p>
            </div>
          )}
        </div>

        {/* Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم المنتج بالعربية *
            </label>
            <input
              type="text"
              required
              dir="rtl"
              value={nameAr}
              onChange={(e) => {
                setNameAr(e.target.value);
                if (!nameFr) setNameFr(e.target.value);
              }}
              placeholder="مثال: عباءة سوداء مطرزة"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم المنتج بالفرنسية / الرابط *
            </label>
            <input
              type="text"
              required
              value={nameFr}
              onChange={(e) => setNameFr(e.target.value)}
              placeholder="Ex: Abaya Noire Brodee"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              السعر الأساسي (د.ج) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              السعر القديم قبل الخصم (د.ج)
            </label>
            <input
              type="number"
              min="0"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder="اختياري"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            وصف المنتج ومميزاته
          </label>
          <textarea
            rows={3}
            dir="rtl"
            value={descFr}
            onChange={(e) => setDescFr(e.target.value)}
            placeholder="اكتب وصفاً جذاباً لمواصفات المنتج وقماشه..."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all resize-none"
          />
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 p-4">
          <Package className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-900 leading-relaxed">
            <strong>ملاحظة هامة:</strong> سيتم حفظ المنتج كـ <strong>مسودة</strong> ومراجعته من قبل إدارة المتجر قبل ظهوره للزبائن في الموقع.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || uploading || !nameFr.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>جاري الإرسال والمزامنة...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>إرسال المنتج للمراجعة</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
