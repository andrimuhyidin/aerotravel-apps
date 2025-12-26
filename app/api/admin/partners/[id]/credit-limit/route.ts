/**
 * Admin API: Partner Credit Limit Management
 * GET /api/admin/partners/[id]/credit-limit - Get credit limit & history
 * POST /api/admin/partners/[id]/credit-limit - Set/update credit limit
 * DELETE /api/admin/partners/[id]/credit-limit - Remove credit limit (set to 0)
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const setCreditLimitSchema = z.object({
  creditLimit: z.number().min(0),
  reason: z.string().optional(),
  requireApproval: z.boolean().optional().default(false),
});

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const supabase = await createClient();
  const { id: partnerId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'finance_manager'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  try {
    // Get wallet with credit limit info
    const { data: wallet, error: walletError } = await client
      .from('mitra_wallets')
      .select(`
        id,
        balance,
        credit_limit,
        credit_used,
        mitra_id,
        created_at,
        updated_at
      `)
      .eq('mitra_id', partnerId)
      .maybeSingle();

    if (walletError) {
      logger.error('Failed to fetch wallet for credit limit', walletError, {
        partnerId,
        adminId: user.id,
      });
      throw walletError;
    }

    if (!wallet) {
      return NextResponse.json({
        creditLimit: 0,
        creditUsed: 0,
        availableCredit: 0,
        history: [],
      });
    }

    // Get credit limit history
    const { data: history, error: historyError } = await client
      .from('mitra_credit_limit_history')
      .select(`
        id,
        old_limit,
        new_limit,
        change_amount,
        reason,
        status,
        approved_by,
        approved_at,
        created_by,
        created_at,
        approver:approved_by_user(name, email),
        creator:created_by_user(name, email)
      `)
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      logger.warn('Failed to fetch credit limit history', historyError);
    }

    return NextResponse.json({
      creditLimit: Number(wallet.credit_limit || 0),
      creditUsed: Number(wallet.credit_used || 0),
      availableCredit: Number(wallet.credit_limit || 0) - Number(wallet.credit_used || 0),
      balance: Number(wallet.balance || 0),
      history: (history || []).map((h: any) => ({
        id: h.id,
        oldLimit: Number(h.old_limit),
        newLimit: Number(h.new_limit),
        changeAmount: Number(h.change_amount),
        reason: h.reason,
        status: h.status,
        approvedBy: h.approver ? {
          name: h.approver.name,
          email: h.approver.email,
        } : null,
        approvedAt: h.approved_at,
        createdBy: h.creator ? {
          name: h.creator.name,
          email: h.creator.email,
        } : null,
        createdAt: h.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to get credit limit', error, {
      partnerId,
      adminId: user.id,
    });
    throw error;
  }
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const supabase = await createClient();
  const { id: partnerId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'finance_manager'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { creditLimit, reason, requireApproval } = setCreditLimitSchema.parse(body);

  const client = supabase as unknown as any;

  try {
    // Get or create wallet
    let { data: wallet, error: walletError } = await client
      .from('mitra_wallets')
      .select('id, credit_limit')
      .eq('mitra_id', partnerId)
      .maybeSingle();

    if (walletError) {
      logger.error('Failed to fetch wallet for credit limit update', walletError, {
        partnerId,
        adminId: user.id,
      });
      throw walletError;
    }

    // Create wallet if doesn't exist
    if (!wallet) {
      const { data: newWallet, error: createError } = await client
        .from('mitra_wallets')
        .insert({
          mitra_id: partnerId,
          balance: 0,
          credit_limit: 0,
          credit_used: 0,
        })
        .select('id, credit_limit')
        .single();

      if (createError) {
        logger.error('Failed to create wallet', createError);
        throw createError;
      }

      wallet = newWallet;
    }

    const oldLimit = Number(wallet.credit_limit || 0);
    const changeAmount = creditLimit - oldLimit;

    // Determine status based on approval requirement
    const status = requireApproval && Math.abs(changeAmount) > 100_000_000 // 100M threshold
      ? 'pending'
      : 'approved';

    // Create history record
    const { data: historyRecord, error: historyError } = await client
      .from('mitra_credit_limit_history')
      .insert({
        wallet_id: wallet.id,
        mitra_id: partnerId,
        old_limit: oldLimit,
        new_limit: creditLimit,
        change_amount: changeAmount,
        reason: reason || 'Credit limit update',
        status,
        created_by: user.id,
        approved_by: status === 'approved' ? user.id : null,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (historyError) {
      logger.error('Failed to create credit limit history', historyError);
      throw historyError;
    }

    // Update wallet if approved (or if no approval needed)
    if (status === 'approved') {
      const { error: updateError } = await client
        .from('mitra_wallets')
        .update({
          credit_limit: creditLimit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);

      if (updateError) {
        logger.error('Failed to update credit limit', updateError);
        throw updateError;
      }
    }

    logger.info('Credit limit updated', {
      partnerId,
      adminId: user.id,
      oldLimit,
      newLimit: creditLimit,
      status,
    });

    return NextResponse.json({
      success: true,
      creditLimit,
      status,
      historyId: historyRecord.id,
      message: status === 'pending'
        ? 'Credit limit update pending approval'
        : 'Credit limit updated successfully',
    });
  } catch (error) {
    logger.error('Failed to set credit limit', error, {
      partnerId,
      adminId: user.id,
    });
    throw error;
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const supabase = await createClient();
  const { id: partnerId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'finance_manager'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  try {
    // Get wallet
    const { data: wallet, error: walletError } = await client
      .from('mitra_wallets')
      .select('id, credit_limit')
      .eq('mitra_id', partnerId)
      .maybeSingle();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const oldLimit = Number(wallet.credit_limit || 0);

    // Create history record
    await client
      .from('mitra_credit_limit_history')
      .insert({
        wallet_id: wallet.id,
        mitra_id: partnerId,
        old_limit: oldLimit,
        new_limit: 0,
        change_amount: -oldLimit,
        reason: 'Credit limit removed',
        status: 'approved',
        created_by: user.id,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      });

    // Update wallet
    const { error: updateError } = await client
      .from('mitra_wallets')
      .update({
        credit_limit: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id);

    if (updateError) {
      logger.error('Failed to remove credit limit', updateError);
      throw updateError;
    }

    logger.info('Credit limit removed', {
      partnerId,
      adminId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Credit limit removed successfully',
    });
  } catch (error) {
    logger.error('Failed to remove credit limit', error, {
      partnerId,
      adminId: user.id,
    });
    throw error;
  }
});

