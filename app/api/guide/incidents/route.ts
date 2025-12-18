/**
 * API: Incident Reports
 * POST /api/guide/incidents - Create incident report
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const incidentSchema = z.object({
  incidentType: z.enum(['accident', 'injury', 'equipment_damage', 'weather_issue', 'complaint', 'other']),
  chronology: z.string().min(10, 'Kronologi minimal 10 karakter'),
  witnesses: z.string().optional(),
  photoUrls: z.array(z.string().url()).optional(),
  tripId: z.string().uuid().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = incidentSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { incidentType, chronology, witnesses, photoUrls, tripId } = payload;

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Insert incident report
  const { data: report, error: reportError } = await withBranchFilter(
    client.from('incident_reports'),
    branchContext,
  )
    .insert({
      guide_id: user.id,
      trip_id: tripId || null,
      branch_id: branchContext.branchId,
      incident_type: incidentType,
      chronology,
      witnesses: witnesses || null,
      photo_urls: photoUrls || [],
      status: 'reported',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (reportError) {
    logger.error('Incident report creation failed', reportError, {
      guideId: user.id,
      tripId,
      incidentType,
    });
    return NextResponse.json({ error: 'Failed to create incident report' }, { status: 500 });
  }

  logger.info('Incident report created', {
    reportId: report.id,
    guideId: user.id,
    tripId,
    incidentType,
  });

  return NextResponse.json({
    success: true,
    reportId: report.id,
  });
});
