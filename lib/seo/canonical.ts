/**
 * Canonical URL Helper
 * Ensures all pages have canonical URLs to prevent duplicate content
 */

import { env } from '@/lib/env';

/**
 * Generate canonical URL for a page
 * Handles locale prefixes automatically
 */
export function getCanonicalUrl(path: string, locale: string = 'id'): string {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  // Remove leading/trailing slashes and ensure single leading slash
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const fullPath = cleanPath ? `/${locale}/${cleanPath}` : `/${locale}`;
  
  return `${baseUrl}${fullPath}`;
}

/**
 * Generate canonical URL without locale (for root pages)
 */
export function getCanonicalUrlWithoutLocale(path: string): string {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const fullPath = cleanPath ? `/${cleanPath}` : '/';
  
  return `${baseUrl}${fullPath}`;
}

