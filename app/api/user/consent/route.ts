/**
 * API: User Consent Management
 * Route: /api/user/consent
 * Purpose: Manage user consents per purpose (UU PDP 2022 compliance)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  getUserConsents,
  recordConsent,
  withdrawConsent,
  getUserConsentSummary,
} from '@/lib/pdp/consent-manager';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const recordConsentSchema = z.object({
  purposeCode: z.string().min(1),
  consentGiven: z.boolean(),
});

const withdrawConsentSchema = z.object({
  purposeCode: z.string().min(1),
  reason: z.string().optional(),
});

/**
 * GET /api/user/consent
 * Get user's consent status for all purposes
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'full'; // 'full' or 'summary'

  if (format === 'summary') {
    const summary = await getUserConsentSummary(user.id);
    return NextResponse.json({ consents: summary });
  }

  const consents = await getUserConsents(user.id);
  return NextResponse.json({ consents });
});

/**
 * POST /api/user/consent
 * Record new consent decision
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
  const parsed = recordConsentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { purposeCode, consentGiven } = parsed.data;

  // Get client metadata
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  const success = await recordConsent(user.id, purposeCode, consentGiven, {
    ipAddress: ipAddress || undefined,
    userAgent: userAgent || undefined,
  });

  if (!success) {
    return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 });
  }

  logger.info('User consent recorded via API', { userId: user.id, purposeCode, consentGiven });

  return NextResponse.json({
    success: true,
    message: 'Consent recorded successfully',
  });
});

/**
 * DELETE /api/user/consent
 * Withdraw consent for a purpose
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = withdrawConsentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { purposeCode, reason } = parsed.data;

  const success = await withdrawConsent(user.id, purposeCode, reason);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to withdraw consent. This might be a mandatory consent.' },
      { status: 400 }
    );
  }

  logger.info('User consent withdrawn via API', { userId: user.id, purposeCode });

  return NextResponse.json({
    success: true,
    message: 'Consent withdrawn successfully',
  });
});

