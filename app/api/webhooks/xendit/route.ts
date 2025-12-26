/**
 * Webhook Handler untuk Xendit Payment Notifications
 * Endpoint: /api/webhooks/xendit
 * Handles invoice payment status updates for wallet top-ups
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyWebhookToken } from '@/lib/integrations/xendit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Verify webhook token
  const callbackToken = request.headers.get('x-callback-token');
  if (!callbackToken || !verifyWebhookToken(callbackToken)) {
    logger.warn('Invalid Xendit webhook token', {
      token: callbackToken ? 'provided' : 'missing',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, external_id, status, amount } = body as {
    id: string;
    external_id: string;
    status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED';
    amount: number;
  };

  const supabase = await createClient();
  const client = supabase as unknown as any;

  logger.info('Xendit webhook received', {
    invoiceId: id,
    externalId: external_id,
    status,
    amount,
  });

  // Handle top-up payments (external_id starts with "TOPUP-")
  if (external_id?.startsWith('TOPUP-')) {
    // Extract mitra ID from external_id: TOPUP-{mitraId}-{timestamp}
    const parts = external_id.split('-');
    if (parts.length < 3) {
      logger.error('Invalid topup external_id format', { external_id });
      return NextResponse.json({ error: 'Invalid external_id' }, { status: 400 });
    }

    const mitraIdPrefix = parts[1];
    
    // Find transaction by external_id
    const { data: transaction, error: txError } = await client
      .from('mitra_wallet_transactions')
      .select('id, mitra_id, amount, balance_before, balance_after')
      .eq('external_id', external_id)
      .or(`status.eq.pending,status.eq.processing`)
      .maybeSingle();

    if (txError) {
      logger.error('Failed to find topup transaction', txError, { external_id });
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (!transaction) {
      logger.warn('Topup transaction not found or already processed', {
        external_id,
      });
      // Return success to prevent Xendit from retrying
      return NextResponse.json({ received: true });
    }

    const mitraId = transaction.mitra_id;

    // Handle different payment statuses
    if (status === 'PAID' || status === 'SETTLED') {
      // Payment successful - credit wallet
      try {
        // Get current wallet balance
        const { data: wallet, error: walletError } = await client
          .from('mitra_wallets')
          .select('id, balance')
          .eq('mitra_id', mitraId)
          .single();

        if (walletError || !wallet) {
          logger.error('Wallet not found for topup', walletError, { mitraId });
          // Update transaction status to failed
          await client
            .from('mitra_wallet_transactions')
            .update({
              status: 'failed',
              description: `Top-up failed: Wallet not found`,
            })
            .eq('id', transaction.id);

          return NextResponse.json(
            { error: 'Wallet not found' },
            { status: 404 }
          );
        }

        const balanceBefore = Number(wallet.balance);
        const newBalance = balanceBefore + amount;

        // Update wallet balance
        const { error: updateError } = await client
          .from('mitra_wallets')
          .update({ balance: newBalance })
          .eq('id', wallet.id);

        if (updateError) {
          logger.error('Failed to update wallet balance', updateError, {
            walletId: wallet.id,
            mitraId,
          });
          throw updateError;
        }

        // Update transaction status
        await client
          .from('mitra_wallet_transactions')
          .update({
            status: 'completed',
            balance_before: balanceBefore,
            balance_after: newBalance,
            description: `Top-up completed - Invoice ${id}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        logger.info('Wallet topup completed', {
          mitraId,
          amount,
          balanceBefore,
          balanceAfter: newBalance,
          invoiceId: id,
        });

        // Send email notification to partner (non-blocking)
        try {
          const { sendWalletTopupSuccessEmail } = await import('@/lib/partner/email-notifications');
          
          // Get partner email
          const { data: partnerProfile } = await client
            .from('users')
            .select('email, full_name')
            .eq('id', mitraId)
            .single();

          if (partnerProfile?.email) {
            sendWalletTopupSuccessEmail(
              partnerProfile.email,
              partnerProfile.full_name || 'Partner',
              amount,
              newBalance
            ).catch((emailError) => {
              logger.warn('Failed to send topup success email', emailError, {
                mitraId,
              });
            });
          }
        } catch (emailError) {
          logger.warn('Email notification error (non-critical)', emailError);
        }
      } catch (error) {
        logger.error('Failed to process wallet topup', error, {
          mitraId,
          amount,
          invoiceId: id,
        });
        // Update transaction status to failed
        await client
          .from('mitra_wallet_transactions')
          .update({
            status: 'failed',
            description: `Top-up failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
          .eq('id', transaction.id);

        return NextResponse.json(
          { error: 'Failed to process topup' },
          { status: 500 }
        );
      }
    } else if (status === 'EXPIRED') {
      // Payment expired - mark transaction as expired
      await client
        .from('mitra_wallet_transactions')
        .update({
          status: 'expired',
          description: `Top-up expired - Invoice ${id}`,
        })
        .eq('id', transaction.id);

      logger.info('Topup expired', {
        mitraId,
        external_id,
        invoiceId: id,
      });
    } else if (status === 'PENDING') {
      // Payment still pending - update transaction status
      await client
        .from('mitra_wallet_transactions')
        .update({
          status: 'pending',
          description: `Top-up pending - Invoice ${id}`,
        })
        .eq('id', transaction.id);
    }
  }

  return NextResponse.json({ received: true });
});

