/**
 * License Checker Service
 * Handles license status checks and compliance scoring
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type LicenseStatus = 'valid' | 'warning' | 'critical' | 'expired' | 'suspended';

export type LicenseType = 'nib' | 'skdn' | 'sisupar' | 'tdup' | 'asita' | 'chse';

export type License = {
  id: string;
  licenseType: LicenseType;
  licenseNumber: string;
  licenseName: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string | null;
  status: LicenseStatus;
  daysUntilExpiry: number | null;
};

export type ComplianceCheckResult = {
  updated: number;
  alerts: number;
  licenses: License[];
};

/**
 * Get the display name for a license type
 */
export function getLicenseTypeDisplayName(type: LicenseType): string {
  const displayNames: Record<LicenseType, string> = {
    nib: 'Nomor Induk Berusaha (NIB)',
    skdn: 'Surat Keterangan Domisili Niaga (SKDN)',
    sisupar: 'Sistem Informasi Usaha Pariwisata (SISUPAR)',
    tdup: 'Tanda Daftar Usaha Pariwisata (TDUP)',
    asita: 'Keanggotaan ASITA',
    chse: 'Sertifikasi CHSE',
  };
  return displayNames[type] || type.toUpperCase();
}

/**
 * Calculate days until expiry for a given date
 */
export function calculateDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determine license status based on days until expiry
 */
export function determineLicenseStatus(daysUntilExpiry: number | null): LicenseStatus {
  if (daysUntilExpiry === null) return 'valid'; // Perpetual license
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'critical';
  if (daysUntilExpiry <= 30) return 'warning';
  return 'valid';
}

/**
 * Check and update license statuses
 * This function calls the database function to update statuses and generate alerts
 */
export async function checkAndUpdateLicenseStatuses(): Promise<ComplianceCheckResult> {
  const supabase = await createClient();
  
  logger.info('Running license status check');
  
  // Call the database function to check and update statuses
  const { data, error } = await supabase.rpc('check_license_expiry');
  
  if (error) {
    logger.error('Failed to check license expiry', error);
    throw new Error('Failed to check license expiry');
  }
  
  const result = data as { updated_count: number; new_alerts_count: number }[] | null;
  const counts = result?.[0] || { updated_count: 0, new_alerts_count: 0 };
  
  // Get updated licenses
  const { data: licenses, error: fetchError } = await supabase
    .from('business_licenses')
    .select('id, license_type, license_number, license_name, issued_by, issued_date, expiry_date, status')
    .order('status', { ascending: true })
    .order('expiry_date', { ascending: true, nullsFirst: false });
  
  if (fetchError) {
    logger.error('Failed to fetch licenses after update', fetchError);
    throw new Error('Failed to fetch licenses');
  }
  
  const enrichedLicenses = (licenses || []).map((license) => {
    const l = license as {
      id: string;
      license_type: LicenseType;
      license_number: string;
      license_name: string;
      issued_by: string;
      issued_date: string;
      expiry_date: string | null;
      status: LicenseStatus;
    };
    return {
      id: l.id,
      licenseType: l.license_type,
      licenseNumber: l.license_number,
      licenseName: l.license_name,
      issuedBy: l.issued_by,
      issuedDate: l.issued_date,
      expiryDate: l.expiry_date,
      status: l.status,
      daysUntilExpiry: calculateDaysUntilExpiry(l.expiry_date),
    };
  });
  
  logger.info('License status check completed', {
    updated: counts.updated_count,
    alerts: counts.new_alerts_count,
  });
  
  return {
    updated: counts.updated_count,
    alerts: counts.new_alerts_count,
    licenses: enrichedLicenses,
  };
}

/**
 * Get compliance score (0-100%)
 * Score = (valid licenses / total licenses) * 100
 */
export async function getComplianceScore(): Promise<number> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_compliance_score');
  
  if (error) {
    logger.error('Failed to get compliance score', error);
    return 0;
  }
  
  return (data as number) || 100;
}

/**
 * Get all licenses with their current status
 */
export async function getAllLicenses(): Promise<License[]> {
  const supabase = await createClient();
  
  const { data: licenses, error } = await supabase
    .from('business_licenses')
    .select('id, license_type, license_number, license_name, issued_by, issued_date, expiry_date, status')
    .order('status', { ascending: true })
    .order('expiry_date', { ascending: true, nullsFirst: false });
  
  if (error) {
    logger.error('Failed to fetch licenses', error);
    return [];
  }
  
  return (licenses || []).map((license) => {
    const l = license as {
      id: string;
      license_type: LicenseType;
      license_number: string;
      license_name: string;
      issued_by: string;
      issued_date: string;
      expiry_date: string | null;
      status: LicenseStatus;
    };
    return {
      id: l.id,
      licenseType: l.license_type,
      licenseNumber: l.license_number,
      licenseName: l.license_name,
      issuedBy: l.issued_by,
      issuedDate: l.issued_date,
      expiryDate: l.expiry_date,
      status: l.status,
      daysUntilExpiry: calculateDaysUntilExpiry(l.expiry_date),
    };
  });
}

/**
 * Get licenses that are expiring soon (within specified days)
 */
export async function getExpiringLicenses(withinDays: number = 30): Promise<License[]> {
  const supabase = await createClient();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + withinDays);
  
  const { data: licenses, error } = await supabase
    .from('business_licenses')
    .select('id, license_type, license_number, license_name, issued_by, issued_date, expiry_date, status')
    .not('expiry_date', 'is', null)
    .lte('expiry_date', futureDate.toISOString().split('T')[0])
    .neq('status', 'expired')
    .order('expiry_date', { ascending: true });
  
  if (error) {
    logger.error('Failed to fetch expiring licenses', error);
    return [];
  }
  
  return (licenses || []).map((license) => {
    const l = license as {
      id: string;
      license_type: LicenseType;
      license_number: string;
      license_name: string;
      issued_by: string;
      issued_date: string;
      expiry_date: string;
      status: LicenseStatus;
    };
    return {
      id: l.id,
      licenseType: l.license_type,
      licenseNumber: l.license_number,
      licenseName: l.license_name,
      issuedBy: l.issued_by,
      issuedDate: l.issued_date,
      expiryDate: l.expiry_date,
      status: l.status,
      daysUntilExpiry: calculateDaysUntilExpiry(l.expiry_date),
    };
  });
}

/**
 * Get ASITA membership status
 */
export async function getASITAMembershipStatus(): Promise<{
  isMember: boolean;
  nia: string | null;
  membershipType: string | null;
  dpdRegion: string | null;
  memberSince: string | null;
  expiryDate: string | null;
  status: LicenseStatus | null;
  daysUntilExpiry: number | null;
} | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('business_licenses')
    .select(`
      id,
      status,
      expiry_date,
      asita_membership (
        nia,
        membership_type,
        dpd_region,
        member_since
      )
    `)
    .eq('license_type', 'asita')
    .single();
  
  if (error || !data) {
    return {
      isMember: false,
      nia: null,
      membershipType: null,
      dpdRegion: null,
      memberSince: null,
      expiryDate: null,
      status: null,
      daysUntilExpiry: null,
    };
  }
  
  const license = data as {
    id: string;
    status: LicenseStatus;
    expiry_date: string | null;
    asita_membership: Array<{
      nia: string;
      membership_type: string;
      dpd_region: string | null;
      member_since: string;
    }> | null;
  };
  
  const asita = license.asita_membership?.[0];
  
  return {
    isMember: true,
    nia: asita?.nia || null,
    membershipType: asita?.membership_type || null,
    dpdRegion: asita?.dpd_region || null,
    memberSince: asita?.member_since || null,
    expiryDate: license.expiry_date,
    status: license.status,
    daysUntilExpiry: calculateDaysUntilExpiry(license.expiry_date),
  };
}

