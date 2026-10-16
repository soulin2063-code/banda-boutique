'use client';

import React, { useState, useEffect } from 'react';

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
  id?: string;
  value_slug: string;
  hex_color?: string | null;
  attribute_option_translations?: OptionTranslation[];
  label_ar?: string;
  label_fr?: string;
  label_en?: string;
}

interface AttributeTranslation {
  locale: string;
  name: string;
}

interface CategoryAttribute {
  category_id: string;
  is_required: boolean;
}

interface Attribute {
  id: string;
  slug: string;
  input_type: 'select' | 'multiselect' | 'text' | 'number' | 'boolean';
  is_variant_defining: boolean;
  attribute_translations: AttributeTranslation[];
  attribute_options: AttributeOption[];
  category_attributes: CategoryAttribute[];
}

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [inputType, setInputType] = useState<'select' | 'multiselect' | 'text' | 'number' | 'boolean'>('select');
  const [isVariantDefining, setIsVariantDefining] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [options, setOptions] = useState<
    Array<{ value_slug: string; label_ar: string; label_fr: string; label_en: string; hex_color?: string }>
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Quick Category Creator
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameFr, setNewCatNameFr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [attrRes, catRes] = await Promise.all([
        fetch('/api/attributes'),
        fetch('/api/categories'),
      ]);

      if (!attrRes.ok || !catRes.ok) {
        throw new Error('Failed to load data from server');
      }

      const attrData = await attrRes.json();
      const catData = await catRes.json();

      setAttributes(attrData);
      setCategories(catData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setSlug('');
    setInputType('select');
    setIsVariantDefining(false);
    setNameAr('');
    setNameFr('');
    setNameEn('');
    setOptions([]);
    setSelectedCategories([]);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (attr: Attribute) => {
    setEditingId(attr.id);
    setSlug(attr.slug);
    setInputType(attr.input_type);
    setIsVariantDefining(attr.is_variant_defining);

    const arTrans = attr.attribute_translations.find((t) => t.locale === 'ar')?.name || '';
    const frTrans = attr.attribute_translations.find((t) => t.locale === 'fr')?.name || '';
    const enTrans = attr.attribute_translations.find((t) => t.locale === 'en')?.name || '';
    setNameAr(arTrans);
    setNameFr(frTrans);
    setNameEn(enTrans);

    const formattedOptions = (attr.attribute_options || []).map((opt) => ({
      value_slug: opt.value_slug,
      label_ar: opt.attribute_option_translations?.find((t) => t.locale === 'ar')?.label || opt.value_slug,
      label_fr: opt.attribute_option_translations?.find((t) => t.locale === 'fr')?.label || opt.value_slug,
      label_en: opt.attribute_option_translations?.find((t) => t.locale === 'en')?.label || opt.value_slug,
      hex_color: opt.hex_color || '',
    }));
    setOptions(formattedOptions);

    const catIds = (attr.category_attributes || []).map((ca) => ca.category_id);
    setSelectedCategories(catIds);

    setIsModalOpen(true);
  };

  const addOptionRow = () => {
    setOptions([
      ...options,
      { value_slug: '', label_ar: '', label_fr: '', label_en: '', hex_color: slug.toLowerCase() === 'color' ? '#4A1D4F' : '' },
    ]);
  };

  const removeOptionRow = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (
    index: number,
    field: 'value_slug' | 'label_ar' | 'label_fr' | 'label_en' | 'hex_color',
    value: string
  ) => {
    const next = [...options];
    next[index][field] = value;
    setOptions(next);
  };

  const applySizePreset = () => {
    setSlug('size');
    setNameAr('المقاس');
    setNameFr('Taille');
    setNameEn('Size');
    setInputType('select');
    setIsVariantDefining(true);
    setOptions([
      { value_slug: 's', label_ar: 'صغير (S)', label_fr: 'S (Small)', label_en: 'S (Small)' },
      { value_slug: 'm', label_ar: 'متوسط (M)', label_fr: 'M (Medium)', label_en: 'M (Medium)' },
      { value_slug: 'l', label_ar: 'كبير (L)', label_fr: 'L (Large)', label_en: 'L (Large)' },
    ]);
  };

  const applyColorPreset = () => {
    setSlug('color');
    setNameAr('اللون');
    setNameFr('Couleur');
    setNameEn('Color');
    setInputType('select');
    setIsVariantDefining(true);
    setOptions([
      { value_slug: 'black', label_ar: 'أسود', label_fr: 'Noir', label_en: 'Black', hex_color: '#111111' },
      { value_slug: 'plum', label_ar: 'برقوقي / خوخي غامق', label_fr: 'Prune', label_en: 'Plum', hex_color: '#4A1D4F' },
      { value_slug: 'beige', label_ar: 'بيج', label_fr: 'Beige', label_en: 'Beige', hex_color: '#E1C699' },
      { value_slug: 'sage', label_ar: 'أخضر ميرمية', label_fr: 'Vert sauge', label_en: 'Sage Green', hex_color: '#879F84' },
      { value_slug: 'dusty-rose', label_ar: 'وردي مغبر', label_fr: 'Vieux rose', label_en: 'Dusty Rose', hex_color: '#C98A90' },
    ]);
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      slug: slug.trim().toLowerCase(),
      input_type: inputType,
      is_variant_defining: isVariantDefining,
      name_ar: nameAr.trim(),
      name_fr: nameFr.trim(),
      name_en: nameEn.trim(),
      options: options.map((opt) => ({
        value_slug: opt.value_slug.trim().toLowerCase(),
        label_ar: opt.label_ar.trim(),
        label_fr: opt.label_fr.trim(),
        label_en: opt.label_en.trim(),
        hex_color: slug.trim().toLowerCase() === 'color' && opt.hex_color ? opt.hex_color.trim() : undefined,
      })),
      category_ids: selectedCategories,
    };

    try {
      const url = editingId ? `/api/attributes/${editingId}` : '/api/attributes';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save attribute');
      }

      setSuccessMsg(editingId ? 'Attribute updated successfully!' : 'Attribute created successfully!');
      setIsModalOpen(false);
      resetForm();
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttribute = async (id: string, attrSlug: string) => {
    if (!confirm(`Are you sure you want to delete attribute "${attrSlug}"? This will delete all options and associations.`)) {
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/attributes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete attribute');
      }
      setSuccessMsg(`Attribute "${attrSlug}" deleted.`);
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatSubmitting(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newCatSlug.trim().toLowerCase(),
          name_ar: newCatNameAr.trim(),
          name_fr: newCatNameFr.trim(),
          name_en: newCatNameEn.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      setIsCatModalOpen(false);
      setNewCatSlug('');
      setNewCatNameAr('');
      setNewCatNameFr('');
      setNewCatNameEn('');
      await fetchData();
      setSelectedCategories((prev) => [...prev, data.id]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating category');
    } finally {
      setCatSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Attributs & Options
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define dynamic product attributes (e.g. Size, Color, Volume), translations, options, and category assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            + Add Category
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            + New Attribute
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
          {successMsg}
        </div>
      )}

      {/* Attributes List */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-900">
            Configured Attributes ({attributes.length})
          </h2>
          <span className="text-xs text-slate-500">Database Schema §4 Compliant</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading attributes...</div>
        ) : attributes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-medium text-slate-900">No attributes found</p>
            <p className="mt-1 text-sm text-slate-500">
              Get started by creating an attribute like &quot;Size&quot; with S/M/L options.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Create First Attribute
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Attribute / Slug</th>
                  <th className="px-6 py-3">Translations (AR / FR / EN)</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Variant Defining</th>
                  <th className="px-6 py-3">Options</th>
                  <th className="px-6 py-3">Assigned Categories</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {attributes.map((attr) => {
                  const arName = attr.attribute_translations.find((t) => t.locale === 'ar')?.name || '-';
                  const frName = attr.attribute_translations.find((t) => t.locale === 'fr')?.name || '-';
                  const enName = attr.attribute_translations.find((t) => t.locale === 'en')?.name || '-';

                  const assignedCats = (attr.category_attributes || []).map((ca) => {
                    const cat = categories.find((c) => c.id === ca.category_id);
                    return cat?.slug || ca.category_id.slice(0, 8);
                  });

                  return (
                    <tr key={attr.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        <div>{attr.slug}</div>
                        <span className="text-xs text-slate-400 font-mono">{attr.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-semibold text-emerald-800">AR: {arName}</span>
                          <span>FR: {frName}</span>
                          <span className="text-slate-500">EN: {enName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                          {attr.input_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attr.is_variant_defining ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            ✓ Yes (Variants)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No (Display only)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {attr.attribute_options.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">None</span>
                          ) : (
                            attr.attribute_options.map((opt) => (
                              <span
                                key={opt.id || opt.value_slug}
                                className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200"
                              >
                                {opt.hex_color && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block shrink-0"
                                    style={{ backgroundColor: opt.hex_color }}
                                  />
                                )}
                                {opt.value_slug}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {assignedCats.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">None (Global)</span>
                          ) : (
                            assignedCats.map((catName) => (
                              <span
                                key={catName}
                                className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200"
                              >
                                {catName}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => openEditModal(attr)}
                          className="text-xs font-semibold text-slate-700 hover:text-emerald-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAttribute(attr.id, attr.slug)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800"
                        >
                          Delete
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

      {/* Modal: Create / Edit Attribute */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit Attribute' : 'New Attribute'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure slug, translations, options, and category associations.
                </p>
              </div>
              {!editingId && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyColorPreset}
                    className="rounded-md bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 border border-purple-300 hover:bg-purple-100"
                  >
                    🎨 Preset: Color (Palette)
                  </button>
                  <button
                    type="button"
                    onClick={applySizePreset}
                    className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                  >
                    ⚡ Preset: Size (S/M/L)
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveAttribute} className="space-y-5">
              {/* Row 1: Slug & Input Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Slug (System Identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="e.g. size, color, volume"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Lowercase letters, numbers, hyphens.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Input Type *
                  </label>
                  <select
                    value={inputType}
                    onChange={(e) => setInputType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="select">Select (Single choice)</option>
                    <option value="multiselect">Multiselect</option>
                    <option value="text">Text (Single line)</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean (Yes/No)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Is Variant Defining */}
              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVariantDefining}
                    onChange={(e) => setIsVariantDefining(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">
                      Is Variant Defining?
                    </span>
                    <p className="text-xs text-slate-500">
                      Enable if this attribute creates different purchasable SKUs with their own stock/price (e.g. Size, Color).
                    </p>
                  </div>
                </label>
              </div>

              {/* Row 3: Multilingual Names */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Display Names (3 Locales) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500 mb-1">Arabic (العربية)</span>
                    <input
                      type="text"
                      required
                      dir="rtl"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      placeholder="المقاس"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500 mb-1">French (Français)</span>
                    <input
                      type="text"
                      required
                      value={nameFr}
                      onChange={(e) => setNameFr(e.target.value)}
                      placeholder="Taille"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500 mb-1">English</span>
                    <input
                      type="text"
                      required
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="Size"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Options List (for Select/Multiselect) */}
              {(inputType === 'select' || inputType === 'multiselect') && (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Attribute Options ({options.length})
                      </h4>
                      <p className="text-xs text-slate-400">Values that customers or sellers can choose from.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addOptionRow}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      + Add Option
                    </button>
                  </div>

                  {options.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No options added yet. Click &quot;+ Add Option&quot; or use a preset.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {options.map((opt, idx) => (
                        <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          {slug.trim().toLowerCase() === 'color' && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="color"
                                value={opt.hex_color || '#4A1D4F'}
                                onChange={(e) => updateOption(idx, 'hex_color', e.target.value)}
                                className="w-8 h-7 p-0.5 rounded border border-slate-300 cursor-pointer bg-white"
                                title="Pick hex color"
                              />
                              <input
                                type="text"
                                placeholder="#4A1D4F"
                                value={opt.hex_color || ''}
                                onChange={(e) => updateOption(idx, 'hex_color', e.target.value)}
                                className="w-20 rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:outline-none focus:border-emerald-600"
                              />
                            </div>
                          )}
                          <input
                            type="text"
                            required
                            placeholder="slug (e.g. s)"
                            value={opt.value_slug}
                            onChange={(e) => updateOption(idx, 'value_slug', e.target.value.toLowerCase())}
                            className="w-20 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-emerald-600"
                          />
                          <input
                            type="text"
                            required
                            dir="rtl"
                            placeholder="عربي"
                            value={opt.label_ar}
                            onChange={(e) => updateOption(idx, 'label_ar', e.target.value)}
                            className="w-28 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-emerald-600"
                          />
                          <input
                            type="text"
                            required
                            placeholder="FR"
                            value={opt.label_fr}
                            onChange={(e) => updateOption(idx, 'label_fr', e.target.value)}
                            className="w-28 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-emerald-600"
                          />
                          <input
                            type="text"
                            required
                            placeholder="EN"
                            value={opt.label_en}
                            onChange={(e) => updateOption(idx, 'label_en', e.target.value)}
                            className="w-28 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-emerald-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeOptionRow(idx)}
                            className="text-xs text-red-500 hover:text-red-700 px-1 font-bold ms-auto"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Row 5: Assign to Categories */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assign to Categories (via category_attributes)
                </label>
                <p className="text-xs text-slate-500">
                  Products in these categories will require or display this attribute.
                </p>

                {categories.length === 0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                    <span>No categories found in database. Create one now to assign!</span>
                    <button
                      type="button"
                      onClick={() => setIsCatModalOpen(true)}
                      className="underline font-semibold"
                    >
                      + Create Test Category
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                    {categories.map((cat) => {
                      const isChecked = selectedCategories.includes(cat.id);
                      const catName =
                        cat.category_translations?.find((t) => t.locale === 'en')?.name ||
                        cat.category_translations?.find((t) => t.locale === 'fr')?.name ||
                        cat.slug;

                      return (
                        <label
                          key={cat.id}
                          className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer border ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, cat.id]);
                              } else {
                                setSelectedCategories(selectedCategories.filter((id) => id !== cat.id));
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-600"
                          />
                          <span className="truncate">{catName} ({cat.slug})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Attribute' : 'Save Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Create Category */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Category</h3>
            <p className="text-xs text-slate-500">
              Create a category with trilingual names to link attributes to products.
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. clothing, perfumes, electronics"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value.toLowerCase())}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name (Arabic) *</label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  placeholder="ملابس"
                  value={newCatNameAr}
                  onChange={(e) => setNewCatNameAr(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name (French) *</label>
                <input
                  type="text"
                  required
                  placeholder="Vêtements"
                  value={newCatNameFr}
                  onChange={(e) => setNewCatNameFr(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="Clothing"
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                >
                  {catSubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
