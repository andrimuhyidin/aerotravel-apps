/**
 * API: Compliance Reports
 * GET /api/admin/compliance/reports - Generate compliance report
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/compliance/reports
 * Get compliance report data (JSON format for now, PDF generation can be added later)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin', 'finance_manager', 'investor'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);

  logger.info('GET /api/admin/compliance/reports', { year });

  // Get all licenses
  const { data: licenses, error: licensesError } = await supabase
    .from('business_licenses')
    .select(`
      *,
      asita_membership (
        nia,
        membership_type,
        dpd_region,
        member_since
      )
    `)
    .order('license_type', { ascending: true });

  if (licensesError) {
    logger.error('Failed to fetch licenses', licensesError);
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 });
  }

  // Get alerts for the year
  const yearStart = `${year}-01-01T00:00:00.000Z`;
  const yearEnd = `${year}-12-31T23:59:59.999Z`;

  const { data: alerts, error: alertsError } = await supabase
    .from('compliance_alerts')
    .select('id, alert_type, severity, is_resolved, created_at')
    .gte('created_at', yearStart)
    .lte('created_at', yearEnd);

  if (alertsError) {
    logger.error('Failed to fetch alerts', alertsError);
  }

  // Calculate statistics
  const licenseList = licenses || [];
  const alertList = alerts || [];

  const stats = {
    totalLicenses: licenseList.length,
    byStatus: {
      valid: 0,
      warning: 0,
      critical: 0,
      expired: 0,
      suspended: 0,
    },
    byType: {} as Record<string, number>,
    alertsSummary: {
      total: alertList.length,
      resolved: alertList.filter((a) => (a as { is_resolved: boolean }).is_resolved).length,
      unresolved: alertList.filter((a) => !(a as { is_resolved: boolean }).is_resolved).length,
      bySeverity: {
        info: alertList.filter((a) => (a as { severity: string }).severity === 'info').length,
        warning: alertList.filter((a) => (a as { severity: string }).severity === 'warning').length,
        critical: alertList.filter((a) => (a as { severity: string }).severity === 'critical').length,
      },
    },
  };

  licenseList.forEach((license) => {
    const l = license as { status: string; license_type: string };
    
    // Count by status
    if (stats.byStatus[l.status as keyof typeof stats.byStatus] !== undefined) {
      stats.byStatus[l.status as keyof typeof stats.byStatus]++;
    }

    // Count by type
    if (!stats.byType[l.license_type]) {
      stats.byType[l.license_type] = 0;
    }
    stats.byType[l.license_type]++;
  });

  // Calculate compliance score
  const complianceScore = stats.totalLicenses > 0 
    ? Math.round((stats.byStatus.valid / stats.totalLicenses) * 100)
    : 100;

  // Format licenses for report
  const formattedLicenses = licenseList.map((license) => {
    const l = license as {
      id: string;
      license_type: string;
      license_number: string;
      license_name: string;
      issued_by: string;
      issued_date: string;
      expiry_date: string | null;
      status: string;
      asita_membership: Array<{
        nia: string;
        membership_type: string;
        dpd_region: string | null;
        member_since: string;
      }> | null;
    };

    let daysUntilExpiry: number | null = null;
    if (l.expiry_date) {
      const today = new Date();
      const expiryDate = new Date(l.expiry_date);
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      licenseType: l.license_type,
      licenseNumber: l.license_number,
      licenseName: l.license_name,
      issuedBy: l.issued_by,
      issuedDate: l.issued_date,
      expiryDate: l.expiry_date,
      status: l.status,
      daysUntilExpiry,
      asitaDetails: l.asita_membership?.[0] || null,
    };
  });

  // Build renewal timeline (next 12 months)
  const renewalTimeline: Array<{ month: string; licenses: Array<{ name: string; type: string; expiryDate: string }> }> = [];
  const today = new Date();

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
    const monthStr = monthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    const licensesExpiring = licenseList.filter((license) => {
      const l = license as { expiry_date: string | null };
      if (!l.expiry_date) return false;
      const expiryDate = new Date(l.expiry_date);
      return expiryDate >= monthDate && expiryDate <= monthEnd;
    }).map((license) => {
      const l = license as { license_name: string; license_type: string; expiry_date: string };
      return {
        name: l.license_name,
        type: l.license_type,
        expiryDate: l.expiry_date,
      };
    });

    if (licensesExpiring.length > 0) {
      renewalTimeline.push({
        month: monthStr,
        licenses: licensesExpiring,
      });
    }
  }

  return NextResponse.json({
    reportTitle: `Laporan Compliance Izin Usaha Tahun ${year}`,
    generatedAt: new Date().toISOString(),
    year,
    complianceScore,
    statistics: stats,
    licenses: formattedLicenses,
    renewalTimeline,
    recommendations: generateRecommendations(stats, formattedLicenses),
  });
});

/**
 * Generate recommendations based on compliance data
 */
function generateRecommendations(
  stats: { byStatus: { expired: number; critical: number; warning: number } },
  licenses: Array<{ status: string; licenseName: string; daysUntilExpiry: number | null }>
): string[] {
  const recommendations: string[] = [];

  if (stats.byStatus.expired > 0) {
    recommendations.push(`URGENT: Ada ${stats.byStatus.expired} izin yang sudah EXPIRED. Segera lakukan perpanjangan untuk menghindari operasional ilegal.`);
  }

  if (stats.byStatus.critical > 0) {
    recommendations.push(`KRITIS: Ada ${stats.byStatus.critical} izin yang akan expired dalam 7 hari. Segera ajukan perpanjangan.`);
  }

  if (stats.byStatus.warning > 0) {
    recommendations.push(`PERHATIAN: Ada ${stats.byStatus.warning} izin yang akan expired dalam 30 hari. Siapkan dokumen perpanjangan.`);
  }

  // Find licenses expiring soon
  const criticalLicenses = licenses.filter((l) => l.status === 'critical');
  criticalLicenses.forEach((license) => {
    recommendations.push(`Izin "${license.licenseName}" akan expired dalam ${license.daysUntilExpiry} hari.`);
  });

  if (recommendations.length === 0) {
    recommendations.push('Semua izin dalam status valid. Tetap pantau tanggal expiry secara berkala.');
  }

  return recommendations;
}

