/**
 * API: Public Guide Verification
 * GET /api/public/guide/verify/[token] - Verify ID card via token (public)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) => {
  const supabase = await createClient();
  const { token } = await params;

  const client = supabase as unknown as any;

  // Get ID card by token
  const { data: idCard, error } = await client
    .from('guide_id_cards')
    .select('*')
    .eq('verification_token', token)
    .single();

  if (error || !idCard) {
    return NextResponse.json({ error: 'Invalid verification token' }, { status: 404 });
  }

  // Check if expired or revoked
  if (idCard.status !== 'active') {
    return NextResponse.json({
      verified: false,
      status: idCard.status,
      message: `ID card is ${idCard.status}`,
    });
  }

  // Check expiry date
  const today = new Date();
  const expiryDate = new Date(idCard.expiry_date);
  if (today > expiryDate) {
    return NextResponse.json({
      verified: false,
      status: 'expired',
      message: 'ID card has expired',
    });
  }

  // Get guide info (public-safe information only)
  const { data: guideProfile } = await client
    .from('users')
    .select('id, full_name, avatar_url, branch_id')
    .eq('id', idCard.guide_id)
    .single();

  if (!guideProfile) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  // Get branch name
  let branchName = 'AeroTravel';
  if (guideProfile.branch_id) {
    const { data: branch } = await client
      .from('branches')
      .select('name')
      .eq('id', guideProfile.branch_id)
      .single();
    if (branch) {
      branchName = branch.name || 'AeroTravel';
    }
  }

  // Get ratings summary (public)
  const { data: ratings } = await client
    .from('itinerary_reviews')
    .select('rating')
    .eq('guide_id', idCard.guide_id)
    .not('rating', 'is', null);

  const ratingsList = (ratings || []).map((r: { rating: number }) => r.rating as number);
  const averageRating =
    ratingsList.length > 0
      ? ratingsList.reduce((a: number, b: number) => a + b, 0) / ratingsList.length
      : 0;

  return NextResponse.json({
    verified: true,
    guide_info: {
      name: guideProfile.full_name,
      photo: guideProfile.avatar_url,
      card_number: idCard.card_number,
      status: idCard.status,
      expiry_date: idCard.expiry_date,
      branch_name: branchName,
      verified_badge: true,
      ratings_summary: {
        average_rating: Math.round(averageRating * 10) / 10,
        total_ratings: ratingsList.length,
      },
    },
  });
});
