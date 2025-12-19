/**
 * API: Check Certification Validity
 * GET /api/guide/certifications/check-validity - Check if guide has all required valid certifications
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

  // Check validity using function
  const { data: isValid, error: functionError } = await client.rpc('check_guide_certifications_valid', {
    guide_uuid: user.id,
  });

  if (functionError) {
    logger.error('Failed to check certification validity', functionError, { guideId: user.id });
    // Fallback: manual check
    const requiredTypes = ['sim_kapal', 'first_aid', 'alin'];
    const { data: certifications } = await client
      .from('guide_certifications_tracker')
      .select('certification_type, status, expiry_date')
      .eq('guide_id', user.id)
      .in('certification_type', requiredTypes)
      .eq('is_active', true);

    const validCerts = (certifications || []).filter(
      (cert: { status: string; expiry_date: string }) =>
        cert.status === 'verified' && new Date(cert.expiry_date) >= new Date(),
    );

    const hasAllRequired = requiredTypes.every((type) =>
      validCerts.some((cert: { certification_type: string }) => cert.certification_type === type),
    );

    return NextResponse.json({
      is_valid: hasAllRequired,
      missing_types: requiredTypes.filter(
        (type) => !validCerts.some((cert: { certification_type: string }) => cert.certification_type === type),
      ),
      certifications: validCerts,
    });
  }

  // Get expiring certifications (H-30)
  const { data: expiringCerts } = await client.rpc('get_expiring_certifications', {
    days_ahead: 30,
  });

  const userExpiringCerts = (expiringCerts || []).filter(
    (cert: { guide_id: string }) => cert.guide_id === user.id,
  );

  return NextResponse.json({
    is_valid: isValid || false,
    expiring_soon: userExpiringCerts,
    days_until_expiry: userExpiringCerts.length > 0 ? userExpiringCerts[0]?.days_until_expiry : null,
  });
});
