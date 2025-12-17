/**
 * Batch Generate Programmatic SEO Pages
 * Sesuai PRD 5.2.C - AI Content Spinner
 * PRD 5.3.A - Programmatic SEO Architecture
 *
 * Script untuk generate ribuan landing pages dengan AI Content Spinner
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { batchSpinContent } from './content-spinner';

/**
 * Generate semua kombinasi paket + kota dan simpan ke database
 * Run via cron job atau manual script
 */
export async function generateAllSEOPages() {
  const supabase = await createClient();

  // Get all published packages
  const { data: packagesData } = await supabase
    .from('packages')
    .select('id, name, description, slug')
    .eq('is_published', true);

  const packages = packagesData as
    | { id: string; name: string; description: string | null; slug: string }[]
    | null;

  if (!packages || packages.length === 0) {
    console.log('No packages found');
    return;
  }

  // List kota asal (bisa dari database atau hardcoded)
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
    'balikpapan',
    'padang',
    'pekanbaru',
    'banjarmasin',
    'pontianak',
    // ... tambahkan lebih banyak
  ];

  // Generate content untuk setiap kombinasi
  const results = await batchSpinContent(
    packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || '',
    })),
    cities
  );

  // Save ke database (table: seo_pages)
  // TODO: Create seo_pages table in migration
  for (const [key, content] of results.entries()) {
    const [packageId, city] = key.split('-');

    // @ts-expect-error - seo_pages table not in types yet
    await supabase.from('seo_pages').upsert({
      package_id: packageId,
      origin_city: city,
      title: content.title,
      description: content.description,
      meta_description: content.metaDescription,
      h1: content.h1,
      h2: content.h2,
      content: content.content,
      keywords: content.keywords,
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`Generated ${results.size} SEO pages`);
}
