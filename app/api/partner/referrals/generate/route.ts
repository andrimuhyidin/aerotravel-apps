/**
 * API: Generate Partner Referral Code
 * POST /api/partner/referrals/generate - Generate new referral code for partner
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'PARTNER-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const POST = withErrorHandler(async () => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

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

  try {
    // Generate unique referral code
    let referralCode = generateReferralCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Check if code exists
      const { data: existing } = await client
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (!existing) {
        break;
      }

      referralCode = generateReferralCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique code. Please try again.' },
        { status: 500 }
      );
    }

    // Update user's referral code
    const { error: updateError } = await client
      .from('users')
      .update({ referral_code: referralCode })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to update referral code', updateError, { userId: user.id });
      throw updateError;
    }

    logger.info('Referral code generated', { userId: user.id, referralCode });

    return NextResponse.json({
      success: true,
      referralCode,
    });
  } catch (error) {
    logger.error('Failed to generate referral code', error, { userId: user.id });
    throw error;
  }
});

