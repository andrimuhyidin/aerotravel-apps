/**
 * API: Admin - Issue Guide ID Card
 * POST /api/admin/guide/id-card - Issue new ID card
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const issueIDCardSchema = z.object({
  guide_id: z.string().uuid(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin', 'finance_manager'].includes(
    userProfile?.role || ''
  );

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate input
  const validated = issueIDCardSchema.parse(body);

  // Get guide info
  const { data: guideProfile } = await client
    .from('users')
    .select('id, branch_id, full_name')
    .eq('id', validated.guide_id)
    .single();

  if (!guideProfile) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  // Check if guide already has active card
  const { data: existingCard } = await client
    .from('guide_id_cards')
    .select('id')
    .eq('guide_id', validated.guide_id)
    .eq('status', 'active')
    .maybeSingle();

  if (existingCard) {
    return NextResponse.json(
      { error: 'Guide already has an active ID card' },
      { status: 400 }
    );
  }

  // Generate card number: ATGL-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  const cardNumber = `ATGL-${dateStr}-${randomStr}`;

  // Generate verification token
  const verificationToken = randomUUID();

  // Generate QR code data
  const verificationUrl = `${env.NEXT_PUBLIC_APP_URL}/guide/verify/${verificationToken}`;
  const qrCodeData = JSON.stringify({
    type: 'guide_id_card',
    token: verificationToken,
    url: verificationUrl,
    card_number: cardNumber,
  });

  // Create ID card
  const { data: idCard, error } = await client
    .from('guide_id_cards')
    .insert({
      guide_id: validated.guide_id,
      branch_id: guideProfile.branch_id,
      card_number: cardNumber,
      issue_date: today.toISOString().slice(0, 10),
      expiry_date: validated.expiry_date,
      status: 'active',
      qr_code_data: qrCodeData,
      verification_token: verificationToken,
      issued_by: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to issue ID card', error, { guideId: validated.guide_id });
    return NextResponse.json({ error: 'Failed to issue ID card' }, { status: 500 });
  }

  logger.info('ID card issued', {
    cardNumber,
    guideId: validated.guide_id,
    issuedBy: user.id,
  });

  return NextResponse.json({
    id_card: idCard,
    qr_code_url: `/api/guide/id-card/qr-code`,
  });
});
