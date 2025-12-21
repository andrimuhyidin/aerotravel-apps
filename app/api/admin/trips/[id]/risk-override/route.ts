/**
 * API: Risk Assessment Override
 * POST /api/admin/trips/[id]/risk-override - Admin override untuk blocked trips (risk_score > 70)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const overrideSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = overrideSchema.parse(await request.json());
  const client = supabase as unknown as any;

  // Get latest risk assessment
  const { data: assessment, error: assessmentError } = await client
    .from('pre_trip_assessments')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assessmentError || !assessment) {
    logger.error('Failed to fetch risk assessment', assessmentError, { tripId });
    return NextResponse.json({ error: 'Risk assessment not found' }, { status: 404 });
  }

  // Check if risk score > 70 (should be blocked)
  const riskScore = assessment.risk_score as number | null;
  if (riskScore === null || riskScore <= 70) {
    return NextResponse.json(
      { error: 'Trip tidak blocked. Risk score tidak melebihi threshold.' },
      { status: 400 }
    );
  }

  // Update assessment with admin override
  const { data: updatedAssessment, error: updateError } = await client
    .from('pre_trip_assessments')
    .update({
      is_safe: true,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      approval_reason: payload.reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessment.id)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to override risk assessment', updateError, { tripId, assessmentId: assessment.id });
    return NextResponse.json({ error: 'Failed to override assessment' }, { status: 500 });
  }

  // Log override to audit table
  try {
    const branchContext = await getBranchContext(user.id);
    await client.from('risk_assessment_overrides').insert({
      assessment_id: assessment.id,
      trip_id: tripId,
      guide_id: assessment.guide_id,
      branch_id: branchContext.branchId,
      risk_score: riskScore,
      override_by: user.id,
      override_reason: payload.reason,
      override_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to log override to audit table', error, {
      assessmentId: assessment.id,
      tripId,
    });
    // Continue even if audit logging fails
  }

  logger.info('Risk assessment overridden by admin', {
    tripId,
    assessmentId: assessment.id,
    riskScore,
    adminId: user.id,
    reason: payload.reason,
  });

  return NextResponse.json({
    success: true,
    assessment: updatedAssessment,
    message: 'Risk assessment telah di-override. Trip dapat dimulai.',
  });
});

