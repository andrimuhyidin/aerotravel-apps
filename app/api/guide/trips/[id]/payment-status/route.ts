/**
 * API: Trip Payment Status
 * GET /api/guide/trips/[id]/payment-status - Get payment status and transaction details for a specific trip
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // 1. Get trip assignment untuk guide ini (untuk mendapatkan fee_amount)
    const { data: assignment, error: assignmentError } = await client
      .from('trip_guides')
      .select('fee_amount, check_out_at')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (assignmentError) {
      logger.error('Failed to fetch trip assignment', assignmentError, { tripId, guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch trip assignment' }, { status: 500 });
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Trip assignment not found' }, { status: 404 });
    }

    const feeAmount = Number(assignment.fee_amount || 0);

    // 2. Check if payment sudah processed (cek di wallet transactions)
    const { data: wallet } = await client
      .from('guide_wallets')
      .select('id')
      .eq('guide_id', user.id)
      .maybeSingle();

    let paymentStatus: 'paid' | 'pending' | 'processing' | 'not_processed' = 'not_processed';
    let transactionId: string | undefined;
    let paidAt: string | undefined;
    let walletTransaction: {
      id: string;
      amount: number;
      balanceAfter: number;
      createdAt: string;
      description: string;
    } | undefined;

    if (wallet) {
      const { data: transaction, error: txError } = await client
        .from('guide_wallet_transactions')
        .select('id, amount, balance_after, created_at, description, status')
        .eq('wallet_id', wallet.id)
        .eq('reference_type', 'trip')
        .eq('reference_id', tripId)
        .eq('transaction_type', 'earning')
        .maybeSingle();

      if (txError) {
        logger.error('Failed to fetch wallet transaction', txError, { tripId, walletId: wallet.id });
        // Don't fail, just continue with not_processed status
      } else if (transaction) {
        paymentStatus = transaction.status === 'completed' ? 'paid' : 'processing';
        transactionId = transaction.id;
        paidAt = transaction.created_at;
        walletTransaction = {
          id: transaction.id,
          amount: Number(transaction.amount || 0),
          balanceAfter: Number(transaction.balance_after || 0),
          createdAt: transaction.created_at,
          description: transaction.description || '',
        };
      } else {
        // No transaction found - check if trip sudah completed (check_out_at exists)
        // If trip completed but no transaction, status is 'pending'
        if (assignment.check_out_at) {
          paymentStatus = 'pending';
        }
      }
    }

    return NextResponse.json({
      paymentStatus,
      feeAmount,
      transactionId,
      paidAt,
      paymentMethod: walletTransaction ? 'wallet' : undefined,
      walletTransaction,
    });
  } catch (error) {
    logger.error('Failed to fetch payment status', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
});

