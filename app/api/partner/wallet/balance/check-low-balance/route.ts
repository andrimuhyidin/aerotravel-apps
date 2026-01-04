/**
 * API: Check Low Wallet Balance
 * GET /api/partner/wallet/balance/check-low-balance
 * Checks if wallet balance is low and sends alert email if needed
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { sendLowWalletBalanceEmail } from '@/lib/partner/email-notifications';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
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
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const client = supabase as unknown as any;
  const threshold = 1000000; // 1 juta

  try {
    // Get wallet balance
    const { data: wallet, error: walletError } = await client
      .from('mitra_wallets')
      .select('balance')
      .eq('mitra_id', partnerId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    const balance = Number(wallet.balance);
    const isLow = balance < threshold;

    // Send email if low (non-blocking)
    if (isLow) {
      try {
        const { data: partnerProfile } = await client
          .from('users')
          .select('email, full_name')
          .eq('id', user.id)
          .single();

        if (partnerProfile?.email) {
          sendLowWalletBalanceEmail(
            partnerProfile.email,
            partnerProfile.full_name || 'Partner',
            balance,
            threshold
          ).catch((emailError) => {
            logger.warn('Failed to send low balance alert', {
              userId: user.id,
              error: emailError instanceof Error ? emailError.message : String(emailError),
            });
          });
        }
      } catch (emailError) {
        logger.warn('Email notification error (non-critical)', {
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    }

    return NextResponse.json({
      balance,
      threshold,
      isLow,
      needsTopup: isLow,
    });
  } catch (error) {
    logger.error('Failed to check wallet balance', error, {
      userId: user.id,
    });
    throw error;
  }
});

