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
export const GET = withErrorHandler(async (_request: NextRequest) => {
  const purposes = await getConsentPurposes();

  // Transform to match frontend expected format
  const formattedPurposes = purposes.map((p) => ({
    code: p.purposeCode,
    name: p.purposeName,
    description: p.description,
    isMandatory: p.isMandatory,
    category: p.category,
  }));

  return NextResponse.json({ purposes: formattedPurposes });
});

