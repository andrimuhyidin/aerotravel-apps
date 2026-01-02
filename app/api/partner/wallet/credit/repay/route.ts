/**
 * API: Partner Credit Limit Repayment
 * POST /api/partner/wallet/credit/repay
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeRequestBody, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const repaySchema = z.object({
  amount: z.number().min(1),
  description: z.string().optional(),
});

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

  const body = await request.json();
  const validated = repaySchema.parse(body);

  // Sanitize validated data
  const { amount, description } = sanitizeRequestBody(validated, {
    strings: ['description'],
  });

  const client = supabase as unknown as any;

  try {
    // Get wallet using verified partnerId
    const { data: wallet, error: walletError } = await client
      .from('mitra_wallets')
      .select('id, credit_used')
      .eq('mitra_id', partnerId)
      .maybeSingle();

    if (walletError) {
      logger.error('Failed to fetch wallet for credit repayment', walletError, {
        userId: user.id,
      });
      throw walletError;
    }

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet tidak ditemukan' },
        { status: 404 }
      );
    }

    const creditUsed = Number(wallet.credit_used || 0);
    if (creditUsed <= 0) {
      return NextResponse.json(
        { error: 'Tidak ada credit yang perlu dibayar' },
        { status: 400 }
      );
    }

    if (amount > creditUsed) {
      return NextResponse.json(
        { error: `Jumlah pembayaran melebihi credit yang digunakan (Rp ${creditUsed.toLocaleString('id-ID')})` },
        { status: 400 }
      );
    }

    // Call database function to process repayment
    const { data: transactionId, error: rpcError } = await client.rpc(
      'process_credit_repayment',
      {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_description: description || 'Credit limit repayment',
      }
    );

    if (rpcError || !transactionId) {
      logger.error('Failed to process credit repayment', rpcError, {
        userId: user.id,
        walletId: wallet.id,
        amount,
      });
      return NextResponse.json(
        { error: 'Gagal memproses pembayaran credit' },
        { status: 500 }
      );
    }

    logger.info('Credit repayment processed', {
      userId: user.id,
      walletId: wallet.id,
      amount,
      transactionId,
    });

    return NextResponse.json({
      success: true,
      transactionId: transactionId as string,
      message: 'Pembayaran credit berhasil',
    });
  } catch (error) {
    logger.error('Credit repayment error', error, {
      userId: user.id,
    });
    throw error;
  }
});

