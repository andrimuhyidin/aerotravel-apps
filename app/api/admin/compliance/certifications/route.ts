/**
 * API: Certification Compliance Report
 * GET /api/admin/compliance/certifications - Get certification compliance report
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  // Check admin role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId');
  const includeExpired = searchParams.get('includeExpired') === 'true';

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get all guides with certifications
  const { data: certifications, error } = await client
    .from('guide_certifications_tracker')
    .select(
      `
      id,
      guide_id,
      certification_type,
      certification_name,
      expiry_date,
      status,
      is_active,
      guide:users!guide_certifications_tracker_guide_id_fkey(
        id,
        full_name,
        email
      )
    `
    )
    .eq('is_active', true)
    .order('expiry_date', { ascending: true });

  if (error) {
    logger.error('Failed to fetch certifications', error);
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }

  // Filter by branch if specified
  let filteredCerts = certifications || [];
  if (branchId) {
    filteredCerts = filteredCerts.filter((cert: any) => cert.branch_id === branchId);
  } else if (branchContext.branchId && !branchContext.isSuperAdmin) {
    filteredCerts = filteredCerts.filter((cert: any) => cert.branch_id === branchContext.branchId);
  }

  // Calculate compliance stats
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: filteredCerts.length,
    valid: 0,
    expiringSoon: 0, // Expires within 30 days
    expired: 0,
    pending: 0,
  };

  const complianceData = filteredCerts.map((cert: any) => {
    const expiryDate = cert.expiry_date ? new Date(cert.expiry_date) : null;
    let status: 'valid' | 'expiring_soon' | 'expired' | 'pending' = 'pending';

    if (expiryDate) {
      if (expiryDate < now) {
        status = 'expired';
        stats.expired++;
      } else if (expiryDate <= thirtyDaysFromNow) {
        status = 'expiring_soon';
        stats.expiringSoon++;
      } else {
        status = 'valid';
        stats.valid++;
      }
    } else {
      stats.pending++;
    }

    return {
      id: cert.id,
      guideId: cert.guide_id,
      guideName: cert.guide?.full_name || 'Unknown',
      guideEmail: cert.guide?.email || null,
      certificationType: cert.certification_type,
      certificationName: cert.certification_name,
      expiryDate: cert.expiry_date,
      status: cert.status,
      complianceStatus: status,
      daysUntilExpiry: expiryDate
        ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    };
  });

  // Filter out expired if not requested
  const finalData = includeExpired
    ? complianceData
    : complianceData.filter((item: { complianceStatus: string }) => item.complianceStatus !== 'expired');

  return NextResponse.json({
    stats,
    certifications: finalData,
    generatedAt: new Date().toISOString(),
  });
});

