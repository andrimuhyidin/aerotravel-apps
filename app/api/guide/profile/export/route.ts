/**
 * API: Guide Profile Export
 * GET /api/guide/profile/export - Export profile data as JSON (GDPR-compliant)
 */

import { NextRequest, NextResponse } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Rate limit: 1 export per hour per user
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const exportRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '1 h'), // 1 export per hour
  analytics: true,
  prefix: '@upstash/ratelimit/profile-export',
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const { success: rateLimitSuccess } = await exportRateLimiter.limit(`profile-export-${user.id}-${ip}`);
  
  if (!rateLimitSuccess) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later. Maximum 1 export per hour.' },
      { status: 429 }
    );
  }

  // Fetch complete profile data
  const { data: profile, error: profileError } = await client
    .from('users')
    .select(
      `
      id,
      full_name,
      phone,
      email,
      nik,
      address,
      avatar_url,
      employee_number,
      hire_date,
      employment_status,
      supervisor_id,
      branch_id,
      is_active,
      created_at,
      updated_at
    `
    )
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    logger.error('Failed to fetch profile for export', profileError, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }

  // Fetch related data
  const [emergencyContacts, medicalInfo, documents, bankAccounts] = await Promise.all([
    client
      .from('guide_emergency_contacts')
      .select('*')
      .eq('guide_id', user.id)
      .eq('is_active', true),
    client
      .from('guide_medical_info')
      .select('*')
      .eq('guide_id', user.id)
      .single(),
    client
      .from('guide_documents')
      .select('*')
      .eq('guide_id', user.id)
      .eq('is_active', true),
    client
      .from('guide_bank_accounts')
      .select('*')
      .eq('guide_id', user.id)
      .eq('is_active', true),
  ]);

  // Format as GDPR-compliant export
  const exportData = {
    export_date: new Date().toISOString(),
    user_id: profile.id,
    personal_information: {
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      nik: profile.nik,
      address: profile.address,
      avatar_url: profile.avatar_url,
    },
    employment_information: {
      employee_number: profile.employee_number,
      hire_date: profile.hire_date,
      employment_status: profile.employment_status,
      supervisor_id: profile.supervisor_id,
      branch_id: profile.branch_id,
    },
    account_status: {
      is_active: profile.is_active,
      created_at: profile.created_at,
      last_updated: profile.updated_at,
    },
    emergency_contacts: emergencyContacts.data || [],
    medical_information: medicalInfo.data || null,
    documents: documents.data || [],
    bank_accounts: bankAccounts.data || [],
  };

  // Log export for audit
  logger.info('Profile data exported', {
    userId: user.id,
    exportDate: exportData.export_date,
  });

  // Return as JSON with proper headers
  return NextResponse.json(exportData, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="profile-export-${user.id}-${Date.now()}.json"`,
    },
  });
});

