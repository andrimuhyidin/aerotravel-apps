/**
 * API: Insurance Manifests Management
 * GET /api/admin/insurance/manifests - List manifests
 * POST /api/admin/insurance/manifests - Generate manifest for trip
 * 
 * PRD 6.1.B: Auto-Insurance Manifest (Otomasi Asuransi)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const generateManifestSchema = z.object({
  tripId: z.string().uuid(),
  insuranceCompanyId: z.string().uuid().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const status = searchParams.get('status');
  const tripDate = searchParams.get('tripDate');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = withBranchFilter(
    client.from('insurance_manifests'),
    branchContext,
  )
    .select(
      `
      *,
      trips(code, name, departure_date),
      insurance_companies(name, email)
    `
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (tripDate) {
    query = query.eq('trip_date', tripDate);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch insurance manifests', error);
    return NextResponse.json({ error: 'Failed to fetch manifests' }, { status: 500 });
  }

  return NextResponse.json({ manifests: data || [] });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = generateManifestSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Call database function to generate manifest
  const { data: result, error } = await client.rpc('generate_insurance_manifest', {
    p_trip_id: body.tripId,
    p_insurance_company_id: body.insuranceCompanyId || null,
  });

  if (error) {
    logger.error('Failed to generate insurance manifest', error, {
      tripId: body.tripId,
    });
    return NextResponse.json(
      { error: 'Failed to generate manifest', details: error.message },
      { status: 500 }
    );
  }

  logger.info('Insurance manifest generated', {
    manifestId: result,
    tripId: body.tripId,
    userId: user.id,
  });

  return NextResponse.json({
    success: true,
    manifestId: result,
    tripId: body.tripId,
  });
});

