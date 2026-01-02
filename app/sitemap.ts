/**
 * Dynamic Sitemap Generation
 * Sesuai PRD 5.3.A - Programmatic SEO Architecture
 *
 * Generate sitemap untuk semua halaman termasuk SEO pages
 */

import 'server-only';

import { MetadataRoute } from 'next';

import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const sitemap: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of locales) {
    // Homepage
    sitemap.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    });

    // Booking page
    sitemap.push({
      url: `${baseUrl}/${locale}/book`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });

    // Packages listing
    sitemap.push({
      url: `${baseUrl}/${locale}/packages`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });

    // About page
    sitemap.push({
      url: `${baseUrl}/${locale}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    });

    // Contact page
    sitemap.push({
      url: `${baseUrl}/${locale}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    });

    // Help page
    sitemap.push({
      url: `${baseUrl}/${locale}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    });

    // Loyalty page
    sitemap.push({
      url: `${baseUrl}/${locale}/loyalty`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    });

    // Referral page
    sitemap.push({
      url: `${baseUrl}/${locale}/referral`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    });

    // Partner landing
    sitemap.push({
      url: `${baseUrl}/${locale}/partner`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });

    // Corporate landing
    sitemap.push({
      url: `${baseUrl}/${locale}/corporate`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });

    // Guide landing
    sitemap.push({
      url: `${baseUrl}/${locale}/guide`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });

    // Legal pages
    sitemap.push({
      url: `${baseUrl}/${locale}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    });

    sitemap.push({
      url: `${baseUrl}/${locale}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    });
  }

  // Get all published packages for detail pages
  const { data: packagesData } = await supabase
    .from('packages')
    .select('slug, updated_at')
    .eq('is_published', true);

  const packages = packagesData as
    | { slug: string; updated_at: string | null }[]
    | null;

  if (packages) {
    for (const pkg of packages) {
      for (const locale of locales) {
        // Standard package detail page
        sitemap.push({
          url: `${baseUrl}/${locale}/packages/detail/${pkg.slug}`,
          lastModified: pkg.updated_at ? new Date(pkg.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  }

  // Get all SEO pages (programmatic SEO)
  const { data: seoPages } = await supabase
    .from('seo_pages')
    .select('slug, origin_city, updated_at')
    .eq('is_published', true);

  const seoPagesData = seoPages as
    | { slug: string; origin_city: string; updated_at: string | null }[]
    | null;

  if (seoPagesData) {
    for (const page of seoPagesData) {
      for (const locale of locales) {
        // SEO landing page: /packages/from/[city]/[slug]
        sitemap.push({
          url: `${baseUrl}/${locale}/packages/from/${page.origin_city}/${page.slug}`,
          lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  }

  return sitemap;
}
