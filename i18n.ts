/**
 * i18n Configuration
 * Internationalization setup for next-intl
 */

import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['id', 'en'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'id';

// Locale configuration
export const localeConfig = {
  locales,
  defaultLocale,
  localePrefix: 'always' as const, // Always show locale in URL: /id/..., /en/...
};

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from requestLocale (next-intl v4 breaking change)
  let locale = await requestLocale;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Asia/Jakarta',
  };
});

