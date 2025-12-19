/**
 * API: Auto-check License Eligibility and Auto-Issue
 * POST /api/guide/license/auto-check - Check if guide is eligible and auto-issue if all requirements met
 * This endpoint can be called periodically or when requirements are completed
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get eligibility data (reuse logic from eligibility endpoint)
  // For now, we'll just return eligibility status
  // Auto-issuance can be implemented as a background job or webhook

  // Check if guide already has active license
  const { data: existingLicense } = await client
    .from('guide_id_cards')
    .select('id, status')
    .eq('guide_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (existingLicense) {
    return NextResponse.json({
      eligible: true,
      has_license: true,
      message: 'License already exists',
    });
  }

  // Check if has approved application
  const { data: approvedApp } = await client
    .from('guide_license_applications')
    .select('id, status')
    .eq('guide_id', user.id)
    .eq('status', 'approved')
    .maybeSingle();

  if (approvedApp) {
    // Auto-issue license for approved application
    // This would trigger the issue-license endpoint logic
    // For now, we'll just return that it can be issued
    return NextResponse.json({
      eligible: true,
      has_approved_application: true,
      application_id: approvedApp.id,
      message: 'Application approved, license can be issued',
      can_auto_issue: true,
    });
  }

  return NextResponse.json({
    eligible: false,
    message: 'Check eligibility requirements',
  });
});
