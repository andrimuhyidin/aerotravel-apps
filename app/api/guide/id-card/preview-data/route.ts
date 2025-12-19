/**
 * API: Get ID Card Preview Data (for locked preview)
 * GET /api/guide/id-card/preview-data - Get user data for preview when no card exists
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

  // Get user profile with additional fields
  // Note: email is in auth.users, not in users table
  const { data: userProfile, error: profileError } = await client
    .from('users')
    .select('full_name, avatar_url, branch_id, phone, nik')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    logger.error('Failed to fetch user profile in preview-data', profileError, { userId: user.id });
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }

  if (!userProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

  return NextResponse.json({
    guide_name: userProfile.full_name || 'Guide',
    photo_url: userProfile.avatar_url || null,
    branch_name: branchName,
    phone: userProfile.phone || null,
    email: user?.email || null,
    nik: userProfile.nik || null,
  });
});
