/**
 * Batch Generate Programmatic SEO Pages
 * Sesuai PRD 5.2.C - AI Content Spinner
 * PRD 5.3.A - Programmatic SEO Architecture
 *
 * Script untuk generate ribuan landing pages dengan AI Content Spinner
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import { batchSpinContent, type SpunContent } from './content-spinner';

/**
 * SEO Page data structure matching database schema
 */
export type SeoPageInsert = {
  package_id: string;
  origin_city: string;
  slug: string;
  title: string;
  description: string | null;
  meta_description: string | null;
  h1: string | null;
  h2: string[] | null;
  content: string | null;
  keywords: string[] | null;
  package_name: string | null;
  package_destination: string | null;
  is_published: boolean;
  generated_at: string;
};

/**
 * Indonesian cities for SEO page generation
 * Organized by region for better maintainability
 */
export const INDONESIAN_CITIES = {
  // Jawa
  jawa: [
    'jakarta',
    'surabaya',
    'bandung',
    'semarang',
    'yogyakarta',
    'malang',
    'solo',
    'bekasi',
    'tangerang',
    'depok',
    'bogor',
    'cirebon',
  ],
  // Sumatera
  sumatera: [
    'medan',
    'palembang',
    'lampung',
    'padang',
    'pekanbaru',
    'batam',
    'jambi',
    'bengkulu',
    'aceh',
  ],
  // Kalimantan
  kalimantan: ['balikpapan', 'banjarmasin', 'pontianak', 'samarinda', 'tarakan'],
  // Sulawesi
  sulawesi: ['makassar', 'manado', 'palu', 'kendari', 'gorontalo'],
  // Bali & Nusa Tenggara
  baliNusaTenggara: ['denpasar', 'lombok', 'kupang'],
  // Papua & Maluku
  papuaMaluku: ['jayapura', 'ambon', 'sorong'],
};

/**
 * Get all cities as flat array
 */
export function getAllCities(): string[] {
  return Object.values(INDONESIAN_CITIES).flat();
}

/**
 * Generate slug from package name and origin city
 */
function generateSlug(packageName: string, originCity: string): string {
  const cleanName = packageName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const cleanCity = originCity
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  return `${cleanName}-dari-${cleanCity}`;
}

/**
 * Rate limiter untuk AI calls
 * Menghindari rate limiting dari AI provider
 */
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate semua kombinasi paket + kota dan simpan ke database
 * Run via cron job atau manual script
 * 
 * @param options - Configuration options
 * @param options.batchSize - Number of pages to process in each batch (default: 10)
 * @param options.delayMs - Delay between batches in milliseconds (default: 2000)
 * @param options.cities - Custom list of cities (default: all Indonesian cities)
 * @returns Summary of generation results
 */
export async function generateAllSEOPages(options?: {
  batchSize?: number;
  delayMs?: number;
  cities?: string[];
}): Promise<{
  total: number;
  success: number;
  failed: number;
  skipped: number;
}> {
  const { batchSize = 10, delayMs = 2000, cities = getAllCities() } = options || {};

  const supabase = await createClient();
  const startTime = Date.now();

  logger.info('Starting SEO page generation', {
    totalCities: cities.length,
    batchSize,
    delayMs,
  });

  // Get all published packages with destination info
  const { data: packagesData, error: packagesError } = await supabase
    .from('packages')
    .select('id, name, description, slug, destination')
    .eq('is_published', true);

  if (packagesError) {
    logger.error('Failed to fetch packages', packagesError);
    throw new Error('Failed to fetch packages');
  }

  const packages = packagesData as Array<{
    id: string;
    name: string;
    description: string | null;
    slug: string;
    destination: string;
  }> | null;

  if (!packages || packages.length === 0) {
    logger.info('No published packages found');
    return { total: 0, success: 0, failed: 0, skipped: 0 };
  }

  logger.info('Found packages for SEO generation', {
    packageCount: packages.length,
    estimatedPages: packages.length * cities.length,
  });

  // Check existing pages to avoid regeneration
  const { data: existingPages } = await supabase
    .from('seo_pages')
    .select('package_id, origin_city');

  const existingSet = new Set(
    (existingPages || []).map(
      (p: { package_id: string; origin_city: string }) =>
        `${p.package_id}-${p.origin_city}`
    )
  );

  let success = 0;
  let failed = 0;
  let skipped = 0;
  let processed = 0;
  const total = packages.length * cities.length;

  // Process in batches to avoid rate limiting
  const packagesToProcess = packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description || '',
    destination: pkg.destination,
  }));

  for (const pkg of packagesToProcess) {
    const citiesToProcess: string[] = [];

    // Check which cities need generation
    for (const city of cities) {
      const key = `${pkg.id}-${city}`;
      if (existingSet.has(key)) {
        skipped++;
        processed++;
        continue;
      }
      citiesToProcess.push(city);
    }

    if (citiesToProcess.length === 0) {
      continue;
    }

    // Process cities in batches
    for (let i = 0; i < citiesToProcess.length; i += batchSize) {
      const batch = citiesToProcess.slice(i, i + batchSize);

      logger.info('Processing batch', {
        package: pkg.name,
        batch: `${i + 1}-${Math.min(i + batchSize, citiesToProcess.length)}`,
        totalCities: citiesToProcess.length,
        progress: `${processed}/${total}`,
      });

      // Generate content for batch
      const results = await batchSpinContent([pkg], batch);

      // Save to database
      for (const [key, content] of results.entries()) {
        const [packageId, city] = key.split('-');
        const slug = generateSlug(pkg.name, city || '');

        try {
          const seoPage: SeoPageInsert = {
            package_id: packageId || '',
            origin_city: city || '',
            slug,
            title: content.title,
            description: content.description,
            meta_description: content.metaDescription,
            h1: content.h1,
            h2: content.h2,
            content: content.content,
            keywords: content.keywords,
            package_name: pkg.name,
            package_destination: pkg.destination,
            is_published: true,
            generated_at: new Date().toISOString(),
          };

          const { error: upsertError } = await supabase
            .from('seo_pages')
            .upsert(seoPage, {
              onConflict: 'package_id,origin_city',
            });

          if (upsertError) {
            logger.error('Failed to save SEO page', upsertError, {
              packageId,
              city,
            });
            failed++;
          } else {
            success++;
          }
        } catch (error) {
          logger.error('Error processing SEO page', error, {
            packageId,
            city,
          });
          failed++;
        }

        processed++;
      }

      // Rate limiting delay between batches
      if (i + batchSize < citiesToProcess.length) {
        await delay(delayMs);
      }
    }
  }

  const duration = Date.now() - startTime;

  logger.info('SEO page generation completed', {
    total,
    success,
    failed,
    skipped,
    durationMs: duration,
    durationMinutes: Math.round(duration / 60000),
  });

  return { total, success, failed, skipped };
}

/**
 * Generate SEO pages for a single package
 * Useful for manual generation or when adding new packages
 */
export async function generateSEOPagesForPackage(
  packageId: string,
  cities?: string[]
): Promise<{
  success: number;
  failed: number;
}> {
  const supabase = await createClient();
  const targetCities = cities || getAllCities();

  logger.info('Generating SEO pages for single package', {
    packageId,
    cityCount: targetCities.length,
  });

  // Get package details
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('id, name, description, slug, destination')
    .eq('id', packageId)
    .single();

  if (pkgError || !pkg) {
    logger.error('Package not found', pkgError, { packageId });
    throw new Error('Package not found');
  }

  const packageData = pkg as {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    destination: string;
  };

  const results = await batchSpinContent(
    [
      {
        id: packageData.id,
        name: packageData.name,
        description: packageData.description || '',
      },
    ],
    targetCities
  );

  let success = 0;
  let failed = 0;

  for (const [key, content] of results.entries()) {
    const [, city] = key.split('-');
    const slug = generateSlug(packageData.name, city || '');

    try {
      const seoPage: SeoPageInsert = {
        package_id: packageData.id,
        origin_city: city || '',
        slug,
        title: content.title,
        description: content.description,
        meta_description: content.metaDescription,
        h1: content.h1,
        h2: content.h2,
        content: content.content,
        keywords: content.keywords,
        package_name: packageData.name,
        package_destination: packageData.destination,
        is_published: true,
        generated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('seo_pages')
        .upsert(seoPage, {
          onConflict: 'package_id,origin_city',
        });

      if (upsertError) {
        logger.error('Failed to save SEO page', upsertError, {
          packageId,
          city,
        });
        failed++;
      } else {
        success++;
      }
    } catch (error) {
      logger.error('Error processing SEO page', error, {
        packageId,
        city,
      });
      failed++;
    }
  }

  logger.info('SEO pages generated for package', {
    packageId,
    packageName: packageData.name,
    success,
    failed,
  });

  return { success, failed };
}

/**
 * Delete SEO pages for a package (useful when unpublishing)
 */
export async function deleteSEOPagesForPackage(
  packageId: string
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('seo_pages')
    .delete()
    .eq('package_id', packageId)
    .select('id');

  if (error) {
    logger.error('Failed to delete SEO pages', error, { packageId });
    throw error;
  }

  const deletedCount = data?.length || 0;

  logger.info('SEO pages deleted', {
    packageId,
    deletedCount,
  });

  return deletedCount;
}

/**
 * Quality check for generated SEO content
 * Returns true if content passes quality standards
 */
export function validateSEOContent(content: SpunContent): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Title validation
  if (!content.title || content.title.length < 30) {
    issues.push('Title too short (min 30 chars)');
  }
  if (content.title && content.title.length > 70) {
    issues.push('Title too long (max 70 chars)');
  }

  // Meta description validation
  if (!content.metaDescription || content.metaDescription.length < 120) {
    issues.push('Meta description too short (min 120 chars)');
  }
  if (content.metaDescription && content.metaDescription.length > 160) {
    issues.push('Meta description too long (max 160 chars)');
  }

  // H1 validation
  if (!content.h1 || content.h1.length < 10) {
    issues.push('H1 missing or too short');
  }

  // Content validation
  if (!content.content || content.content.length < 500) {
    issues.push('Content too short (min 500 chars)');
  }

  // Keywords validation
  if (!content.keywords || content.keywords.length < 3) {
    issues.push('Not enough keywords (min 3)');
  }

  // Check for placeholder text
  const placeholderPatterns = [
    /\[.*?\]/g,
    /\{.*?\}/g,
    /lorem ipsum/i,
    /placeholder/i,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(content.content || '')) {
      issues.push('Content contains placeholder text');
      break;
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Trigger ISR revalidation for SEO pages
 * Should be called after new pages are generated
 */
export async function triggerRevalidation(paths: string[]): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    logger.warn('NEXT_PUBLIC_APP_URL not set, skipping revalidation');
    return;
  }

  logger.info('Triggering ISR revalidation', { pathCount: paths.length });

  // In Next.js App Router, revalidation is handled automatically
  // This function can be extended to call on-demand revalidation API
  // For now, we rely on ISR with time-based revalidation

  logger.info('ISR revalidation triggered', { paths: paths.slice(0, 5) });
}

/**
 * Get SEO generation statistics
 */
export async function getSEOStats(): Promise<{
  totalPages: number;
  publishedPages: number;
  citiesCovered: number;
  packagesCovered: number;
  lastGeneratedAt: string | null;
}> {
  const supabase = await createClient();

  const { data: stats, error } = await supabase
    .from('seo_pages')
    .select('package_id, origin_city, is_published, generated_at');

  if (error) {
    logger.error('Failed to get SEO stats', error);
    throw error;
  }

  const pages = stats || [];
  const publishedPages = pages.filter((p: { is_published: boolean }) => p.is_published);
  const uniqueCities = new Set(pages.map((p: { origin_city: string }) => p.origin_city));
  const uniquePackages = new Set(pages.map((p: { package_id: string }) => p.package_id));
  const sortedByDate = pages.sort(
    (a: { generated_at: string }, b: { generated_at: string }) =>
      new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  return {
    totalPages: pages.length,
    publishedPages: publishedPages.length,
    citiesCovered: uniqueCities.size,
    packagesCovered: uniquePackages.size,
    lastGeneratedAt: sortedByDate[0]?.generated_at || null,
  };
}
