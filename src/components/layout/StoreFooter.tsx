'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, PhoneCall } from 'lucide-react';

interface StoreFooterProps {
  locale: string;
}

export function StoreFooter({ locale }: StoreFooterProps) {
  const isArabic = locale === 'ar';

  const features = [
    {
      icon: Truck,
      title: isArabic ? 'توصيل لـ 58 ولاية' : 'Livraison 58 wilayas',
      desc:  isArabic ? 'لباب المنزل أو المكتب' : 'À domicile ou en bureau',
    },
    {
      icon: ShieldCheck,
      title: isArabic ? 'الدفع عند الاستلام' : 'Paiement cash (COD)',
      desc:  isArabic ? 'افتح الطرد قبل الدفع' : 'Vérifiez avant de payer',
    },
    {
      icon: PhoneCall,
      title: isArabic ? 'تأكيد هاتفي' : 'Confirmation rapide',
      desc:  isArabic ? 'نتصل بك لتأكيد العنوان' : 'Appel de confirmation client',
    },
  ];

  return (
    <footer className="border-t border-[#EAE1D9] bg-gradient-to-b from-[#FAF7F5] to-[#F5EFEB] pb-24 md:pb-12 pt-14 text-[#8C7F77]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Features row with soft shadow pills */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 border-b border-[#EAE1D9] pb-10">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#EAE1D9] shrink-0 text-[#1A1615] shadow-xs">
                <f.icon className="h-5 w-5 text-[#C59B76]" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1A1615]">{f.title}</h4>
                <p className="text-xs text-[#8C7F77] mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1615]">Banda</span>
              <span className="text-[10px] uppercase tracking-widest text-[#C59B76] font-semibold">Haute Élégance</span>
            </div>
            <p className="text-xs text-[#8C7F77] leading-relaxed">
              {isArabic
                ? 'متجر أزياء محتشمة وأنثوية راقية، نجمع بين فخامة التصميم وأصالة الخامات، مع توصيل لـ 58 ولاية والدفع عند الاستلام.'
                : 'Boutique de haute couture féminine et modeste avec livraison sur 58 wilayas et paiement à la livraison.'}
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#141414] mb-3">
              {isArabic ? 'الأقسام' : 'Collections'}
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={`/${locale}/categories/hijabs`} className="hover:text-[#141414] transition-colors">
                  {isArabic ? 'حجابات حرير وجيرسي' : 'Hijabs Soie & Jersey'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/categories/abayas`} className="hover:text-[#141414] transition-colors">
                  {isArabic ? 'عبايات دبي كلاسيكية' : 'Abayas Dubai'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/categories/robes-modestes`} className="hover:text-[#141414] transition-colors">
                  {isArabic ? 'فساتين محتشمة' : 'Robes Modestes'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/categories/ensembles`} className="hover:text-[#141414] transition-colors">
                  {isArabic ? 'أطقم صيفية' : 'Ensembles'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#141414] mb-3">
              {isArabic ? 'التوصيل والطلب' : 'Service Client'}
            </h5>
            <ul className="space-y-2 text-xs">
              <li>{isArabic ? 'توصيل لـ 58 ولاية (24 - 72 ساعة)' : 'Livraison 58 wilayas (24-72h)'}</li>
              <li>{isArabic ? 'الدفع نقداً عند الاستلام (COD)' : 'Paiement cash à la livraison'}</li>
              <li>{isArabic ? 'معاينة الطرد قبل الدفع' : 'Vérification avant paiement'}</li>
              <li>{isArabic ? 'استبدال المقاس متوفر' : 'Échange de taille disponible'}</li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#141414] mb-3">
              {isArabic ? 'طلب سريع' : 'Commande Rapide'}
            </h5>
            <p className="text-xs text-[#8A8275] leading-relaxed mb-3">
              {isArabic
                ? 'لا تحتاج إلى حساب أو بطاقة بنكية. اختر المنتج وأدخل اسمك ورقم هاتفك وسنتصل بك.'
                : 'Sans carte bancaire. Choisissez votre article et indiquez votre téléphone pour confirmation.'}
            </p>
            <Link
              href={`/${locale}/produits`}
              className="inline-block rounded-full bg-[#141414] text-white px-4 py-2 text-xs font-bold hover:bg-[#B89368] transition-colors"
            >
              {isArabic ? 'ابدأ التسوق الآن' : 'Découvrir la collection'}
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[#E8E1D7] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A8275]">
          <p>© {new Date().getFullYear()} Banda. {isArabic ? 'جميع الحقوق محفوظة' : 'Tous droits réservés'}.</p>
          <p>{isArabic ? 'توصيل معتمد لكافة ولايات الجزائر' : "Développé pour l'Algérie"}</p>
        </div>
      </div>
    </footer>
  );
}
