/**
 * API: About Page Content (Public)
 * GET /api/about - Get all about page content
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getAboutContent } from '@/lib/cms/about';

export const GET = withErrorHandler(async () => {
  const content = await getAboutContent();
  return NextResponse.json({ content });
});

