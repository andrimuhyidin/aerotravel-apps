/**
 * API: Bulk Consent Recording
 * Route: /api/user/consent/bulk
 * Purpose: Record multiple consents at once (signup flow)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { recordBulkConsents } from '@/lib/pdp/consent-manager';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const bulkConsentSchema = z.object({
  consents: z.array(
    z.object({
      purposeCode: z.string(),
      consentGiven: z.boolean(),
    })
  ),
});

/**
 * POST /api/user/consent/bulk
 * Record multiple consents at once
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bulkConsentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { consents } = parsed.data;

  // Get client metadata
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  const success = await recordBulkConsents(user.id, consents, {
    ipAddress: ipAddress || undefined,
    userAgent: userAgent || undefined,
  });

  if (!success) {
    return NextResponse.json({ error: 'Failed to record consents' }, { status: 500 });
  }

  logger.info('Bulk consents recorded via API', { userId: user.id, count: consents.length });

  return NextResponse.json({
    success: true,
    message: 'All consents recorded successfully',
  });
});

