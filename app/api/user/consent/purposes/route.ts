/**
 * API: Consent Purposes
 * Route: /api/user/consent/purposes
 * Purpose: Get list of all consent purposes available
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getConsentPurposes } from '@/lib/pdp/consent-manager';

/**
 * GET /api/user/consent/purposes
 * Get all active consent purposes
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const purposes = await getConsentPurposes();

  return NextResponse.json({ purposes });
});

