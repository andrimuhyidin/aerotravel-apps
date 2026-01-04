/**
 * API: FAQs (Public)
 * GET /api/faqs - Get active FAQs with filters
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getFAQs } from '@/lib/cms/faqs';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const app_type = searchParams.get('app_type') || undefined;
  const category = searchParams.get('category') || undefined;
  const package_id = searchParams.get('package_id') || undefined;

  const filters = {
    ...(app_type && { app_type }),
    ...(category && { category }),
    ...(package_id && { package_id }),
  };

  const faqs = await getFAQs(filters);

  return NextResponse.json({ faqs });
});

