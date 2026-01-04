/**
 * On-Demand ISR Revalidation API
 * POST /api/revalidate - Trigger revalidation for specific paths
 *
 * Used to regenerate statically generated pages when content changes
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

// Verify revalidation secret
function verifySecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-revalidation-secret');
  const expectedSecret = process.env.REVALIDATION_SECRET;

  if (!expectedSecret) {
    logger.warn('REVALIDATION_SECRET not configured');
    return false;
  }

  return secret === expectedSecret;
}

/**
 * POST /api/revalidate
 * Trigger on-demand revalidation
 *
 * Body:
 * {
 *   paths?: string[];      // Specific paths to revalidate
 *   tags?: string[];       // Cache tags to revalidate
 *   type?: 'packages' | 'seo' | 'all';  // Predefined revalidation groups
 * }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify secret
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    paths?: string[];
    tags?: string[];
    type?: 'packages' | 'seo' | 'all';
  };

  logger.info('POST /api/revalidate', body);

  const revalidatedPaths: string[] = [];
  const revalidatedTags: string[] = [];

  try {
    // Revalidate specific paths
    if (body.paths && body.paths.length > 0) {
      for (const path of body.paths) {
        revalidatePath(path);
        revalidatedPaths.push(path);
      }
    }

    // Revalidate cache tags
    if (body.tags && body.tags.length > 0) {
      for (const tag of body.tags) {
        revalidateTag(tag);
        revalidatedTags.push(tag);
      }
    }

    // Handle predefined types
    if (body.type) {
      switch (body.type) {
        case 'packages':
          // Revalidate all package-related pages
          revalidatePath('/id/packages');
          revalidatePath('/en/packages');
          revalidateTag('packages');
          revalidatedPaths.push('/[locale]/packages');
          revalidatedTags.push('packages');
          break;

        case 'seo':
          // Revalidate SEO pages
          revalidatePath('/id/packages/from/[city]/[slug]', 'page');
          revalidatePath('/en/packages/from/[city]/[slug]', 'page');
          revalidateTag('seo-pages');
          revalidatedPaths.push('/[locale]/packages/from/[city]/[slug]');
          revalidatedTags.push('seo-pages');
          break;

        case 'all':
          // Full site revalidation
          revalidatePath('/', 'layout');
          revalidatedPaths.push('/');
          break;
      }
    }

    logger.info('Revalidation completed', {
      paths: revalidatedPaths,
      tags: revalidatedTags,
    });

    return NextResponse.json({
      success: true,
      revalidated: {
        paths: revalidatedPaths,
        tags: revalidatedTags,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Revalidation failed', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/revalidate
 * Health check for revalidation endpoint
 */
export const GET = withErrorHandler(async () => {
  return NextResponse.json({
    status: 'ok',
    message: 'Revalidation endpoint ready',
    usage: {
      method: 'POST',
      headers: { 'x-revalidation-secret': 'YOUR_SECRET' },
      body: {
        paths: ['Optional array of paths to revalidate'],
        tags: ['Optional array of cache tags'],
        type: 'Optional: packages | seo | all',
      },
    },
  });
});

