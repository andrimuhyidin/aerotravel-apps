/**
 * API: Safety Checklist Pre-Trip
 * POST /api/guide/safety-checklist - Save safety checklist before trip
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const safetyChecklistSchema = z.object({
  tripId: z.string().uuid().optional(),
  checkedItems: z.array(z.string()),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = safetyChecklistSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId, checkedItems } = payload;

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Insert safety checklist record
  const { data: checklist, error: checklistError } = await withBranchFilter(
    client.from('safety_checklists'),
    branchContext,
  )
    .insert({
      guide_id: user.id,
      trip_id: tripId || null,
      branch_id: branchContext.branchId,
      checked_items: checkedItems,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (checklistError) {
    logger.error('Safety checklist creation failed', checklistError, {
      guideId: user.id,
      tripId,
      checkedItems,
    });
    return NextResponse.json({ error: 'Failed to save safety checklist' }, { status: 500 });
  }

  logger.info('Safety checklist completed', {
    checklistId: checklist.id,
    guideId: user.id,
    tripId,
    checkedItemsCount: checkedItems.length,
  });

  return NextResponse.json({
    success: true,
    checklistId: checklist.id,
  });
});
