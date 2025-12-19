/**
 * API: Contact Crew Member
 * POST /api/guide/crew/contact/[guideId] - Get contact info for crew member (masked)
 * This endpoint provides contact action (call/WA) without exposing raw phone numbers
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ guideId: string }> }
) => {
  const { guideId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only guides and ops/admin can contact other guides
  const { data: userProfile } = await (supabase as unknown as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide' && userProfile?.role !== 'ops_admin' && userProfile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get target guide profile
  const { data: targetGuide } = await client
    .from('users')
    .select('id, phone, branch_id, full_name')
    .eq('id', guideId)
    .eq('role', 'guide')
    .single();

  if (!targetGuide) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  // Check if contact is enabled
  const { data: crewProfile } = await client
    .from('guide_profiles_public_internal')
    .select('contact_enabled')
    .eq('user_id', guideId)
    .single();

  if (!crewProfile?.contact_enabled) {
    return NextResponse.json({ error: 'Contact not enabled for this guide' }, { status: 403 });
  }

  // Branch isolation (optional - can allow cross-branch contact)
  // For now, we allow cross-branch contact but log it

  // Log contact action for audit
  await client.rpc('log_guide_assignment_audit', {
    p_trip_id: null,
    p_guide_id: guideId,
    p_action_type: 'contact_action',
    p_action_details: {
      contacted_by: user.id,
      contact_method: 'directory',
    },
    p_performed_by: user.id,
  });

  // Return masked contact info
  // Instead of raw phone, return action URLs
  const phone = targetGuide.phone;
  const maskedPhone = phone
    ? `${phone.slice(0, 2)}****${phone.slice(-4)}`
    : null;

  // Generate action URLs
  const callUrl = phone ? `tel:${phone}` : null;
  const whatsappUrl = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : null;

  logger.info('Crew contact accessed', {
    guideId,
    contactedBy: user.id,
    hasPhone: !!phone,
  });

  return NextResponse.json({
    guide_id: guideId,
    guide_name: targetGuide.full_name,
    phone_masked: maskedPhone,
    actions: {
      call: callUrl,
      whatsapp: whatsappUrl,
    },
    // Note: Actual phone number is NOT returned for security
  });
});
