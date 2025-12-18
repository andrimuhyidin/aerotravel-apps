/**
 * API: Guide Availability
 * POST /api/guide/availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const availabilitySchema = z.object({
  availableFrom: z.string().min(1),
  availableUntil: z.string().min(1),
  status: z.enum(['available', 'not_available']),
  reason: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = availabilitySchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const { error } = await withBranchFilter(
    client.from('guide_availability'),
    branchContext,
  ).insert({
    guide_id: user.id,
    available_from: payload.availableFrom,
    available_until: payload.availableUntil,
    status: payload.status,
    reason: payload.reason ?? null,
  });

  if (error) {
    logger.error('Failed to insert guide_availability', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 });
  }

  logger.info('Guide availability created', {
    guideId: user.id,
    availableFrom: payload.availableFrom,
    availableUntil: payload.availableUntil,
  });

  return NextResponse.json({ success: true });
});
