'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, FolderPlus, Package, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface CategoryTranslation {
  locale: string;
  name: string;
}

interface Category {
  id: string;
  slug: string;
  parent_id?: string | null;
  category_translations: CategoryTranslation[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) {
        throw new Error('فشل تحميل الفئات');
      }
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNameFrChange = (val: string) => {
    setNameFr(val);
    if (!slug || slug === nameFr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !nameFr.trim() || !slug.trim()) {
      setError('يرجى ملء الاسم بالعربية والفرنسية والاسم اللطيف (Slug)');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim().toLowerCase(),
          name_ar: nameAr.trim(),
          name_fr: nameFr.trim(),
          name_en: (nameEn.trim() || nameFr.trim()),
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'فشل إنشاء الفئة');
      }

      setSuccessMsg(`تمت إضافة الفئة "${nameAr}" بنجاح!`);
      setIsModalOpen(false);
      setNameAr('');
      setNameFr('');
      setNameEn('');
      setSlug('');
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الفئة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف فئة "${name}"؟ قد يؤثر ذلك على المنتجات التابعة لها.`)) {
      return;
    }

    setDeleteId(id);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل حذف الفئة');
      }

      setSuccessMsg('تم حذف الفئة بنجاح');
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'تعذر حذف الفئة');
    } finally {
      setDeleteId(null);
    }
  };

  const getName = (cat: Category, loc: string) => {
    return cat.category_translations?.find((t) => t.locale === loc)?.name || '';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗂️</span>
            <h1 className="text-2xl font-bold text-slate-900">إدارة الفئات والأقسام (Catégories)</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            أضف الفئات التي ستظهر في واجهة المتجر الرئيسية (مثل: حجابات، عبايات، فساتين، خمارات...)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setError(null);
              setSuccessMsg(null);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة فئة جديدة (+ Nouvelle)</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-600 hover:underline">
            إغلاق
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-red-600 hover:underline">
            إغلاق
          </button>
        </div>
      )}

      {/* Categories Table / Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">
            قائمة الفئات المسجلة ({categories.length})
          </h2>
          <Link
            href="/admin/produits"
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
          >
            <Package className="h-3.5 w-3.5" />
            الانتقال لإدارة المنتجات
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm">جاري تحميل الفئات...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <FolderPlus className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-base text-slate-700">لا توجد فئات حتى الآن</p>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              ابدأ بإضافة أول فئة لمتجرك حتى تتمكن من إضافة منتجات إليها وعرضها في الصفحة الرئيسية
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              + إضافة فئة الآن
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">اسم الفئة (عربي)</th>
                  <th className="py-3 px-4">Nom (Français)</th>
                  <th className="py-3 px-4">الرمز (Slug)</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => {
                  const arName = getName(cat, 'ar') || cat.slug;
                  const frName = getName(cat, 'fr') || '-';

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {arName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {frName}
                      </td>
                      <td className="py-3.5 px-4">
                        <code className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                          {cat.slug}
                        </code>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href="/admin/produits"
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs rounded-lg transition-colors font-medium"
                          >
                            + إضافة منتج
                          </Link>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, arName)}
                            disabled={deleteId === cat.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="حذف الفئة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                إضافة فئة جديدة (Nouvelle Catégorie)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-right">
              {/* Arabic Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الفئة بالعربية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حجابات تركية، عبايات، فساتين..."
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  dir="rtl"
                />
              </div>

              {/* French Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom en Français <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hijabs Turcs, Abayas, Robes..."
                  value={nameFr}
                  onChange={(e) => handleNameFrChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-left"
                  dir="ltr"
                />
              </div>

              {/* English Name (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name in English (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Turkish Hijabs, Abayas..."
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-left"
                  dir="ltr"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الاسم اللطيف في الرابط (Slug) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  pattern="^[a-z0-9_-]+$"
                  placeholder="hijabs-turcs"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-left font-mono"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1 text-right">
                  يُستخدم في روابط المتجر (أحرف إنجليزية صغيرة وأرقام ومطة - فقط)
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>حفظ الفئة (Enregistrer)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
