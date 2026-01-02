/**
 * API: Near-Miss Reports
 * POST /api/guide/near-miss - Create near-miss report
 * GET /api/guide/near-miss - Get guide's near-miss reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { sanitizeInput } from '@/lib/utils/sanitize';

const nearMissSchema = z.object({
  tripId: z.string().uuid().optional(),
  incidentDate: z.string(), // ISO date string
  location: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  potentialConsequence: z.string().optional(),
  contributingFactors: z.array(z.string()).optional(),
  correctiveActions: z.string().optional(),
  potentialSeverity: z.enum(['minor', 'moderate', 'major', 'critical']).optional(),
  likelihood: z.enum(['unlikely', 'possible', 'likely']).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validation = nearMissSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const data = validation.data;
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Sanitize inputs
  const sanitizedData = {
    trip_id: data.tripId || null,
    guide_id: user.id,
    branch_id: branchContext.branchId,
    incident_date: data.incidentDate,
    location: data.location ? sanitizeInput(data.location) : null,
    description: sanitizeInput(data.description),
    potential_consequence: data.potentialConsequence
      ? sanitizeInput(data.potentialConsequence)
      : null,
    contributing_factors: data.contributingFactors || [],
    corrective_actions: data.correctiveActions
      ? sanitizeInput(data.correctiveActions)
      : null,
    potential_severity: data.potentialSeverity || 'minor',
    likelihood: data.likelihood || 'unlikely',
    status: 'reported',
  };

  const { data: report, error } = await withBranchFilter(
    client.from('near_miss_reports'),
    branchContext
  )
    .insert(sanitizedData)
    .select('id, incident_date, status')
    .single();

  if (error) {
    logger.error('Failed to create near-miss report', error, {
      guideId: user.id,
      incidentDate: data.incidentDate,
    });
    return NextResponse.json(
      { error: 'Failed to create near-miss report' },
      { status: 500 }
    );
  }

  logger.info('Near-miss report created', {
    reportId: report.id,
    guideId: user.id,
    incidentDate: data.incidentDate,
  });

  return NextResponse.json({
    success: true,
    reportId: report.id,
    incidentDate: report.incident_date,
    status: report.status,
  });
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  let query = withBranchFilter(
    client
      .from('near_miss_reports')
      .select('*')
      .eq('guide_id', user.id)
      .order('incident_date', { ascending: false }),
    branchContext
  );

  if (tripId) {
    query = query.eq('trip_id', tripId);
  }

  const { data: reports, error } = await query.limit(limit);

  if (error) {
    logger.error('Failed to fetch near-miss reports', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch near-miss reports' },
      { status: 500 }
    );
  }

  return NextResponse.json({ reports: reports || [] });
});

