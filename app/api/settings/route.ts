/**
 * Public Settings API
 * GET /api/settings
 * Returns all public settings (is_public = true)
 * No authentication required
 * Cached response
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getAllSettings } from '@/lib/settings';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const branchId = searchParams.get('branch_id');
  const format = searchParams.get('format'); // 'grouped' or 'flat' (default: grouped)

  try {
    if (format === 'flat') {
      // Return flat structure for backward compatibility
      const { getAllPublicSettings } = await import('@/lib/settings');
      const settings = await getAllPublicSettings(branchId || null);

      logger.debug('Public settings fetched (flat)', {
        count: Object.keys(settings).length,
        branchId,
      });

      return NextResponse.json(
        { settings },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    // Return grouped structure (default)
    const settings = await getAllSettings(branchId || null);

    logger.debug('Public settings fetched (grouped)', {
      branchId,
    });

    return NextResponse.json(
      { settings },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch public settings', error, { branchId });
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
});

