/**
 * Package Search API - Quick search untuk dashboard
 * Search packages by name or destination
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = sanitizeSearchParams(request);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!query || query.length < 2) {
    return NextResponse.json({ packages: [] });
  }

  const supabase = await createClient();

  // Get current user and branch
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner } = await verifyPartnerAccess(user.id);
  if (!isPartner) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('branch_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.branch_id) {
    return NextResponse.json(
      { error: 'Partner profile not found' },
      { status: 404 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('packages')
      .select(
        `
        id,
        name,
        destination,
        duration_days,
        base_nta_price,
        base_publish_price
      `
      )
      .eq('branch_id', profile.branch_id)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,destination.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;

    const packages = data?.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      destination: pkg.destination || 'Unknown',
      durationDays: pkg.duration_days || 1,
      baseNTAPrice: pkg.base_nta_price || 0,
      basePublishPrice: pkg.base_publish_price || 0,
    }));

    return NextResponse.json({ packages: packages || [] });
  } catch (error) {
    logger.error('Failed to search packages', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
});

