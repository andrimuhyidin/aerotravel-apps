/**
 * API: Partner Contracts
 * GET /api/partner/contracts - List partner's contracts
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  try {
    const { data: contracts, error } = await client
      .from('partner_contracts')
      .select(`
        id,
        title,
        type,
        version,
        status,
        signed_at,
        expires_at,
        created_at
      `)
      .eq('partner_id', partnerId) // Use verified partnerId
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch contracts', error, { userId: user.id });
      throw error;
    }

    const transformedContracts = (contracts || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      version: c.version,
      status: c.status,
      signedAt: c.signed_at,
      expiresAt: c.expires_at,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ contracts: transformedContracts });
  } catch (error) {
    logger.error('Failed to fetch contracts', error, { userId: user.id });
    throw error;
  }
});

