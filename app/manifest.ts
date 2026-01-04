import { MetadataRoute } from 'next';

import { getAllSettings } from '@/lib/settings';

/**
 * Dynamic PWA Manifest
 * Generated from database settings
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getAllSettings(null);

  const appName = settings.branding?.app_name || 'MyAeroTravel';
  const shortName = settings.branding?.app_name?.split(' ')[0] || 'AeroTravel';
  const description =
    settings.seo?.default_description ||
    'Platform travel management terpercaya untuk pengalaman wisata bahari terbaik di Indonesia.';

  // Get theme color from customer app settings (default to primary color)
  const themeColor =
    settings.apps?.customer?.header_color ||
    settings.branding?.primary_color ||
    '#0066FF';

  return {
    name: `${appName} - Partner Portal`,
    short_name: shortName,
    description,
    start_url: '/partner/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: themeColor,
    orientation: 'portrait',
    icons: [
      {
        src: settings.branding?.favicon_url || '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: settings.branding?.logo_url || '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: settings.branding?.logo_url || '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['travel', 'business', 'productivity'],
    lang: settings.business?.locale || 'id-ID',
    dir: 'ltr',
    scope: '/',
  };
}

