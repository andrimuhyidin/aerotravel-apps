/**
 * API: Admin - Approve License Application
 * PATCH /api/admin/guide/license/applications/[id]/approve - Approve application
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const approveSchema = z.object({
  approval_notes: z.string().optional(),
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
  const validated = approveSchema.parse(body);

  // Get application
  const { data: application } = await client
    .from('guide_license_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Check if ready for approval
  if (application.status !== 'training_completed' && application.status !== 'pending_approval') {
    return NextResponse.json(
      { error: 'Application is not ready for approval' },
      { status: 400 }
    );
  }

  // Auto-check eligibility before approval
  // If all requirements are met, we can fast-track
  // For now, admin still needs to manually approve for security

  // Update application
  const { data: updatedApp, error } = await client
    .from('guide_license_applications')
    .update({
      status: 'approved',
      current_stage: 'approval',
      approval_decision: 'approved',
      approval_notes: validated.approval_notes,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to approve application', error, { applicationId: id });
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
  }

  logger.info('Application approved', {
    applicationId: id,
    approvedBy: user.id,
  });

  return NextResponse.json({ application: updatedApp });
});
