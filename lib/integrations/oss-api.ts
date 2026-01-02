/**
 * OSS (Online Single Submission) API Client
 * Purpose: Validate NIB (Nomor Induk Berusaha) with government database
 * 
 * Note: This is a stub implementation. Actual integration requires:
 * - OSS API credentials from https://oss.go.id
 * - OAuth2 authentication flow
 * - API endpoint documentation
 */

import { logger } from '@/lib/utils/logger';

export type NIBValidationResult = {
  isValid: boolean;
  nib: string;
  companyName?: string;
  businessSector?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
  issuedDate?: string;
  expiryDate?: string | null;
  error?: string;
};

/**
 * Validate NIB with OSS system
 * 
 * @param nib - Nomor Induk Berusaha (13 digits)
 * @returns Validation result with company information
 */
export async function validateNIB(nib: string): Promise<NIBValidationResult> {
  // TODO: Implement actual OSS API integration
  // For now, return stub response
  
  logger.info('[OSS API Stub] Validating NIB', { nib });

  // Basic validation: NIB should be 13 digits
  if (!/^\d{13}$/.test(nib)) {
    return {
      isValid: false,
      nib,
      error: 'NIB harus berisi 13 digit angka',
    };
  }

  // Stub response - simulate API call
  // In production, this would make actual HTTP request to OSS API
  /*
  const response = await fetch('https://api.oss.go.id/api/v1/nib/validate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OSS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nib }),
  });
  
  const data = await response.json();
  */

  // Stub response
  return {
    isValid: true,
    nib,
    companyName: 'PT. Example Company',
    businessSector: 'Jasa Pariwisata',
    address: 'Jakarta, Indonesia',
    status: 'active',
    issuedDate: '2023-01-15',
    expiryDate: null, // NIB is perpetual
  };
}

/**
 * Get NIB details from OSS
 */
export async function getNIBDetails(nib: string): Promise<NIBValidationResult> {
  logger.info('[OSS API Stub] Getting NIB details', { nib });

  // Stub implementation
  return validateNIB(nib);
}

/**
 * Check if NIB is registered for tourism business
 */
export async function checkTourismBusinessLicense(nib: string): Promise<boolean> {
  const result = await validateNIB(nib);
  
  if (!result.isValid) {
    return false;
  }

  // Check if business sector includes tourism
  const tourismKeywords = ['pariwisata', 'wisata', 'travel', 'tour'];
  const businessSector = (result.businessSector || '').toLowerCase();
  
  return tourismKeywords.some((keyword) => businessSector.includes(keyword));
}

/**
 * Verify NIB status is active
 */
export async function verifyNIBStatus(nib: string): Promise<boolean> {
  const result = await validateNIB(nib);
  return result.isValid && result.status === 'active';
}

