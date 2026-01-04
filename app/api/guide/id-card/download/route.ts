/**
 * API: Download Guide ID Card PDF
 * GET /api/guide/id-card/download - Download ID card as PDF
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { GuideIDCardPDF, type GuideIDCardData } from '@/lib/pdf/guide-id-card';
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

  const client = supabase as unknown as any;

  // Verify user is guide
  const { data: userProfile } = await client
    .from('users')
    .select('role, full_name, avatar_url, branch_id')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get active ID card
  const { data: idCard, error } = await client
    .from('guide_id_cards')
    .select('*')
    .eq('guide_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !idCard) {
    return NextResponse.json({ error: 'ID card not found' }, { status: 404 });
  }

  // Get branch info
  let branchName = 'AeroTravel';
  if (userProfile.branch_id) {
    const { data: branch } = await client
      .from('branches')
      .select('name')
      .eq('id', userProfile.branch_id)
      .single();
    if (branch) {
      branchName = branch.name || 'AeroTravel';
    }
  }

  // Generate PDF
  try {
    const cardData: GuideIDCardData = {
      cardNumber: idCard.card_number,
      guideName: userProfile.full_name || 'Guide',
      photoUrl: userProfile.avatar_url || undefined,
      branchName,
      issueDate: idCard.issue_date,
      expiryDate: idCard.expiry_date,
      qrCodeData: idCard.qr_code_data,
      status: idCard.status,
    };

    const pdfBuffer = await renderToBuffer(GuideIDCardPDF(cardData) as any);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ATGL-${idCard.card_number}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate ID card PDF', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
});
