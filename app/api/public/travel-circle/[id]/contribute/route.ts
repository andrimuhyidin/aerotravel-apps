/**
 * Travel Circle Contribution API
 * POST /api/public/travel-circle/[id]/contribute - Make a contribution
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { checkRateLimit, getRequestIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/api/public-rate-limit';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  // Rate limiting
  const identifier = getRequestIdentifier(request);
  const rateLimit = checkRateLimit(`travelcircle-contribute:${identifier}`, RATE_LIMIT_CONFIGS.POST);
  
  if (!rateLimit.success) {
    logger.warn('Rate limit exceeded for travel-circle contribute', { identifier });
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
      { status: 429 }
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const { amount, paymentMethod } = body;
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  logger.info('POST /api/public/travel-circle/[id]/contribute', { id, amount, paymentMethod });

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: 'Valid amount is required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get circle and verify status
  const { data: circle, error: circleError } = await supabase
    .from('travel_circles')
    .select('id, status, current_amount, target_amount')
    .eq('id', id)
    .single();

  if (circleError || !circle) {
    return NextResponse.json(
      { error: 'Circle not found' },
      { status: 404 }
    );
  }

  if (circle.status !== 'active') {
    return NextResponse.json(
      { error: 'Circle is not active' },
      { status: 400 }
    );
  }

  // Get member
  const { data: member, error: memberError } = await supabase
    .from('travel_circle_members')
    .select('id, current_contribution, target_contribution')
    .eq('circle_id', id)
    .eq('user_id', user.id)
    .single();

  if (memberError || !member) {
    return NextResponse.json(
      { error: 'You are not a member of this circle' },
      { status: 403 }
    );
  }

  // Create contribution record
  const { data: contribution, error: contribError } = await supabase
    .from('travel_circle_contributions')
    .insert({
      circle_id: id,
      member_id: member.id,
      amount,
      payment_method: paymentMethod || 'transfer',
      status: 'confirmed', // In production, would be 'pending' until payment confirmed
      contributed_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (contribError || !contribution) {
    logger.error('Failed to create contribution', contribError);
    return NextResponse.json(
      { error: 'Failed to create contribution' },
      { status: 500 }
    );
  }

  // Update member's current contribution
  const newMemberContribution = Number(member.current_contribution) + amount;
  await supabase
    .from('travel_circle_members')
    .update({
      current_contribution: newMemberContribution,
      status: newMemberContribution >= Number(member.target_contribution) ? 'completed' : 'active',
    })
    .eq('id', member.id);

  // Update circle's current amount
  const newCircleAmount = Number(circle.current_amount) + amount;
  const isComplete = newCircleAmount >= Number(circle.target_amount);
  
  await supabase
    .from('travel_circles')
    .update({
      current_amount: newCircleAmount,
      contribution_count: circle.contribution_count + 1,
      status: isComplete ? 'completed' : 'active',
    })
    .eq('id', id);

  return NextResponse.json({
    success: true,
    contributionId: contribution.id,
    newTotal: newCircleAmount,
    isComplete,
  });
});

