'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, ShieldCheck, CheckCircle2, AlertCircle, Phone, MapPin, User, Building2, Home } from 'lucide-react';

interface Wilaya {
  id: number;
  code: string;
  name_ar: string;
  name_fr: string;
}

interface Commune {
  id: string;
  wilaya_id: number;
  name_ar: string;
  name_fr: string;
}

interface OrderFormProps {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantLabel?: string;
  unitPrice: number;
  quantity: number;
  locale: string;
  onSuccess?: (orderId: string) => void;
  className?: string;
}

export function OrderForm({
  productId,
  productName,
  productSlug,
  variantId,
  variantLabel,
  unitPrice,
  quantity,
  locale,
  onSuccess,
  className = '',
}: OrderFormProps) {
  const router = useRouter();
  const isArabic = locale === 'ar';
  const currency = isArabic ? 'د.ج' : 'DA';

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedWilayaId, setSelectedWilayaId] = useState<number | ''>('');
  const [selectedCommuneId, setSelectedCommuneId] = useState('');
  const [addressText, setAddressText] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');
  const [notes, setNotes] = useState('');

  // Location Data
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  // Delivery Pricing
  const [homePrice, setHomePrice] = useState<number>(600);
  const [deskPrice, setDeskPrice] = useState<number>(400);
  const [deliveryFee, setDeliveryFee] = useState<number>(600);
  const [loadingRates, setLoadingRates] = useState(false);

  // Status & Validation
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);

  // 1. Fetch Wilayas
  useEffect(() => {
    async function loadWilayas() {
      try {
        const res = await fetch('/api/wilayas');
        if (res.ok) {
          const data: Wilaya[] = await res.json();
          setWilayas(data);
          // Default to Algiers (16) for fast UX if available
          const algiers = data.find((w) => w.id === 16);
          if (algiers) {
            setSelectedWilayaId(16);
          } else if (data.length > 0) {
            setSelectedWilayaId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load wilayas:', err);
      } finally {
        setLoadingWilayas(false);
      }
    }
    loadWilayas();
  }, []);

  // 2. Fetch Communes when Wilaya changes
  useEffect(() => {
    if (!selectedWilayaId) {
      setCommunes([]);
      setSelectedCommuneId('');
      return;
    }

    async function loadCommunes() {
      setLoadingCommunes(true);
      try {
        const res = await fetch(`/api/communes?wilaya_id=${selectedWilayaId}&limit=300`);
        if (res.ok) {
          const data: Commune[] = await res.json();
          setCommunes(data);
          if (data.length > 0) {
            setSelectedCommuneId(data[0].id);
          } else {
            setSelectedCommuneId('');
          }
        }
      } catch (err) {
        console.error('Failed to load communes:', err);
      } finally {
        setLoadingCommunes(false);
      }
    }

    loadCommunes();
  }, [selectedWilayaId]);

  // 3. Fetch Delivery Rates when Wilaya / Commune changes
  useEffect(() => {
    if (!selectedWilayaId) return;

    async function loadRates() {
      setLoadingRates(true);
      try {
        const url = selectedCommuneId
          ? `/api/delivery-rates?wilaya_id=${selectedWilayaId}&commune_id=${selectedCommuneId}`
          : `/api/delivery-rates?wilaya_id=${selectedWilayaId}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const hp = typeof data.home_price === 'number' ? data.home_price : 600;
          const dp = typeof data.desk_price === 'number' ? data.desk_price : 400;
          setHomePrice(hp);
          setDeskPrice(dp);
          setDeliveryFee(deliveryType === 'desk' ? dp : hp);
        }
      } catch (err) {
        console.error('Failed to load delivery rates:', err);
      } finally {
        setLoadingRates(false);
      }
    }

    loadRates();
  }, [selectedWilayaId, selectedCommuneId, deliveryType]);

  // Update current fee when deliveryType changes
  useEffect(() => {
    setDeliveryFee(deliveryType === 'desk' ? deskPrice : homePrice);
  }, [deliveryType, deskPrice, homePrice]);

  // 4. Capture abandoned checkout lead on phone blur (§6 & T17)
  const handlePhoneBlur = async () => {
    const cleanPhone = phone.trim();
    if (!leadCaptured && /^0[5-7]\d{8}$/.test(cleanPhone)) {
      setLeadCaptured(true);
      try {
        await fetch('/api/checkout-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            product_id: productId || undefined,
            wilaya_id: typeof selectedWilayaId === 'number' ? selectedWilayaId : undefined,
          }),
        });
      } catch {
        // Silently ignore lead capture errors to never disturb checkout flow
      }
    }
  };

  const subtotal = unitPrice * quantity;
  const grandTotal = subtotal + deliveryFee;

  // 5. Submit Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      setErrorMsg(isArabic ? 'يرجى كتابة الاسم واللقب بشكل صحيح' : 'Veuillez saisir votre nom complet');
      return;
    }

    if (!/^0[5-7]\d{8}$/.test(cleanPhone)) {
      setErrorMsg(
        isArabic
          ? 'يرجى إدخال رقم هاتف جزائري صحيح (مثال: 0555123456)'
          : 'Numéro de téléphone invalide (ex: 0555123456)'
      );
      return;
    }

    if (!selectedWilayaId) {
      setErrorMsg(isArabic ? 'يرجى اختيار الولاية' : 'Veuillez choisir votre wilaya');
      return;
    }

    if (!selectedCommuneId) {
      setErrorMsg(isArabic ? 'يرجى اختيار البلدية' : 'Veuillez choisir votre commune');
      return;
    }

    setSubmitting(true);

    const payload = {
      customer: {
        full_name: cleanName,
        phone: cleanPhone,
      },
      address: {
        wilaya_id: Number(selectedWilayaId),
        commune_id: selectedCommuneId,
        address_text: addressText.trim() || undefined,
        delivery_type: deliveryType,
      },
      items: [
        {
          product_variant_id: variantId,
          quantity,
        },
      ],
      payment_type: 'cod_full',
      notes: notes.trim() || undefined,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'OUT_OF_STOCK') {
          setErrorMsg(
            isArabic
              ? 'عذراً! الكمية المطلوبة غير متوفرة حالياً في المخزن.'
              : 'Désolé, la quantité demandée est en rupture de stock.'
          );
        } else if (data.code === 'RATE_LIMITED') {
          setErrorMsg(
            isArabic
              ? 'تم تجاوز الحد المسموح به من الطلبات مؤقتاً. يرجى المحاولة لاحقاً.'
              : 'Trop de tentatives de commande. Veuillez patienter.'
          );
        } else {
          setErrorMsg(data.error || (isArabic ? 'حدث خطأ أثناء تسجيل الطلب.' : 'Erreur lors de la commande.'));
        }
        setSubmitting(false);
        return;
      }

      // Success!
      if (onSuccess) {
        onSuccess(data.order_id);
      } else {
        router.push(`/${locale}/commande/confirmation/${data.order_id}`);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isArabic
          ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.'
          : 'Impossible de joindre le serveur. Vérifiez votre connexion.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      id="order-form-section"
      className={`rounded-xl border border-slate-200 bg-white p-6 sm:p-8 ${className}`}
    >
      <div className="border-b border-slate-100 pb-5 mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 mb-2">
          <Truck className="h-3.5 w-3.5" />
          <span>{isArabic ? 'الدفع نقداً عند استلام طلبيتك (COD)' : 'Paiement Cash à la Réception (COD)'}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-950">
          {isArabic ? 'أدخل معلوماتك لإتمام الطلب' : 'Formulaire de Commande Rapide'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {isArabic
            ? 'املأ الاستمارة وسيتصل بك فريقنا لتأكيد طلبك قبل الشحن.'
            : 'Remplissez les champs ci-dessous pour valider votre commande.'}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>{isArabic ? 'الاسم واللقب *' : 'Nom et Prénom *'}</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isArabic ? 'مثال: محمد بلقاسم' : 'Ex: Karim Benali'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{isArabic ? 'رقم الهاتف *' : 'Numéro de Téléphone *'}</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={handlePhoneBlur}
              placeholder="05XXXXXXXX / 06XXXXXXXX / 07XXXXXXXX"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 font-mono transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              {isArabic
                ? 'سيتصل بك الموزع عبر هذا الرقم لتسليم الطرد.'
                : 'Le livreur vous contactera sur ce numéro pour la livraison.'}
            </p>
          </div>
        </div>

        {/* Location Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Wilaya */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{isArabic ? 'الولاية (58 ولاية) *' : 'Wilaya (58 Wilayas) *'}</span>
            </label>
            <select
              required
              disabled={loadingWilayas}
              value={selectedWilayaId}
              onChange={(e) => setSelectedWilayaId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50"
            >
              {loadingWilayas ? (
                <option>{isArabic ? 'جاري تحميل الولايات...' : 'Chargement des wilayas...'}</option>
              ) : (
                wilayas.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {isArabic ? w.name_ar : w.name_fr}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Commune */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>{isArabic ? 'البلدية *' : 'Commune *'}</span>
            </label>
            <select
              required
              disabled={loadingCommunes || communes.length === 0}
              value={selectedCommuneId}
              onChange={(e) => setSelectedCommuneId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50"
            >
              {loadingCommunes ? (
                <option>{isArabic ? 'جاري تحميل البلديات...' : 'Chargement des communes...'}</option>
              ) : communes.length === 0 ? (
                <option value="">{isArabic ? 'اختر الولاية أولاً' : 'Sélectionnez une wilaya'}</option>
              ) : (
                communes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isArabic ? c.name_ar : c.name_fr}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Delivery Type (Home vs Desk) */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            {isArabic ? 'طريقة الاستلام والتوصيل :' : 'Mode de livraison :'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryType('home')}
              className={`p-3.5 rounded-2xl border text-start transition-all flex items-center justify-between ${
                deliveryType === 'home'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    deliveryType === 'home' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Home className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {isArabic ? 'توصيل لباب المنزل' : 'Livraison à Domicile'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isArabic ? 'إلى عنوانك مباشرة' : 'Directement chez vous'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-800 font-mono">
                {homePrice.toLocaleString()} {currency}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryType('desk')}
              className={`p-3.5 rounded-2xl border text-start transition-all flex items-center justify-between ${
                deliveryType === 'desk'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    deliveryType === 'desk' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {isArabic ? 'استلام من مكتب التوصيل' : 'Récupération au Bureau'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isArabic ? 'Stop Desk اقتصادي' : 'Point relais économique'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-800 font-mono">
                {deskPrice.toLocaleString()} {currency}
              </span>
            </button>
          </div>
        </div>

        {/* Address Details */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            {isArabic ? 'العنوان أو الحي (اختياري) :' : 'Adresse ou Quartier (Optionnel) :'}
          </label>
          <input
            type="text"
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            placeholder={
              isArabic
                ? 'مثال: حي النصر عمارة 12 رقم 4'
                : 'Ex: Cité 500 logts, Bat 4, N° 12'
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        {/* Order Summary Box */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>
              {productName} {variantLabel ? `(${variantLabel})` : ''} × {quantity}
            </span>
            <span className="font-semibold text-slate-900 font-mono">
              {subtotal.toLocaleString()} {currency}
            </span>
          </div>

          <div className="flex justify-between text-xs text-slate-600">
            <span>
              {isArabic ? 'تكلفة التوصيل' : 'Frais de livraison'} (
              {deliveryType === 'desk' ? (isArabic ? 'مكتب' : 'Bureau') : (isArabic ? 'منزل' : 'Domicile')})
            </span>
            <span className="font-semibold text-slate-900 font-mono">
              {loadingRates ? '...' : `${deliveryFee.toLocaleString()} ${currency}`}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900">
              {isArabic ? 'المبلغ الإجمالي للدفع :' : 'Total à Payer à la Réception :'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              {grandTotal.toLocaleString()} {currency}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-600 py-3.5 px-6 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          {submitting ? (
            <span className="animate-pulse">
              {isArabic ? 'جاري تسجيل طلبك...' : 'Enregistrement de la commande...'}
            </span>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              <span>
                {isArabic
                  ? `تأكيد الطلب الآن (${grandTotal.toLocaleString()} ${currency})`
                  : `Confirmer la Commande (${grandTotal.toLocaleString()} ${currency})`}
              </span>
            </>
          )}
        </button>

        {/* Guarantees */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {isArabic ? 'معاينة المنتج قبل الدفع' : 'Vérification avant paiement'}
          </span>
          <span>•</span>
          <span>{isArabic ? 'توصيل سريع 58 ولاية' : 'Livraison rapide 58 Wilayas'}</span>
        </div>
      </form>
    </div>
  );
}
