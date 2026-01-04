/**
 * API: Get Guide License Application
 * GET /api/guide/license/application - Get current guide's application
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

  // Verify user is guide
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get latest application
  const { data: application, error } = await client
    .from('guide_license_applications')
    .select('*')
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch license application', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }

  if (!application) {
    return NextResponse.json({ error: 'No application found' }, { status: 404 });
  }

  return NextResponse.json({ application });
});
