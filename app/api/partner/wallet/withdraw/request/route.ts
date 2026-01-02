/**
 * API: Create Withdrawal Request
 * POST /api/partner/wallet/withdraw/request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeRequestBody, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const withdrawalRequestSchema = z.object({
  amount: z.number().min(100000, 'Minimum penarikan adalah Rp 100.000'),
  bankName: z.string().min(2, 'Nama bank wajib diisi'),
  accountNumber: z.string().min(5, 'Nomor rekening tidak valid'),
  accountName: z.string().min(2, 'Nama pemilik rekening wajib diisi'),
  notes: z.string().optional(),
});

const MINIMUM_WITHDRAWAL = 100000;

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

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
    const body = await request.json();
    const validatedData = withdrawalRequestSchema.parse(body);

    // Sanitize validated data
    const sanitizedData = sanitizeRequestBody(validatedData, {
      strings: ['bankName', 'accountName', 'notes'],
    });

    // Check minimum withdrawal
    if (validatedData.amount < MINIMUM_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum penarikan adalah ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(MINIMUM_WITHDRAWAL)}` },
        { status: 400 }
      );
    }

    const client = supabase as unknown as any;

    // Get wallet balance using verified partnerId
    const { data: wallet, error: walletError } = await client
      .from('mitra_wallets')
      .select('id, balance, credit_limit')
      .eq('mitra_id', partnerId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet tidak ditemukan' },
        { status: 404 }
      );
    }

    const availableBalance = Number(wallet.balance || 0) + Number(wallet.credit_limit || 0);

    // Check if balance is sufficient
    if (sanitizedData.amount > availableBalance) {
      return NextResponse.json(
        { error: 'Saldo tidak mencukupi untuk melakukan penarikan' },
        { status: 400 }
      );
    }

    // Check if there's already a pending withdrawal request
    const { data: pendingRequest } = await client
      .from('mitra_withdrawal_requests')
      .select('id')
      .eq('mitra_id', partnerId)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingRequest) {
      return NextResponse.json(
        { error: 'Anda masih memiliki request penarikan yang pending. Harap tunggu hingga request sebelumnya diproses.' },
        { status: 400 }
      );
    }

    // Create withdrawal request using verified partnerId and sanitized data
    const { data: withdrawalRequest, error: createError } = await client
      .from('mitra_withdrawal_requests')
      .insert({
        mitra_id: partnerId,
        amount: sanitizedData.amount,
        bank_name: sanitizedData.bankName,
        account_number: sanitizedData.accountNumber,
        account_name: sanitizedData.accountName,
        notes: sanitizedData.notes || null,
        status: 'pending',
      })
      .select('id, amount, status, created_at')
      .single();

    if (createError || !withdrawalRequest) {
      logger.error('Failed to create withdrawal request', createError, {
        userId: user.id,
        amount: validatedData.amount,
      });
      return NextResponse.json(
        { error: 'Gagal membuat request penarikan. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    logger.info('Withdrawal request created', {
      partnerId,
      requestId: withdrawalRequest.id,
      amount: sanitizedData.amount,
    });

    return NextResponse.json({
      success: true,
      message: 'Request penarikan berhasil dibuat. Menunggu persetujuan admin.',
      data: {
        id: withdrawalRequest.id,
        amount: Number(withdrawalRequest.amount),
        status: withdrawalRequest.status,
        createdAt: withdrawalRequest.created_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    logger.error('Failed to create withdrawal request', error, {
      userId: user.id,
    });
    throw error;
  }
});

