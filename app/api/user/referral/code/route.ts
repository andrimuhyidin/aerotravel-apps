/**
 * API: Get or Generate Referral Code
 * GET /api/user/referral/code
 *
 * Returns the user's referral code, generating one if it doesn't exist
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  generateShareMessage,
  getOrGenerateReferralCode,
} from '@/lib/customers/referral';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const referralCode = await getOrGenerateReferralCode(user.id);

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Failed to get referral code' },
        { status: 500 }
      );
    }

    const shareMessage = generateShareMessage(referralCode.code);

    return NextResponse.json({
      code: referralCode.code,
      totalReferrals: referralCode.totalReferrals,
      totalBookings: referralCode.totalBookings,
      totalCommission: referralCode.totalCommission,
      isActive: referralCode.isActive,
      shareLinks: {
        whatsapp: shareMessage.whatsappUrl,
        twitter: shareMessage.twitterUrl,
        text: shareMessage.text,
      },
    });
  } catch (error) {
    logger.error('Failed to get referral code', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to get referral code' },
      { status: 500 }
    );
  }
});

