'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  AdminLocale,
  AdminTranslations,
  adminTranslations,
} from './adminTranslations';

interface AdminLanguageContextType {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
  t: AdminTranslations;
  dir: 'rtl' | 'ltr';
}

const AdminLanguageContext = createContext<AdminLanguageContextType>({
  locale: 'ar',
  setLocale: () => {},
  t: adminTranslations.ar,
  dir: 'rtl',
});

export function AdminLanguageProvider({
  children,
  initialLocale = 'ar',
}: {
  children: React.ReactNode;
  initialLocale?: AdminLocale;
}) {
  const [locale, setLocaleState] = useState<AdminLocale>(initialLocale);

  // Sync from localStorage / cookies on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_locale') as AdminLocale | null;
      if (stored && (stored === 'ar' || stored === 'fr' || stored === 'en')) {
        setLocaleState(stored);
      } else {
        // Check cookie
        const match = document.cookie.match(/(?:^|;\s*)admin_locale=([^;]+)/);
        if (match && (match[1] === 'ar' || match[1] === 'fr' || match[1] === 'en')) {
          setLocaleState(match[1] as AdminLocale);
        }
      }
    } catch {
      // localStorage may fail in restricted iframes
    }
  }, []);

  const setLocale = (newLocale: AdminLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('admin_locale', newLocale);
      document.cookie = `admin_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  };

  const t = useMemo(() => adminTranslations[locale] || adminTranslations.ar, [locale]);
  const dir = t.dir;

  // Dynamically update document dir and lang when in admin
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return (
    <AdminLanguageContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage(): AdminLanguageContextType {
  const context = useContext(AdminLanguageContext);
  if (!context) {
    throw new Error('useAdminLanguage must be used within an AdminLanguageProvider');
  }
  return context;
}
