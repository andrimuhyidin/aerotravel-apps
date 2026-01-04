/**
 * API: Legal Pages (Public)
 * GET /api/legal-pages/[type] - Get active legal page for public display
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getLegalPage } from '@/lib/cms/legal-pages';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ type: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { type } = await context.params;

  if (!['terms', 'privacy', 'dpo'].includes(type)) {
    return NextResponse.json({ error: 'Invalid page type' }, { status: 400 });
  }

  const page = await getLegalPage(type as 'terms' | 'privacy' | 'dpo');

  if (!page) {
    logger.warn(`Legal page not found: ${type}`);
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  return NextResponse.json({ page });
});

