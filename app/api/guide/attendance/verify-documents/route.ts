import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/guide/attendance/verify-documents
 * Verify guide's ID card and certifications before check-in
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const guideId = searchParams.get('guideId') || user.id;

  // Check ID Card validity
  const { data: idCard } = await supabase
    .from('guide_id_cards')
    .select('id, card_number, valid_until, status, is_active')
    .eq('guide_id', guideId)
    .eq('is_active', true)
    .single();

  const now = new Date();
  const idCardValid =
    idCard && idCard.status === 'active' && new Date(idCard.valid_until) > now;

  const idCardExpiringDays = idCard
    ? Math.ceil(
        (new Date(idCard.valid_until).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Check certifications validity
  const { data: certifications } = await supabase
    .from('guide_certifications_tracker')
    .select('certification_type, certification_name, expiry_date, status')
    .eq('guide_id', guideId)
    .eq('is_active', true);

  const validCerts =
    certifications?.filter((cert) => {
      return cert.status === 'verified' && new Date(cert.expiry_date) > now;
    }) || [];

  const expiringCerts =
    certifications?.filter((cert) => {
      const daysUntilExpiry = Math.ceil(
        (new Date(cert.expiry_date).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return (
        cert.status === 'verified' &&
        daysUntilExpiry <= 7 &&
        daysUntilExpiry > 0
      );
    }) || [];

  const expiredCerts =
    certifications?.filter((cert) => {
      return new Date(cert.expiry_date) <= now || cert.status === 'expired';
    }) || [];

  // Required certifications: SIM Kapal, First Aid, ALIN
  const requiredTypes = ['sim_kapal', 'first_aid', 'alin'];
  const hasAllRequired = requiredTypes.every((type) =>
    validCerts.some((cert) => cert.certification_type === type)
  );

  const canCheckIn = idCardValid && hasAllRequired && expiredCerts.length === 0;

  const result = {
    canCheckIn,
    idCard: {
      valid: idCardValid,
      expiringDays: idCardExpiringDays,
      cardNumber: idCard?.card_number,
      validUntil: idCard?.valid_until,
      status: idCard?.status,
    },
    certifications: {
      total: certifications?.length || 0,
      valid: validCerts.length,
      expiring: expiringCerts.length,
      expired: expiredCerts.length,
      hasAllRequired,
      requiredTypes,
      details: certifications || [],
    },
    warnings: [] as string[],
    blockers: [] as string[],
  };

  // Build warnings and blockers
  if (!idCardValid) {
    result.blockers.push('ID Card tidak valid atau sudah expired');
  } else if (idCardExpiringDays !== null && idCardExpiringDays <= 7) {
    result.warnings.push(
      `ID Card akan expired dalam ${idCardExpiringDays} hari`
    );
  }

  if (!hasAllRequired) {
    const missingTypes = requiredTypes.filter(
      (type) => !validCerts.some((cert) => cert.certification_type === type)
    );
    result.blockers.push(
      `Sertifikasi tidak lengkap: ${missingTypes.join(', ')}`
    );
  }

  if (expiredCerts.length > 0) {
    const expiredNames = expiredCerts
      .map((c) => c.certification_name)
      .join(', ');
    result.blockers.push(`Sertifikasi expired: ${expiredNames}`);
  }

  if (expiringCerts.length > 0) {
    expiringCerts.forEach((cert) => {
      const days = Math.ceil(
        (new Date(cert.expiry_date).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      result.warnings.push(
        `${cert.certification_name} akan expired dalam ${days} hari`
      );
    });
  }

  logger.info('Document verification checked', {
    guideId,
    canCheckIn,
    blockers: result.blockers.length,
    warnings: result.warnings.length,
  });

  return NextResponse.json(result);
});
