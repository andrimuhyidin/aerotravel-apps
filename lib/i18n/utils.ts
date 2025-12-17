/**
 * i18n Utilities
 * Helper functions for i18n operations
 */

import { getLocale, getTranslations } from 'next-intl/server';
import { createTranslator } from 'next-intl';

/**
 * Get current locale in server component
 */
export async function getCurrentLocale(): Promise<string> {
  return await getLocale();
}

/**
 * Get translations in server component
 * 
 * @example
 * const t = await getServerTranslations('Booking');
 * const text = t('submit_btn');
 */
export async function getServerTranslations(namespace?: string) {
  const locale = await getLocale();
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return createTranslator({ locale, messages, namespace });
}

/**
 * Get locale-aware URL
 * Adds locale prefix to path
 * 
 * @example
 * const url = getLocalizedUrl('/book', 'id'); // '/id/book'
 */
export function getLocalizedUrl(path: string, locale: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${locale}/${cleanPath}`;
}

/**
 * Remove locale from pathname
 * 
 * @example
 * const path = removeLocale('/id/book'); // '/book'
 */
export function removeLocale(pathname: string, locales: string[]): string {
  const segments = pathname.split('/');
  if (segments[1] && locales.includes(segments[1])) {
    return '/' + segments.slice(2).join('/');
  }
  return pathname;
}

