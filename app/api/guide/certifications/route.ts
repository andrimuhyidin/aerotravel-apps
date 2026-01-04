/**
 * API: Guide Certifications
 * GET /api/guide/certifications - Get guide certifications
 * POST /api/guide/certifications - Upload new certification
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const certificationSchema = z.object({
  certification_type: z.enum(['sim_kapal', 'first_aid', 'alin', 'other']),
  certification_name: z.string().min(1).max(200),
  certificate_number: z.string().optional(),
  issuing_authority: z.string().optional(),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  document_url: z.string().url().optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get certifications for current guide
  let query = client
    .from('guide_certifications_tracker')
    .select('*')
    .eq('guide_id', user.id)
    .order('expiry_date', { ascending: true });

  if (branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  const { data: certifications, error } = await query;

  if (error) {
    logger.error('Failed to fetch certifications', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }

  // Check validity status
  const { data: isValid } = await client.rpc('check_guide_certifications_valid', {
    guide_uuid: user.id,
  });

  return NextResponse.json({
    certifications: certifications || [],
    is_valid: isValid || false,
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = certificationSchema.parse(await request.json());

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

  const client = supabase as unknown as any;

  // Validate dates
  const issuedDate = new Date(payload.issued_date);
  const expiryDate = new Date(payload.expiry_date);

  if (expiryDate < issuedDate) {
    return NextResponse.json({ error: 'Expiry date must be after issued date' }, { status: 400 });
  }

  // Insert certification
  const { data: certification, error } = await withBranchFilter(
    client.from('guide_certifications_tracker'),
    branchContext,
  )
    .insert({
      guide_id: user.id,
      branch_id: branchContext.branchId,
      certification_type: payload.certification_type,
      certification_name: payload.certification_name,
      certificate_number: payload.certificate_number || null,
      issuing_authority: payload.issuing_authority || null,
      issued_date: payload.issued_date,
      expiry_date: payload.expiry_date,
      document_url: payload.document_url || null,
      notes: payload.notes || null,
      status: 'pending',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create certification', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to create certification' }, { status: 500 });
  }

  logger.info('Certification created', {
    certificationId: certification.id,
    guideId: user.id,
    type: payload.certification_type,
  });

  return NextResponse.json(
    {
      success: true,
      certification,
    },
    { status: 201 },
  );
});
