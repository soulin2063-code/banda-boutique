'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Wilaya {
  id: number;
  code: string;
  name_ar: string;
  name_fr: string;
}

interface DeliveryRate {
  id: string;
  home_price: number | null;
  desk_price: number | null;
  carrier: string;
  eta_days: number | null;
}

interface CommandePageProps {
  params: Promise<{ locale: string }>;
}

export default function CommandePage({ params }: CommandePageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">Loading...</div>}>
      <CommandeFormContent params={params} />
    </Suspense>
  );
}

function CommandeFormContent({ params }: CommandePageProps) {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState('ar');
  
  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);
  
  const isArabic = locale === 'ar';

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<number | ''>('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Data
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [deliveryRates, setDeliveryRates] = useState<DeliveryRate[]>([]);
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // From URL params
  const variantId = searchParams.get('variant');
  const quantity = parseInt(searchParams.get('qty') || '1', 10);
  const productSlug = searchParams.get('product') || searchParams.get('slug') || '';

  useEffect(() => {
    // Fetch wilayas
    fetch('/api/wilayas')
      .then((r) => r.json())
      .then((data) => setWilayas(data || []))
      .catch(() => setWilayas([]))
      .finally(() => setLoadingWilayas(false));
  }, []);

  useEffect(() => {
    if (!selectedWilaya) {
      setDeliveryRates([]);
      return;
    }
    setLoadingRates(true);
    fetch(`/api/delivery-rates?wilaya_id=${selectedWilaya}`)
      .then((r) => r.json())
      .then((data) => setDeliveryRates(data.rates || []))
      .catch(() => setDeliveryRates([]))
      .finally(() => setLoadingRates(false));
  }, [selectedWilaya]);

  const currentRate = deliveryRates[0];
  const deliveryFee = deliveryType === 'home'
    ? (currentRate?.home_price ?? 0)
    : (currentRate?.desk_price ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantId) {
      setError('Aucun produit sélectionné. Retournez à la page produit.');
      return;
    }
    if (!selectedWilaya) {
      setError('Veuillez sélectionner votre wilaya.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Capture lead first
      await fetch('/api/checkout-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, wilaya_id: selectedWilaya }),
      });

      // Fetch variant price
      const varRes = await fetch(`/api/stock/${variantId}`).catch(() => null);
      let unitPrice = 0;
      if (varRes?.ok) {
        const varData = await varRes.json();
        unitPrice = varData.price_override || varData.products?.base_price || 0;
      }

      // Get a commune_id — for now use a placeholder (commune selection UI can be added later)
      // We'll use the first commune of the selected wilaya
      const communeRes = await fetch(`/api/communes?wilaya_id=${selectedWilaya}&limit=1`);
      const communeData = communeRes.ok ? await communeRes.json() : [];
      const communeId = communeData[0]?.id;

      if (!communeId) {
        setError('Impossible de trouver votre commune. Veuillez réessayer.');
        return;
      }

      const payload = {
        customer: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        },
        address: {
          wilaya_id: Number(selectedWilaya),
          commune_id: communeId,
          address_text: address.trim() || undefined,
          delivery_type: deliveryType,
        },
        items: [{ product_variant_id: variantId, quantity }],
        payment_type: 'cod_full' as const,
        notes: notes.trim() || undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la commande');

      // Redirect to confirmation
      const orderId = data.order_id || data.id;
      window.location.href = `/${locale}/commande/confirmation/${orderId}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="text-xl font-extrabold text-slate-900">
            🇩🇿 ShopDZ
          </Link>
          <span className="text-sm font-semibold text-slate-600">
            {isArabic ? 'إتمام الطلب' : 'Finaliser la commande'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {isArabic ? 'أكمل طلبك' : 'Commander maintenant'}
          </h1>
          <p className="mt-2 text-slate-600 text-sm">
            {isArabic
              ? 'الدفع عند الاستلام، لا توجد رسوم مسبقة'
              : 'Paiement cash à la livraison, aucun paiement en avance'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {!variantId && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            {isArabic
              ? 'لم يتم اختيار منتج. يرجى العودة لصفحة المنتج.'
              : 'Aucun produit sélectionné. Veuillez retourner à la page produit.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Customer Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2">
              {isArabic ? '1. معلوماتك الشخصية' : '1. Vos informations'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isArabic ? 'الاسم الكامل *' : 'Nom complet *'}
                </label>
                <input
                  type="text"
                  required
                  dir={isArabic ? 'rtl' : 'ltr'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isArabic ? 'محمد علي' : 'Mohamed Ali'}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isArabic ? 'رقم الهاتف *' : 'Téléphone *'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0555123456"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {isArabic ? 'أرقام جزائرية فقط (05/06/07)' : 'Numéro algérien (05/06/07...)'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isArabic ? 'البريد الإلكتروني (اختياري)' : 'Email (optionnel)'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2">
              {isArabic ? '2. عنوان التوصيل' : '2. Adresse de livraison'}
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isArabic ? 'الولاية *' : 'Wilaya *'}
              </label>
              {loadingWilayas ? (
                <div className="text-xs text-slate-400 py-2">Chargement des wilayas...</div>
              ) : (
                <select
                  required
                  value={selectedWilaya}
                  onChange={(e) => setSelectedWilaya(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">{isArabic ? '-- اختر الولاية --' : '-- Sélectionnez votre wilaya --'}</option>
                  {wilayas.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {isArabic ? w.name_ar : w.name_fr}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                {isArabic ? 'نوع التوصيل *' : 'Type de livraison *'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'home', labelFr: 'Domicile', labelAr: 'توصيل للمنزل' },
                  { value: 'desk', labelFr: 'Bureau', labelAr: 'استلام من مكتب التوصيل' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                      deliveryType === opt.value
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_type"
                      value={opt.value}
                      checked={deliveryType === opt.value}
                      onChange={() => setDeliveryType(opt.value as 'home' | 'desk')}
                      className="text-emerald-600"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {isArabic ? opt.labelAr : opt.labelFr}
                      </div>
                      {selectedWilaya && currentRate && (
                        <div className="text-xs text-emerald-700 font-bold">
                          {(opt.value === 'home' ? currentRate.home_price : currentRate.desk_price)?.toLocaleString() || '-'} DA
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {loadingRates && (
                <p className="mt-1 text-xs text-slate-400">Chargement des tarifs...</p>
              )}
              {currentRate?.eta_days && (
                <p className="mt-2 text-xs text-emerald-700">
                  {isArabic ? `التوصيل خلال ${currentRate.eta_days} أيام عبر ${currentRate.carrier}` : `Livraison en ${currentRate.eta_days} jours via ${currentRate.carrier}`}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isArabic ? 'العنوان بالتفصيل' : 'Adresse précise (optionnel)'}
              </label>
              <input
                type="text"
                dir={isArabic ? 'rtl' : 'ltr'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={isArabic ? 'رقم الشارع، الحي...' : 'N° rue, quartier...'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isArabic ? 'ملاحظات إضافية' : 'Notes (optionnel)'}
              </label>
              <textarea
                rows={2}
                dir={isArabic ? 'rtl' : 'ltr'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isArabic ? 'أي تفاصيل إضافية...' : 'Informations supplémentaires...'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Order Summary */}
          {deliveryFee > 0 && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
              <h3 className="font-bold text-slate-900">
                {isArabic ? 'ملخص الطلب' : 'Récapitulatif'}
              </h3>
              <div className="flex justify-between text-slate-600">
                <span>{isArabic ? 'تكلفة التوصيل' : 'Frais de livraison'}</span>
                <span className="font-semibold">{deliveryFee.toLocaleString()} DA</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-300">
                <span>{isArabic ? 'المجموع (+ سعر المنتج)' : 'Total (+ prix produit)'}</span>
                <span className="text-emerald-700">+ {deliveryFee.toLocaleString()} DA</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !variantId}
            className="w-full rounded-xl bg-emerald-600 py-3.5 px-6 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? (isArabic ? 'جاري التأكيد...' : 'Confirmation en cours...')
              : (isArabic ? 'تأكيد الطلب، الدفع عند الاستلام' : 'Confirmer, paiement cash à la livraison')}
          </button>

          <p className="text-center text-xs text-slate-500">
            {isArabic ? 'بياناتك آمنة، لا يوجد دفع مسبق.' : 'Vos données sont sécurisées, aucun paiement en avance.'}
          </p>
        </form>
      </main>
    </div>
  );
}
