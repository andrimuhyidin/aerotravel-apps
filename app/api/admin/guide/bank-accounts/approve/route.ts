/**
 * Admin Bank Account Approval API
 * Approve/reject bank accounts untuk keamanan
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    id: string;
    action: 'approve' | 'reject';
    rejection_reason?: string;
    verification_notes?: string;
  };

  const { id, action, rejection_reason, verification_notes } = body;

  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
  }

  if (action === 'reject' && !rejection_reason) {
    return NextResponse.json(
      { error: 'Alasan penolakan wajib diisi' },
      { status: 400 },
    );
  }

  const client = supabase as unknown as any;

  // Get bank account
  const { data: account, error: fetchError } = await client
    .from('guide_bank_accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !account) {
    logger.error('Bank account not found', fetchError, { id });
    return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
  }

  if (account.status !== 'pending') {
    return NextResponse.json(
      { error: 'Bank account is not pending approval' },
      { status: 400 },
    );
  }

  // Update based on action
  if (action === 'approve') {
    // If setting as default, unset other defaults
    if (account.is_default) {
      await client
        .from('guide_bank_accounts')
        .update({ is_default: false })
        .eq('guide_id', account.guide_id)
        .eq('is_default', true)
        .eq('status', 'approved')
        .neq('id', id);
    }

    const { data: updated, error: updateError } = await client
      .from('guide_bank_accounts')
      .update({
        status: 'approved',
        approved_by: adminUser.id,
        approved_at: new Date().toISOString(),
        verification_notes: verification_notes || null,
        rejected_by: null,
        rejected_at: null,
        rejection_reason: null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      logger.error('Failed to approve bank account', updateError, { id });
      return NextResponse.json({ error: 'Failed to approve bank account' }, { status: 500 });
    }

    logger.info('Bank account approved', {
      id,
      guideId: account.guide_id,
      approvedBy: adminUser.id,
    });

    return NextResponse.json({ account: updated });
  } else {
    // Reject
    const { data: updated, error: updateError } = await client
      .from('guide_bank_accounts')
      .update({
        status: 'rejected',
        rejected_by: adminUser.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: rejection_reason,
        verification_notes: verification_notes || null,
        approved_by: null,
        approved_at: null,
        is_default: false, // Unset default if rejected
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      logger.error('Failed to reject bank account', updateError, { id });
      return NextResponse.json({ error: 'Failed to reject bank account' }, { status: 500 });
    }

    logger.info('Bank account rejected', {
      id,
      guideId: account.guide_id,
      rejectedBy: adminUser.id,
      reason: rejection_reason,
    });

    return NextResponse.json({ account: updated });
  }
});
