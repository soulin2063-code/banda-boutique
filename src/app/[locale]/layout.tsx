import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { StoreHeader } from '@/components/layout/StoreHeader';
import { StoreFooter } from '@/components/layout/StoreFooter';
import '../globals.css';

export const metadata: Metadata = {
  title: 'ShopDZ | متجر إلكتروني جزائري، الدفع عند الاستلام',
  description: 'منصة التجارة الإلكترونية الجزائرية مع توصيل سريع لـ 58 ولاية والدفع عند الاستلام',
};

const locales = ['ar', 'fr', 'en'] as const;
type Locale = (typeof locales)[number];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      lang={locale}
      dir={dir}
      className="min-h-screen bg-[#FAF7F5] text-[#1A1615] font-sans antialiased flex flex-col selection:bg-[#E4B8AD]/40 selection:text-[#1A1615] relative overflow-x-hidden"
    >
      {/* Ambient Feminine Luxury Aura (Soft blur orbs in background) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 -start-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#E4B8AD]/20 via-[#FDF5F2]/40 to-transparent blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -end-40 w-[28rem] h-[28rem] rounded-full bg-gradient-to-bl from-[#C59B76]/15 via-[#EAE1D9]/30 to-transparent blur-3xl animate-float-reverse" />
        <div className="absolute bottom-20 start-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-[#E4B8AD]/15 to-transparent blur-3xl animate-float-slow" />
      </div>

      <NextIntlClientProvider messages={messages} locale={locale}>
        <div className="relative z-10 flex flex-col min-h-screen">
          <StoreHeader locale={locale} />
          <div className="flex-1">{children}</div>
          <StoreFooter locale={locale} />
        </div>
      </NextIntlClientProvider>
    </div>
  );
}
