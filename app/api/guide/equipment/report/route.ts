/**
 * API: Equipment Report (Damage/Repair)
 * POST /api/guide/equipment/report - Report equipment issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const reportSchema = z.object({
  equipmentChecklistId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  equipmentName: z.string(),
  equipmentType: z.string().optional(),
  issueType: z.enum(['damage', 'missing', 'needs_repair', 'low_stock']),
  description: z.string(),
  photoUrl: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = reportSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  if (!branchContext.branchId) {
    return NextResponse.json({ error: 'Branch context required for this operation' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('guide_equipment_reports')
    .insert({
      equipment_checklist_id: payload.equipmentChecklistId || null,
      trip_id: payload.tripId || null,
      guide_id: user.id,
      branch_id: branchContext.branchId,
      equipment_name: payload.equipmentName,
      equipment_type: payload.equipmentType || null,
      issue_type: payload.issueType,
      description: payload.description,
      photo_url: payload.photoUrl || null,
      severity: payload.severity || 'medium',
      status: 'reported',
    } as any)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create equipment report', error, {
      guideId: user.id,
      tripId: payload.tripId,
    });
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }

  logger.info('Equipment report created', {
    reportId: data.id,
    guideId: user.id,
    tripId: payload.tripId,
    issueType: payload.issueType,
  });

  return NextResponse.json({
    success: true,
    report: data,
  });
});

