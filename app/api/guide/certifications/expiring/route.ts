/**
 * API: Get Expiring Certifications
 * GET /api/guide/certifications/expiring - Get certifications expiring within 30 days
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

  // Get expiring certifications (H-30) using database function
  const { data: expiringCerts, error: functionError } = await client.rpc('get_expiring_certifications', {
    days_ahead: 30,
  });

  if (functionError) {
    logger.error('Failed to get expiring certifications', functionError, { guideId: user.id });
    
    // Fallback: manual query
    const { data: certifications, error: queryError } = await client
      .from('guide_certifications_tracker')
      .select('id, certification_type, certification_name, expiry_date, status')
      .eq('guide_id', user.id)
      .eq('status', 'verified')
      .eq('is_active', true)
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (queryError) {
      logger.error('Failed to query expiring certifications', queryError, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch expiring certifications' }, { status: 500 });
    }

    const expiring = (certifications || []).map((cert: { expiry_date: string; certification_type: string }) => {
      const expiryDate = new Date(cert.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...cert,
        days_until_expiry: daysUntilExpiry,
      };
    });

    return NextResponse.json({
      expiring: expiring || [],
      count: expiring?.length || 0,
    });
  }

  // Filter for current user
  const userExpiringCerts = (expiringCerts || []).filter(
    (cert: { guide_id: string }) => cert.guide_id === user.id,
  );

  return NextResponse.json({
    expiring: userExpiringCerts || [],
    count: userExpiringCerts?.length || 0,
  });
});

