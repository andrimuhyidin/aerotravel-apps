/**
 * API: Apply Referral Code
 * POST /api/user/referral/apply
 *
 * Applies a referral code for a new user
 * Body: { code: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { applyReferralCode, validateReferralCode } from '@/lib/customers/referral';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const applySchema = z.object({
  code: z.string().min(4, 'Kode referral tidak valid'),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = applySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Kode referral tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { code } = parsed.data;

    // Apply the referral code
    const result = await applyReferralCode(user.id, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Gagal menggunakan kode referral' },
        { status: 400 }
      );
    }

    logger.info('Referral code applied via API', {
      userId: user.id,
      code,
      discount: result.discount,
    });

    return NextResponse.json({
      success: true,
      discount: result.discount,
      discountFormatted: `Rp ${result.discount.toLocaleString('id-ID')}`,
      message: `Selamat! Anda mendapat diskon Rp ${result.discount.toLocaleString('id-ID')} untuk booking pertama`,
    });
  } catch (error) {
    logger.error('Failed to apply referral code', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Gagal menggunakan kode referral' },
      { status: 500 }
    );
  }
});

/**
 * GET: Validate a referral code without applying it
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Kode referral diperlukan' },
      { status: 400 }
    );
  }

  const result = await validateReferralCode(code);

  return NextResponse.json({
    valid: result.valid,
    error: result.error,
  });
});

