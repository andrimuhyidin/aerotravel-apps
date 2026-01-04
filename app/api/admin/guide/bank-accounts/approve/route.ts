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

  if (account.status !== 'pending' && account.status !== 'pending_edit') {
    return NextResponse.json(
      { error: 'Bank account is not pending approval' },
      { status: 400 },
    );
  }

  const isEditRequest = account.status === 'pending_edit';

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

    // Prepare update payload
    const updatePayload: Record<string, unknown> = {
      status: 'approved',
      approved_by: adminUser.id,
      approved_at: new Date().toISOString(),
      verification_notes: verification_notes || null,
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
    };

    // If this is an edit request, clear edit request fields and original_data
    if (isEditRequest) {
      updatePayload.original_data = null;
      updatePayload.edit_requested_at = null;
      updatePayload.edit_requested_by = null;
    }

    const { data: updated, error: updateError } = await client
      .from('guide_bank_accounts')
      .update(updatePayload)
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
      isEditRequest,
    });

    return NextResponse.json({ 
      account: updated,
      message: isEditRequest 
        ? 'Perubahan rekening disetujui' 
        : 'Rekening baru disetujui',
    });
  } else {
    // Reject
    const updatePayload: Record<string, unknown> = {
      rejected_by: adminUser.id,
      rejected_at: new Date().toISOString(),
      rejection_reason: rejection_reason,
      verification_notes: verification_notes || null,
    };

    if (isEditRequest) {
      // For edit request rejection: restore original data and set back to approved
      // The trigger will handle restoring original_data
      updatePayload.status = 'approved';
      updatePayload.approved_by = account.approved_by; // Keep original approver
      updatePayload.approved_at = account.approved_at; // Keep original approval time
      updatePayload.is_default = account.original_data?.is_default || false;
    } else {
      // For new account rejection
      updatePayload.status = 'rejected';
      updatePayload.approved_by = null;
      updatePayload.approved_at = null;
      updatePayload.is_default = false;
    }

    const { data: updated, error: updateError } = await client
      .from('guide_bank_accounts')
      .update(updatePayload)
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
      isEditRequest,
    });

    return NextResponse.json({ 
      account: updated,
      message: isEditRequest 
        ? 'Perubahan rekening ditolak. Data dikembalikan ke versi sebelumnya.' 
        : 'Pendaftaran rekening ditolak',
    });
  }
});
