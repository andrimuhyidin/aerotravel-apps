/**
 * API: Process Trip Payment
 * POST /api/admin/guide/trips/[id]/process-payment - Process payment for completed trip
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { processTripPayment } from '@/lib/guide/contract-payment';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();

  // Check admin role
  const isAuthorized = await hasRole([
    'super_admin',
    'ops_admin',
    'finance_manager',
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: tripId } = await context.params;
  const body = (await request.json()) as { guide_id?: string };
  const client = supabase as unknown as any;

  // Get trip assignment
  let assignmentQuery = client
    .from('trip_guides')
    .select('guide_id, fee_amount, check_out_at')
    .eq('trip_id', tripId);

  if (body.guide_id) {
    assignmentQuery = assignmentQuery.eq('guide_id', body.guide_id);
  }

  const { data: assignments, error: assignmentError } = await assignmentQuery;

  if (assignmentError || !assignments || assignments.length === 0) {
    return NextResponse.json(
      { error: 'Trip assignment not found' },
      { status: 404 }
    );
  }

  // Process payment for each guide
  const results = await Promise.allSettled(
    assignments.map((assignment: { guide_id: string; fee_amount: number; check_out_at: string | null }) => {
      if (!assignment.check_out_at) {
        return Promise.resolve({
          success: false,
          error: 'Trip not completed yet',
        });
      }
      return processTripPayment(tripId, assignment.guide_id);
    })
  );

  const successful: string[] = [];
  const failed: Array<{ guideId: string; error: string }> = [];

  results.forEach((result, index) => {
    const assignment = assignments[index] as { guide_id: string };
    if (result.status === 'fulfilled' && result.value.success) {
      successful.push(assignment.guide_id);
    } else {
      failed.push({
        guideId: assignment.guide_id,
        error:
          result.status === 'rejected'
            ? result.reason?.message || 'Unknown error'
            : result.value.error || 'Unknown error',
      });
    }
  });

  logger.info('Trip payment processing completed', {
    tripId,
    successful: successful.length,
    failed: failed.length,
  });

  return NextResponse.json({
    success: successful.length > 0,
    successful,
    failed,
    message:
      successful.length > 0
        ? `Payment processed for ${successful.length} guide(s)`
        : 'No payments processed',
  });
});
