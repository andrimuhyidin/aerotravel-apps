/**
 * API: Admin - Reject License Application
 * PATCH /api/admin/guide/license/applications/[id]/reject - Reject application
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const rejectSchema = z.object({
  rejection_reason: z.string().min(1, 'Alasan penolakan wajib diisi'),
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin', 'finance_manager'].includes(
    userProfile?.role || ''
  );

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate input
  const validated = rejectSchema.parse(body);

  // Get application
  const { data: application } = await client
    .from('guide_license_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Update application
  const { data: updatedApp, error } = await client
    .from('guide_license_applications')
    .update({
      status: 'rejected',
      current_stage: 'rejected',
      approval_decision: 'rejected',
      rejected_by: user.id,
      rejected_at: new Date().toISOString(),
      rejection_reason: validated.rejection_reason,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to reject application', error, { applicationId: id });
    return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
  }

  logger.info('Application rejected', {
    applicationId: id,
    rejectedBy: user.id,
  });

  return NextResponse.json({ application: updatedApp });
});
