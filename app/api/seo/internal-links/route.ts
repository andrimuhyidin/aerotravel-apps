/**
 * Internal Links API
 * Returns suggested internal links for a given page
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getLinkSuggestions } from '@/lib/seo/link-suggestions';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const currentPage = searchParams.get('currentPage') || '';
  const type = searchParams.get('type') || 'related';
  const category = searchParams.get('category') || '';
  const limit = parseInt(searchParams.get('limit') || '4', 10);

  logger.info('Fetching internal links', { currentPage, type, category, limit });

  const suggestions = await getLinkSuggestions({
    currentPage,
    category: category || undefined,
    limit,
  });

  return NextResponse.json(suggestions);
});

