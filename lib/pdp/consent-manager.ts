/**
 * Consent Manager - UU PDP 2022 Compliance
 * Handles granular consent management per purpose
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type ConsentPurpose = {
  id: string;
  purposeCode: string;
  purposeName: string;
  description: string;
  isMandatory: boolean;
  category: 'operational' | 'marketing' | 'analytics' | 'third_party';
  legalBasis: string | null;
  retentionPeriod: number | null;
};

export type UserConsent = {
  id: string;
  userId: string;
  purposeId: string;
  consentGiven: boolean;
  consentMethod: 'checkbox' | 'signature' | 'verbal' | 'implicit' | null;
  consentTimestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  withdrawnAt: string | null;
  purpose?: ConsentPurpose;
};

export type ConsentSummary = {
  purposeCode: string;
  purposeName: string;
  consentGiven: boolean;
  consentTimestamp: string | null;
  isMandatory: boolean;
};

/**
 * Get all active consent purposes
 */
export async function getConsentPurposes(): Promise<ConsentPurpose[]> {
  const supabase = await createClient();

  const { data: purposes, error } = await supabase
    .from('consent_purposes')
    .select('*')
    .eq('is_active', true)
    .order('is_mandatory', { ascending: false })
    .order('purpose_code', { ascending: true });

  if (error) {
    logger.error('Failed to fetch consent purposes', error);
    return [];
  }

  return (purposes || []).map((p) => ({
    id: p.id as string,
    purposeCode: p.purpose_code as string,
    purposeName: p.purpose_name as string,
    description: p.description as string,
    isMandatory: p.is_mandatory as boolean,
    category: p.category as 'operational' | 'marketing' | 'analytics' | 'third_party',
    legalBasis: p.legal_basis as string | null,
    retentionPeriod: p.retention_period as number | null,
  }));
}

/**
 * Get user's consent summary
 */
export async function getUserConsentSummary(userId: string): Promise<ConsentSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_user_consent_summary', {
    p_user_id: userId,
  });

  if (error) {
    logger.error('Failed to get user consent summary', error, { userId });
    return [];
  }

  return (data || []).map((item: {
    purpose_code: string;
    purpose_name: string;
    consent_given: boolean;
    consent_timestamp: string | null;
    is_mandatory: boolean;
  }) => ({
    purposeCode: item.purpose_code,
    purposeName: item.purpose_name,
    consentGiven: item.consent_given,
    consentTimestamp: item.consent_timestamp,
    isMandatory: item.is_mandatory,
  }));
}

/**
 * Record user consent for a purpose
 */
export async function recordConsent(
  userId: string,
  purposeCode: string,
  consentGiven: boolean,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: Record<string, unknown>;
  }
): Promise<boolean> {
  const supabase = await createClient();

  // Get purpose ID
  const { data: purpose } = await supabase
    .from('consent_purposes')
    .select('id')
    .eq('purpose_code', purposeCode)
    .single();

  if (!purpose) {
    logger.error('Consent purpose not found', { purposeCode });
    return false;
  }

  const { error } = await supabase.from('user_consents').upsert(
    {
      user_id: userId,
      purpose_id: purpose.id,
      consent_given: consentGiven,
      consent_method: 'checkbox',
      ip_address: metadata?.ipAddress || null,
      user_agent: metadata?.userAgent || null,
      device_info: metadata?.deviceInfo || null,
    },
    {
      onConflict: 'user_id,purpose_id',
    }
  );

  if (error) {
    logger.error('Failed to record consent', error, { userId, purposeCode });
    return false;
  }

  logger.info('Consent recorded', { userId, purposeCode, consentGiven });
  return true;
}

/**
 * Withdraw consent for a purpose
 */
export async function withdrawConsent(
  userId: string,
  purposeCode: string,
  reason?: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get purpose ID
  const { data: purpose } = await supabase
    .from('consent_purposes')
    .select('id, is_mandatory')
    .eq('purpose_code', purposeCode)
    .single();

  if (!purpose) {
    logger.error('Consent purpose not found', { purposeCode });
    return false;
  }

  if (purpose.is_mandatory) {
    logger.error('Cannot withdraw mandatory consent', { purposeCode });
    return false;
  }

  const { error } = await supabase
    .from('user_consents')
    .update({
      consent_given: false,
      withdrawn_at: new Date().toISOString(),
      withdrawal_reason: reason || null,
    })
    .eq('user_id', userId)
    .eq('purpose_id', purpose.id);

  if (error) {
    logger.error('Failed to withdraw consent', error, { userId, purposeCode });
    return false;
  }

  logger.info('Consent withdrawn', { userId, purposeCode, reason });
  return true;
}

/**
 * Check if user has given consent for a specific purpose
 */
export async function hasConsent(userId: string, purposeCode: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_user_consent', {
    p_user_id: userId,
    p_purpose_code: purposeCode,
  });

  if (error) {
    logger.error('Failed to check consent', error, { userId, purposeCode });
    return false;
  }

  return data === true;
}

/**
 * Get user's consents with full details
 */
export async function getUserConsents(userId: string): Promise<UserConsent[]> {
  const supabase = await createClient();

  const { data: consents, error } = await supabase
    .from('user_consents')
    .select(
      `
      id,
      user_id,
      purpose_id,
      consent_given,
      consent_method,
      consent_timestamp,
      ip_address,
      user_agent,
      withdrawn_at,
      consent_purposes (
        id,
        purpose_code,
        purpose_name,
        description,
        is_mandatory,
        category,
        legal_basis,
        retention_period
      )
    `
    )
    .eq('user_id', userId)
    .order('consent_timestamp', { ascending: false });

  if (error) {
    logger.error('Failed to get user consents', error, { userId });
    return [];
  }

  return (consents || []).map((c) => {
    const purposeData = Array.isArray(c.consent_purposes)
      ? c.consent_purposes[0]
      : c.consent_purposes;
    
    return {
      id: c.id as string,
      userId: c.user_id as string,
      purposeId: c.purpose_id as string,
      consentGiven: c.consent_given as boolean,
      consentMethod: c.consent_method as 'checkbox' | 'signature' | 'verbal' | 'implicit' | null,
      consentTimestamp: c.consent_timestamp as string,
      ipAddress: c.ip_address as string | null,
      userAgent: c.user_agent as string | null,
      withdrawnAt: c.withdrawn_at as string | null,
      purpose: purposeData
        ? {
            id: purposeData.id as string,
            purposeCode: purposeData.purpose_code as string,
            purposeName: purposeData.purpose_name as string,
            description: purposeData.description as string,
            isMandatory: purposeData.is_mandatory as boolean,
            category: purposeData.category as 'operational' | 'marketing' | 'analytics' | 'third_party',
            legalBasis: purposeData.legal_basis as string | null,
            retentionPeriod: purposeData.retention_period as number | null,
          }
        : undefined,
    };
  });
}

/**
 * Record bulk consents (for signup flow)
 */
export async function recordBulkConsents(
  userId: string,
  consents: Array<{ purposeCode: string; consentGiven: boolean }>,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: Record<string, unknown>;
  }
): Promise<boolean> {
  const supabase = await createClient();

  // Get all purposes
  const { data: purposes } = await supabase
    .from('consent_purposes')
    .select('id, purpose_code')
    .in(
      'purpose_code',
      consents.map((c) => c.purposeCode)
    );

  if (!purposes || purposes.length === 0) {
    logger.error('No purposes found for bulk consent');
    return false;
  }

  const consentRecords = consents.map((consent) => {
    const purpose = purposes.find((p) => p.purpose_code === consent.purposeCode);
    if (!purpose) return null;

    return {
      user_id: userId,
      purpose_id: purpose.id,
      consent_given: consent.consentGiven,
      consent_method: 'checkbox',
      ip_address: metadata?.ipAddress || null,
      user_agent: metadata?.userAgent || null,
      device_info: metadata?.deviceInfo || null,
    };
  }).filter(Boolean);

  const { error } = await supabase.from('user_consents').upsert(consentRecords, {
    onConflict: 'user_id,purpose_id',
  });

  if (error) {
    logger.error('Failed to record bulk consents', error, { userId });
    return false;
  }

  logger.info('Bulk consents recorded', { userId, count: consentRecords.length });
  return true;
}

