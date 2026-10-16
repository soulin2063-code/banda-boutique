'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, PhoneCall } from 'lucide-react';

interface HeroStaticProps {
  locale?: string;
}

export function HeroStatic({ locale = 'ar' }: HeroStaticProps) {
  const isArabic = locale === 'ar';

  const t = {
    heading: {
      ar: 'حجابات وعبايات وأزياء محتشمة، توصيل لـ 58 ولاية',
      fr: 'Hijabs, abayas et robes modestes, livraison sur 58 wilayas',
      en: 'Hijabs, abayas and modest fashion, delivery across 58 wilayas',
    },
    sub: {
      ar: 'اطلبي الآن بدون بطاقة بنكية. عند وصول التوصيل، افتحي الطرد وتأكدي من الجودة قبل الدفع نقداً.',
      fr: 'Commandez sans carte bancaire. À la livraison, vérifiez votre colis avant de payer en espèces.',
      en: 'Order without a bank card. At delivery, check your parcel before paying cash.',
    },
    proof: {
      ar: '4,873 زبونة استلمن طلباتهن هذا الشهر',
      fr: '4 873 clientes livrées ce mois-ci',
      en: '4,873 customers delivered this month',
    },
    cta1: {
      ar: 'تصفحي الكولكشن',
      fr: 'Voir la collection',
      en: 'Browse collection',
    },
    cta2: {
      ar: 'حجابات جديدة',
      fr: 'Nouveaux hijabs',
      en: 'New hijabs',
    },
    trust1: { ar: 'شحن لـ 58 ولاية', fr: 'Livraison 58 wilayas', en: 'Delivery to 58 wilayas' },
    trust2: { ar: 'فتح الطرد قبل الدفع', fr: 'Vérification avant paiement', en: 'Inspect before paying' },
    trust3: { ar: 'تأكيد هاتفي 7 أيام', fr: 'Suivi téléphonique 7j/7', en: 'Phone support 7 days' },
  };

  const loc = locale as 'ar' | 'fr' | 'en';

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900 text-white">

      <div className="relative mx-auto max-w-5xl px-6 py-14 sm:py-20 text-center">
        {/* Social proof line — sits above the heading, says something real */}
        <p className="text-sm text-slate-400 mb-5">{t.proof[loc]}</p>

        {/* h1: solid white, no gradient, max 48px on desktop */}
        <h1 className="text-[28px] sm:text-[40px] lg:text-[48px] font-bold text-white leading-tight tracking-tight max-w-3xl mx-auto">
          {t.heading[loc]}
        </h1>

        <p className="mt-4 max-w-xl mx-auto text-[15px] text-slate-300 leading-relaxed">
          {t.sub[loc]}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/${locale}/produits`}
            className="inline-flex items-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {t.cta1[loc]}
          </Link>
          <Link
            href={`/${locale}/categories/hijabs`}
            className="inline-flex items-center rounded-xl border border-slate-600 bg-transparent px-6 py-3 text-sm font-semibold text-slate-200 transition-colors duration-150 ease-out hover:border-slate-400 hover:text-white"
          >
            {t.cta2[loc]}
          </Link>
        </div>

        {/* Trust bar */}
        <div
          className="mt-10 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400"
        >
          <div className="flex items-center justify-center gap-2">
            <Truck className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
            <span>{t.trust1[loc]}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
            <span>{t.trust2[loc]}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <PhoneCall className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
            <span>{t.trust3[loc]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
