/**
 * API: Guide Status
 * GET  /api/guide/status   - get current status & next availability
 * POST /api/guide/status   - update current_status & note
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createErrorResponse } from '@/lib/api/response-format';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const guideStatusUpdateSchema = z.object({
  status: z.enum(['standby', 'on_trip', 'not_available']),
  note: z.string().optional(),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse('Unauthorized', undefined, undefined, 401);
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  let statusQuery = client.from('guide_status').select('guide_id, current_status, note, updated_at').eq('guide_id', user.id);
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    statusQuery = statusQuery.eq('branch_id', branchContext.branchId);
  }
  const { data: statusRow } = await statusQuery.maybeSingle();

  let availabilityQuery = client.from('guide_availability')
    .select('id, available_from, available_until, status, reason')
    .eq('guide_id', user.id)
    .gte('available_until', new Date().toISOString())
    .order('available_from', { ascending: true })
    .limit(3);
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    availabilityQuery = availabilityQuery.eq('branch_id', branchContext.branchId);
  }
  const { data: upcoming } = await availabilityQuery;

  return NextResponse.json({
    status: statusRow ?? {
      guide_id: user.id,
      current_status: 'standby',
      note: null,
      updated_at: null,
    },
    upcoming: upcoming ?? [],
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse('Unauthorized', undefined, undefined, 401);
  }

  const payload = guideStatusUpdateSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const upsertData: Record<string, unknown> = {
    guide_id: user.id,
    current_status: payload.status,
    note: payload.note ?? null,
    updated_at: new Date().toISOString(),
  };
  
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    upsertData.branch_id = branchContext.branchId;
  }

  const { error } = await client.from('guide_status').upsert(upsertData);

  if (error) {
    logger.error('Failed to update guide_status', error, { guideId: user.id });
    return createErrorResponse('Failed to update status', 'DATABASE_ERROR', error, 500);
  }

  logger.info('Guide status updated', { guideId: user.id, status: payload.status });

  return NextResponse.json({ success: true });
});
