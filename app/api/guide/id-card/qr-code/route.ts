/**
 * API: Get Guide ID Card QR Code
 * GET /api/guide/id-card/qr-code - Get QR code image
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Verify user is guide
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get active ID card
  const { data: idCard, error } = await client
    .from('guide_id_cards')
    .select('qr_code_url, qr_code_data, verification_token')
    .eq('guide_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !idCard) {
    return NextResponse.json({ error: 'ID card not found' }, { status: 404 });
  }

  // Parse QR code data to get verification URL
  let verificationUrl = '';
  try {
    if (idCard.qr_code_data) {
      const qrData = JSON.parse(idCard.qr_code_data);
      verificationUrl = qrData.url || '';
    }
  } catch {
    // Fallback if parsing fails
    verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/guide/verify/${idCard.verification_token}`;
  }

  // If QR code URL exists, return it
  if (idCard.qr_code_url) {
    return NextResponse.json({
      qr_code_url: idCard.qr_code_url,
      verification_url: verificationUrl,
    });
  }

  // Otherwise, return data for client-side generation
  return NextResponse.json({
    qr_code_data: idCard.qr_code_data,
    verification_url: verificationUrl,
  });
});
