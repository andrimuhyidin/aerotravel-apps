/**
 * API: SEO Page Generation Cron Job
 * GET /api/cron/generate-seo
 *
 * This endpoint should be called by Vercel Cron or external cron service
 * Schedule: Weekly on Sunday at 03:00 WIB (20:00 UTC Saturday)
 *
 * Generates AI-powered SEO pages for all package + city combinations
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { isFeatureEnabled } from '@/lib/feature-flags/posthog-flags';
import { generateAllSEOPages } from '@/lib/seo/generate-pages';
import { logger } from '@/lib/utils/logger';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.warn('[Cron SEO] CRON_SECRET not configured, allowing request');
    return true; // Allow if not configured (for development)
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info('[Cron SEO] Starting SEO page generation');

    // Check feature flag
    const seoEnabled = isFeatureEnabled('programmatic-seo');
    if (!seoEnabled) {
      logger.info('[Cron SEO] Programmatic SEO feature is disabled');
      return NextResponse.json(
        {
          success: false,
          message: 'Programmatic SEO feature is disabled',
        },
        { status: 503 }
      );
    }

    // Parse optional query params for customization
    const { searchParams } = new URL(request.url);
    const batchSize = parseInt(searchParams.get('batchSize') || '10', 10);
    const delayMs = parseInt(searchParams.get('delayMs') || '2000', 10);

    // Generate SEO pages
    const result = await generateAllSEOPages({
      batchSize,
      delayMs,
    });

    logger.info('[Cron SEO] SEO page generation completed', result);

    return NextResponse.json({
      success: true,
      message: `Generated ${result.success} SEO pages`,
      ...result,
    });
  } catch (error) {
    logger.error('[Cron SEO] Fatal error in SEO generation', error);
    return NextResponse.json(
      {
        error: 'Fatal error in SEO generation',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

/**
 * POST endpoint for manual trigger with options
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      batchSize = 10,
      delayMs = 2000,
      cities,
    } = body as {
      batchSize?: number;
      delayMs?: number;
      cities?: string[];
    };

    logger.info('[Cron SEO] Manual SEO page generation triggered', {
      batchSize,
      delayMs,
      cityCount: cities?.length,
    });

    // Check feature flag
    const seoEnabled = isFeatureEnabled('programmatic-seo');
    if (!seoEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: 'Programmatic SEO feature is disabled',
        },
        { status: 503 }
      );
    }

    // Generate SEO pages with custom options
    const result = await generateAllSEOPages({
      batchSize,
      delayMs,
      cities,
    });

    logger.info('[Cron SEO] Manual SEO generation completed', result);

    return NextResponse.json({
      success: true,
      message: `Generated ${result.success} SEO pages`,
      ...result,
    });
  } catch (error) {
    logger.error('[Cron SEO] Fatal error in manual SEO generation', error);
    return NextResponse.json(
      {
        error: 'Fatal error in SEO generation',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

