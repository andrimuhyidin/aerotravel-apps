/**
 * Dynamic Sitemap Generation
 * Sesuai PRD 5.3.A - Programmatic SEO Architecture
 *
 * Generate sitemap untuk semua paket + kota kombinasi
 * Note: next-sitemap will handle this automatically via next-sitemap.config.js
 * This file is kept for Next.js built-in sitemap generation as fallback
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  // Get all packages
  const { data: packagesData } = await supabase
    .from('packages')
    .select('id, slug, updated_at')
    .eq('is_published', true);

  const packages = packagesData as
    | { id: string; slug: string; updated_at: string | null }[]
    | null;

  // Get all cities (dari database atau hardcoded list)
  const cities = [
    'jakarta',
    'surabaya',
    'bandung',
    'medan',
    'semarang',
    'makassar',
    'palembang',
    'lampung',
    'yogyakarta',
    'denpasar',
    // ... tambahkan lebih banyak kota
  ];

  const sitemap: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Booking page
    {
      url: `${baseUrl}/book`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Generate sitemap entries untuk setiap kombinasi paket + kota
  if (packages) {
    for (const pkg of packages) {
      for (const city of cities) {
        sitemap.push({
          url: `${baseUrl}/p/${city}/${pkg.slug}`,
          lastModified: pkg.updated_at ? new Date(pkg.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  }

  return sitemap;
}
