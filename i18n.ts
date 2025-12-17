/**
 * i18n Configuration
 * Internationalization setup for next-intl
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

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

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

