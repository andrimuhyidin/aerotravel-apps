/**
 * Guide Bank Accounts API
 * CRUD untuk bank accounts dengan approval system
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const bankAccountSchema = z.object({
  bank_name: z.string().min(1, 'Nama bank wajib diisi'),
  account_number: z.string().min(1, 'Nomor rekening wajib diisi'),
  account_holder_name: z.string().min(1, 'Nama pemilik rekening wajib diisi'),
  branch_name: z.string().optional(),
  branch_code: z.string().optional(),
  is_default: z.boolean().optional().default(false),
});

// GET: List bank accounts
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { data: accounts, error } = await client
    .from('guide_bank_accounts')
    .select('*')
    .eq('guide_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch bank accounts', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
  }

  return NextResponse.json({ accounts: accounts || [] });
});

// POST: Create new bank account (pending status)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as unknown;

  let parsed;
  try {
    parsed = bankAccountSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Check if account number already exists for this guide
  const { data: existing } = await client
    .from('guide_bank_accounts')
    .select('id')
    .eq('guide_id', user.id)
    .eq('account_number', parsed.account_number)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Nomor rekening sudah terdaftar' },
      { status: 400 },
    );
  }

  // If setting as default, check if there's already a default approved account
  if (parsed.is_default) {
    const { data: existingDefault } = await client
      .from('guide_bank_accounts')
      .select('id')
      .eq('guide_id', user.id)
      .eq('is_default', true)
      .eq('status', 'approved')
      .maybeSingle();

    if (existingDefault) {
      // Unset existing default
      await client
        .from('guide_bank_accounts')
        .update({ is_default: false })
        .eq('id', existingDefault.id);
    }
  }

  // Create new bank account with pending status
  const { data: newAccount, error } = await client
    .from('guide_bank_accounts')
    .insert({
      guide_id: user.id,
      bank_name: parsed.bank_name,
      account_number: parsed.account_number,
      account_holder_name: parsed.account_holder_name,
      branch_name: parsed.branch_name || null,
      branch_code: parsed.branch_code || null,
      is_default: parsed.is_default,
      status: 'pending', // Always pending on creation
    })
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to create bank account', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 });
  }

  logger.info('Bank account created (pending approval)', {
    guideId: user.id,
    bankAccountId: newAccount.id,
  });

  return NextResponse.json({ account: newAccount });
});

// PUT: Update bank account (pending or approved ones)
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { id: string; data: unknown };

  if (!body.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = bankAccountSchema.parse(body.data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Check if account exists
  const { data: existing } = await client
    .from('guide_bank_accounts')
    .select('*')
    .eq('id', body.id)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
  }

  // Handle different statuses
  if (existing.status === 'rejected') {
    return NextResponse.json(
      { error: 'Akun bank yang ditolak tidak bisa diubah. Silakan hapus dan buat ulang.' },
      { status: 400 },
    );
  }

  // If status is approved, need to create edit request (status → pending_edit)
  const isEditApprovedAccount = existing.status === 'approved';
  const isEditPendingEdit = existing.status === 'pending_edit';
  
  if (!isEditPendingEdit && existing.status !== 'pending' && !isEditApprovedAccount) {
    return NextResponse.json(
      { error: 'Status akun bank tidak memungkinkan untuk diubah' },
      { status: 400 },
    );
  }

  // Check if account number already exists (excluding current account)
  if (parsed.account_number !== existing.account_number) {
    const { data: duplicate } = await client
      .from('guide_bank_accounts')
      .select('id')
      .eq('guide_id', user.id)
      .eq('account_number', parsed.account_number)
      .neq('id', body.id)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: 'Nomor rekening sudah terdaftar' },
        { status: 400 },
      );
    }
  }

  // If editing approved account, backup original data
  let originalData: Record<string, unknown> | null = null;
  if (isEditApprovedAccount) {
    originalData = {
      bank_name: existing.bank_name,
      account_number: existing.account_number,
      account_holder_name: existing.account_holder_name,
      branch_name: existing.branch_name,
      branch_code: existing.branch_code,
      is_default: existing.is_default,
    };
  }

  // If setting as default, unset existing default
  if (parsed.is_default && !existing.is_default) {
    const { data: existingDefault } = await client
      .from('guide_bank_accounts')
      .select('id')
      .eq('guide_id', user.id)
      .eq('is_default', true)
      .eq('status', 'approved')
      .maybeSingle();

    if (existingDefault && existingDefault.id !== body.id) {
      await client
        .from('guide_bank_accounts')
        .update({ is_default: false })
        .eq('id', existingDefault.id);
    }
  }

  // Prepare update payload
  const updatePayload: Record<string, unknown> = {
    bank_name: parsed.bank_name,
    account_number: parsed.account_number,
    account_holder_name: parsed.account_holder_name,
    branch_name: parsed.branch_name || null,
    branch_code: parsed.branch_code || null,
    is_default: parsed.is_default,
  };

  // If editing approved account, set status to pending_edit and backup data
  if (isEditApprovedAccount) {
    updatePayload.status = 'pending_edit';
    updatePayload.original_data = originalData;
    updatePayload.edit_requested_at = new Date().toISOString();
    updatePayload.edit_requested_by = user.id;
  }

  // Update account
  const { data: updated, error } = await client
    .from('guide_bank_accounts')
    .update(updatePayload)
    .eq('id', body.id)
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to update bank account', error, { guideId: user.id, accountId: body.id });
    return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 });
  }

  logger.info('Bank account updated', {
    guideId: user.id,
    bankAccountId: body.id,
    status: isEditApprovedAccount ? 'pending_edit' : existing.status,
    wasApproved: isEditApprovedAccount,
  });

  return NextResponse.json({ 
    account: updated,
    message: isEditApprovedAccount 
      ? 'Perubahan rekening dikirim untuk persetujuan admin' 
      : 'Rekening berhasil diperbarui',
  });
});

// DELETE: Delete bank account (only pending/rejected)
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Check if account exists and can be deleted
  const { data: existing } = await client
    .from('guide_bank_accounts')
    .select('*')
    .eq('id', id)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
  }

  if (existing.status === 'approved') {
    return NextResponse.json(
      { error: 'Akun bank yang sudah disetujui tidak bisa dihapus. Silakan edit jika ingin mengubah data.' },
      { status: 400 },
    );
  }
  
  // If deleting pending_edit, it means guide wants to cancel edit request
  // We should restore to approved status instead of deleting
  if (existing.status === 'pending_edit' && existing.original_data) {
    // Restore to approved with original data
    const { error: restoreError } = await client
      .from('guide_bank_accounts')
      .update({
        status: 'approved',
        bank_name: existing.original_data.bank_name as string,
        account_number: existing.original_data.account_number as string,
        account_holder_name: existing.original_data.account_holder_name as string,
        branch_name: (existing.original_data.branch_name as string) || null,
        branch_code: (existing.original_data.branch_code as string) || null,
        is_default: (existing.original_data.is_default as boolean) || false,
        original_data: null,
        edit_requested_at: null,
        edit_requested_by: null,
      })
      .eq('id', id);

    if (restoreError) {
      logger.error('Failed to cancel edit request', restoreError, { guideId: user.id, accountId: id });
      return NextResponse.json({ error: 'Failed to cancel edit request' }, { status: 500 });
    }

    logger.info('Edit request cancelled, restored to approved', {
      guideId: user.id,
      bankAccountId: id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Permintaan perubahan dibatalkan. Data dikembalikan ke versi sebelumnya.',
    });
  }

  // Delete account (only for pending or rejected)
  const { error } = await client.from('guide_bank_accounts').delete().eq('id', id);

  if (error) {
    logger.error('Failed to delete bank account', error, { guideId: user.id, accountId: id });
    return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
  }

  logger.info('Bank account deleted', {
    guideId: user.id,
    bankAccountId: id,
  });

  return NextResponse.json({ success: true });
});
