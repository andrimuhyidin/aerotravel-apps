/**
 * API: Admin - Issue License
 * POST /api/admin/guide/license/applications/[id]/issue-license - Issue license after approval
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { env } from '@/lib/env';
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

  // Allow auto-issue if application is eligible (all requirements met)
  // Check eligibility first
  let isEligible = false;
  if (application.status !== 'approved') {
    // Check if we can auto-approve and issue
    try {
      // Quick eligibility check
      const { data: guideProfile } = await client
        .from('users')
        .select('is_contract_signed, nik, full_name, phone')
        .eq('id', application.guide_id)
        .single();

      const { data: onboardingProgress } = await client
        .from('guide_onboarding_progress')
        .select('status, completion_percentage')
        .eq('guide_id', application.guide_id)
        .maybeSingle();

      const { data: emergencyContact } = await client
        .from('guide_emergency_contacts')
        .select('id')
        .eq('guide_id', application.guide_id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const { data: medicalInfo } = await client
        .from('guide_medical_info')
        .select('id')
        .eq('guide_id', application.guide_id)
        .maybeSingle();

      const { data: approvedBank } = await client
        .from('guide_bank_accounts')
        .select('id')
        .eq('guide_id', application.guide_id)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();

      // Check if all basic requirements met
      isEligible =
        guideProfile?.is_contract_signed === true &&
        !!guideProfile?.nik &&
        !!guideProfile?.full_name &&
        !!guideProfile?.phone &&
        onboardingProgress?.status === 'completed' &&
        onboardingProgress.completion_percentage >= 100 &&
        !!emergencyContact &&
        !!medicalInfo &&
        !!approvedBank;

      // If eligible, auto-approve first
      if (isEligible && application.status !== 'approved') {
        await client
          .from('guide_license_applications')
          .update({
            status: 'approved',
            current_stage: 'approval',
            approval_decision: 'approved',
            approval_notes: 'Auto-approved: All eligibility requirements met',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          })
          .eq('id', id);
      }
    } catch (error) {
      logger.error('Failed to check eligibility for auto-approve', error, { applicationId: id });
    }

    if (!isEligible && application.status !== 'approved') {
      return NextResponse.json(
        { error: 'Application must be approved before issuing license' },
        { status: 400 }
      );
    }
  }

  // Check if license already issued
  if (application.license_id) {
    return NextResponse.json(
      { error: 'License already issued for this application' },
      { status: 400 }
    );
  }

  // Get guide info (branch_id)
  const { data: guideBranchInfo } = await client
    .from('users')
    .select('id, branch_id')
    .eq('id', application.guide_id)
    .single();

  if (!guideBranchInfo) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  // Generate card number: ATGL-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  const cardNumber = `ATGL-${dateStr}-${randomStr}`;

  // Generate verification token
  const verificationToken = randomUUID();

  // Generate QR code data
  const verificationUrl = `${env.NEXT_PUBLIC_APP_URL}/guide/verify/${verificationToken}`;
  const qrCodeData = JSON.stringify({
    type: 'guide_id_card',
    token: verificationToken,
    url: verificationUrl,
    card_number: cardNumber,
  });

  // Calculate expiry date (2 years from issue)
  const expiryDate = new Date(today);
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);

  // Create ID card
  const { data: idCard, error: idCardError } = await client
    .from('guide_id_cards')
    .insert({
      guide_id: application.guide_id,
      branch_id: guideBranchInfo.branch_id,
      card_number: cardNumber,
      issue_date: today.toISOString().slice(0, 10),
      expiry_date: expiryDate.toISOString().slice(0, 10),
      status: 'active',
      qr_code_data: qrCodeData,
      verification_token: verificationToken,
      issued_by: user.id,
    })
    .select()
    .single();

  if (idCardError) {
    logger.error('Failed to issue ID card', idCardError, { applicationId: id });
    return NextResponse.json({ error: 'Failed to issue ID card' }, { status: 500 });
  }

  // Update application
  await client
    .from('guide_license_applications')
    .update({
      license_id: idCard.id,
      status: 'license_issued',
      current_stage: 'issued',
    })
    .eq('id', id);

  logger.info('License issued', {
    cardNumber,
    applicationId: id,
    guideId: application.guide_id,
    issuedBy: user.id,
  });

  return NextResponse.json({
    id_card: idCard,
    qr_code_url: `/api/guide/id-card/qr-code`,
  });
});
