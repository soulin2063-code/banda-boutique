'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface BackButtonProps {
  locale?: string;
  fallbackUrl?: string;
  label?: string;
  className?: string;
}

export function BackButton({
  locale = 'ar',
  fallbackUrl,
  label,
  className = '',
}: BackButtonProps) {
  const router = useRouter();
  const isArabic = locale === 'ar';

  const defaultLabel = isArabic ? 'رجوع' : 'Retour';
  const displayLabel = label || defaultLabel;

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else if (fallbackUrl) {
      router.push(fallbackUrl);
    } else {
      router.push(`/${locale}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-150 ease-out hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-600 ${className}`}
      aria-label={displayLabel}
    >
      {isArabic ? (
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{displayLabel}</span>
    </button>
  );
}
