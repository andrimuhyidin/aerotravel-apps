/**
 * API: Admin - Auto Verify Documents and Approve (if eligible)
 * POST /api/admin/guide/license/applications/[id]/auto-verify-and-approve
 * Auto-verify documents and approve if guide meets all eligibility requirements
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;

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

  // Get application
  const { data: application } = await client
    .from('guide_license_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Check eligibility (reuse eligibility check logic)
  const guideId = application.guide_id;

  // Get user profile
  const { data: guideProfile } = await client
    .from('users')
    .select('*')
    .eq('id', guideId)
    .single();

  if (!guideProfile) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  // Check requirements
  const requirements: Record<string, boolean> = {};

  // 1. Profile complete
  requirements.profile_complete = !!(guideProfile.full_name && guideProfile.phone && guideProfile.nik);

  // 2. Contract signed
  requirements.contract_signed = guideProfile.is_contract_signed === true;

  // 3. Onboarding complete
  const { data: onboardingProgress } = await client
    .from('guide_onboarding_progress')
    .select('status, completion_percentage')
    .eq('guide_id', guideId)
    .maybeSingle();

  requirements.onboarding_complete =
    onboardingProgress?.status === 'completed' && onboardingProgress.completion_percentage >= 100;

  // 4. Emergency contact
  const { data: emergencyContacts } = await client
    .from('guide_emergency_contacts')
    .select('id')
    .eq('guide_id', guideId)
    .eq('is_active', true)
    .limit(1);

  requirements.emergency_contact = (emergencyContacts?.length || 0) > 0;

  // 5. Medical info
  const { data: medicalInfo } = await client
    .from('guide_medical_info')
    .select('id')
    .eq('guide_id', guideId)
    .maybeSingle();

  requirements.medical_info = !!medicalInfo;

  // 6. Bank account approved
  const { data: approvedBankAccount } = await client
    .from('guide_bank_accounts')
    .select('id')
    .eq('guide_id', guideId)
    .eq('status', 'approved')
    .limit(1);

  requirements.bank_account = (approvedBankAccount?.length || 0) > 0;

  // 7. Training complete
  let trainingComplete = true;
  try {
    const { data: requiredTrainings } = await client
      .from('guide_training_modules')
      .select('id')
      .eq('is_required', true)
      .eq('is_active', true);

    const { data: completedTrainings } = await client
      .from('guide_training_progress')
      .select('module_id')
      .eq('guide_id', guideId)
      .eq('status', 'completed');

    const completedModuleIds = (completedTrainings || []).map((t: { module_id: string }) => t.module_id);
    const requiredModuleIds = (requiredTrainings || []).map((t: { id: string }) => t.id);
    trainingComplete = requiredModuleIds.length === 0 || requiredModuleIds.every((id: string) => completedModuleIds.includes(id));
  } catch {
    trainingComplete = true; // Table might not exist
  }

  requirements.training_complete = trainingComplete;

  // 8. Assessment complete
  let assessmentComplete = true;
  try {
    const { data: assessments } = await client
      .from('guide_assessments')
      .select('id')
      .eq('guide_id', guideId)
      .eq('status', 'completed')
      .limit(1);

    assessmentComplete = (assessments?.length || 0) > 0;
  } catch {
    assessmentComplete = true; // Table might not exist
  }

  requirements.assessment_complete = assessmentComplete;

  // Check if all requirements met
  const allRequirementsMet = Object.values(requirements).every((met) => met);

  if (!allRequirementsMet) {
    return NextResponse.json({
      eligible: false,
      requirements,
      message: 'Not all requirements are met. Cannot auto-approve.',
    });
  }

  // Auto-verify documents if they exist in application
  const documents = application.documents || application.application_data?.documents || {};
  const verifiedDocuments: Record<string, { url?: string; verified: boolean; verified_at: string; verified_by: string }> = {};

  Object.entries(documents).forEach(([key, doc]: [string, unknown]) => {
    const docData = doc as { url?: string };
    if (docData?.url) {
      verifiedDocuments[key] = {
        url: docData.url,
        verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      };
    }
  });

  // Update application: verify documents and approve
  const { data: updatedApp, error: updateError } = await client
    .from('guide_license_applications')
    .update({
      documents: verifiedDocuments,
      status: 'approved',
      current_stage: 'approval',
      approval_decision: 'approved',
      approval_notes: 'Auto-approved: All eligibility requirements met',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to auto-approve application', updateError, { applicationId: id });
    return NextResponse.json({ error: 'Failed to auto-approve' }, { status: 500 });
  }

  logger.info('Application auto-approved', {
    applicationId: id,
    guideId,
    approvedBy: user.id,
  });

  return NextResponse.json({
    success: true,
    eligible: true,
    application: updatedApp,
    message: 'Application auto-approved. License can now be issued.',
  });
});
