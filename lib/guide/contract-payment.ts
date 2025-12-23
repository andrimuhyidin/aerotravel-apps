/**
 * Guide Contract Payment Utilities
 * Handle payment processing for trips linked to master contracts
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type ProcessTripPaymentResult = {
  success: boolean;
  transactionId?: string;
  error?: string;
};

/**
 * Process payment for a completed trip
 * Uses fee_amount from trip_guides (not from contract)
 *
 * NOTE: This function is kept for backward compatibility and manual processing.
 * Automatic payment processing is now handled by database trigger `trigger_auto_process_trip_payment`
 * which fires when `check_out_at` is set on `trip_guides` table.
 *
 * The trigger will automatically create wallet transaction when a guide checks out,
 * preventing missing payments and ensuring data consistency.
 */
export async function processTripPayment(
  tripId: string,
  guideId: string
): Promise<ProcessTripPaymentResult> {
  const supabase = await createClient();
  const client = supabase as unknown as unknown;

  try {
    // 1. Get trip assignment (fee is here)
    const { data: assignment, error: assignmentError } = await client
      .from('trip_guides')
      .select('fee_amount, trip:trips(trip_code, status)')
      .eq('trip_id', tripId)
      .eq('guide_id', guideId)
      .single();

    if (assignmentError || !assignment) {
      logger.error('Trip assignment not found', assignmentError, {
        tripId,
        guideId,
      });
      return { success: false, error: 'Trip assignment not found' };
    }

    if (!assignment.fee_amount || Number(assignment.fee_amount) <= 0) {
      logger.warn('Trip assignment has no fee amount', { tripId, guideId });
      return { success: false, error: 'Trip assignment has no fee amount' };
    }

    // 2. Check if payment already processed
    // Note: Trigger may have already processed this payment if check_out_at was set
    const { data: existingPayment } = await client
      .from('guide_wallet_transactions')
      .select('id')
      .eq('reference_type', 'trip')
      .eq('reference_id', tripId)
      .eq('transaction_type', 'earning')
      .maybeSingle();

    if (existingPayment) {
      logger.info(
        'Payment already processed for trip (may have been processed by trigger)',
        {
          tripId,
          transactionId: existingPayment.id,
        }
      );
      return { success: true, transactionId: existingPayment.id };
    }

    // 3. Get or create wallet
    const { data: wallet } = await client
      .from('guide_wallets')
      .select('id, balance')
      .eq('guide_id', guideId)
      .maybeSingle();

    let walletId: string;
    if (!wallet) {
      const { data: newWallet, error: walletError } = await client
        .from('guide_wallets')
        .insert({ guide_id: guideId, balance: 0 })
        .select('id')
        .single();

      if (walletError) throw walletError;
      walletId = newWallet.id;
    } else {
      walletId = wallet.id;
    }

    // 4. Get master contract (for tracking)
    const { data: masterContract } = await client
      .from('guide_contracts')
      .select('id, contract_number')
      .eq('guide_id', guideId)
      .eq('is_master_contract', true)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Calculate balance
    const balanceBefore = Number(wallet?.balance || 0);
    const feeAmount = Number(assignment.fee_amount);
    const balanceAfter = balanceBefore + feeAmount;

    // 6. Create wallet transaction (fee from trip_guides)
    const { data: transaction, error: txError } = await client
      .from('guide_wallet_transactions')
      .insert({
        wallet_id: walletId,
        transaction_type: 'earning',
        amount: feeAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_type: 'trip',
        reference_id: tripId,
        description: `Fee trip ${(assignment.trip as { trip_code?: string })?.trip_code || tripId}`,
        status: 'completed',
      })
      .select('id')
      .single();

    if (txError) {
      logger.error('Failed to create wallet transaction', txError, {
        tripId,
        guideId,
      });
      return { success: false, error: 'Failed to create wallet transaction' };
    }

    // 7. Link payment to master contract (optional, for tracking)
    if (masterContract) {
      await client
        .from('guide_contract_payments')
        .insert({
          contract_id: masterContract.id,
          wallet_transaction_id: transaction.id,
          amount: feeAmount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'wallet',
          notes: `Payment for trip ${tripId} - fee from trip assignment`,
        })
        .catch((error: unknown) => {
          // Don't fail if contract payment link fails
          logger.warn('Failed to link payment to contract', {
            error,
            contractId: masterContract.id,
            transactionId: transaction.id,
          });
        });
    }

    // 8. Update contract_trips status to completed
    if (masterContract) {
      await client
        .from('guide_contract_trips')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('contract_id', masterContract.id)
        .eq('trip_id', tripId)
        .catch((error: unknown) => {
          // Don't fail if contract_trips update fails
          logger.warn('Failed to update contract_trips status', {
            error,
            contractId: masterContract.id,
            tripId,
          });
        });
    }

    logger.info('Trip payment processed successfully', {
      tripId,
      guideId,
      transactionId: transaction.id,
      amount: feeAmount,
      contractId: masterContract?.id,
    });

    return { success: true, transactionId: transaction.id };
  } catch (error) {
    logger.error('Failed to process trip payment', error, { tripId, guideId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process payments for multiple completed trips
 */
export async function processMultipleTripPayments(
  tripIds: string[],
  guideId: string
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ tripId: string; error: string }>;
}> {
  const results = await Promise.allSettled(
    tripIds.map((tripId) => processTripPayment(tripId, guideId))
  );

  let success = 0;
  let failed = 0;
  const errors: Array<{ tripId: string; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      success++;
    } else {
      failed++;
      errors.push({
        tripId: tripIds[index] || 'unknown',
        error:
          result.status === 'rejected'
            ? result.reason?.message || 'Unknown error'
            : result.value.error || 'Unknown error',
      });
    }
  });

  return { success, failed, errors };
}
