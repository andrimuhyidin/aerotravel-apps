/**
 * API: Guide ID Card
 * GET /api/guide/id-card - Get current guide's ID card
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Verify user is guide and get profile with additional fields
  // Note: email is in auth.users, not in users table
  const { data: userProfile, error: profileError } = await client
    .from('users')
    .select('role, full_name, avatar_url, branch_id, phone, nik')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    logger.error('Failed to fetch user profile', profileError, { userId: user.id });
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }

  if (!userProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (userProfile.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get branch name
  let branchName = 'AeroTravel';
  if (userProfile.branch_id) {
    const { data: branch } = await client
      .from('branches')
      .select('name')
      .eq('id', userProfile.branch_id)
      .maybeSingle();
    if (branch?.name) {
      branchName = branch.name;
    }
  }

  // Get active ID card
  const { data: idCard, error } = await client
    .from('guide_id_cards')
    .select('*')
    .eq('guide_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch ID card', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch ID card' }, { status: 500 });
  }

  if (!idCard) {
    return NextResponse.json({ error: 'No active ID card found' }, { status: 404 });
  }

  // Check if expired
  const today = new Date();
  const expiryDate = new Date(idCard.expiry_date);
  const isExpired = today > expiryDate;

  if (isExpired && idCard.status === 'active') {
    // Auto-update status to expired
    await client
      .from('guide_id_cards')
      .update({ status: 'expired' })
      .eq('id', idCard.id);
    
    idCard.status = 'expired';
  }

  return NextResponse.json({
    id_card: idCard,
    qr_code_url: idCard.qr_code_url,
    download_url: `/api/guide/id-card/download`,
    is_expired: isExpired,
    days_until_expiry: isExpired ? 0 : Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    // User profile data for preview
    guide_name: userProfile.full_name || 'Guide',
    photo_url: userProfile.avatar_url || null,
    branch_name: branchName,
    phone: userProfile.phone || null,
    email: user?.email || null,
    nik: userProfile.nik || null,
  });
});
