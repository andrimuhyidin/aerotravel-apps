/**
 * API: Partner Contract Details
 * GET /api/partner/contracts/:id - Get contract details
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  try {
    const { data: contract, error } = await client
      .from('partner_contracts')
      .select('*')
      .eq('id', id)
      .eq('partner_id', partnerId)
      .single();

    if (error || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({
      contract: {
        id: contract.id,
        title: contract.title,
        type: contract.type,
        version: contract.version,
        content: contract.content,
        status: contract.status,
        signedAt: contract.signed_at,
        expiresAt: contract.expires_at,
        createdAt: contract.created_at,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch contract', error, { userId: user.id, contractId: id });
    throw error;
  }
});

