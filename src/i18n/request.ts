import { getRequestConfig } from 'next-intl/server';

export const locales = ['ar', 'fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'ar';
  }

  return {
    locale,
    messages: (await import(`./${locale}.json`)).default
  };
});
