/**
 * Join Travel Circle API
 * POST /api/public/travel-circle/[id]/join - Join a circle with code
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
  const rateLimit = checkRateLimit(`travelcircle-join:${identifier}`, RATE_LIMIT_CONFIGS.POST);
  
  if (!rateLimit.success) {
    logger.warn('Rate limit exceeded for travel-circle join', { identifier });
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
      { status: 429 }
    );
  }

  const { id } = await context.params;
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  logger.info('POST /api/public/travel-circle/[id]/join', { id, userId: user.id });

  const supabase = await createClient();

  // Get circle
  const { data: circle, error: circleError } = await supabase
    .from('travel_circles')
    .select('id, name, status, target_amount')
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

  // Check if already a member (using type assertion due to outdated types)
  const { data: existingMember } = await supabase
    .from('travel_circle_members')
    .select('id')
    .eq('circle_id', id)
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null };

  if (existingMember) {
    // Try to check if left and rejoin
    const { data: memberStatus } = await supabase
      .from('travel_circle_members')
      .select('*')
      .eq('id', existingMember.id)
      .single() as { data: Record<string, unknown> | null };

    if (memberStatus && memberStatus.status === 'left') {
      // Rejoin
      await supabase
        .from('travel_circle_members')
        .update({ 
          joined_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('id', existingMember.id);

      return NextResponse.json({ 
        success: true,
        message: 'Rejoined circle',
        circleId: circle.id,
      });
    }

    return NextResponse.json(
      { error: 'Already a member of this circle' },
      { status: 400 }
    );
  }

  // Get current member count to calculate target contribution
  const { count } = await supabase
    .from('travel_circle_members')
    .select('id', { count: 'exact' })
    .eq('circle_id', id);

  // Calculate target contribution (not used in current schema, but kept for reference)
  const _memberCount = (count || 0) + 1;
  const _targetContribution = Math.ceil(Number(circle.target_amount) / _memberCount);

  // Get user profile
  const profile = user.profile as { full_name?: string; email?: string; phone?: string } | null;

  // Add as member (cast insert data due to outdated types)
  const insertData = {
    circle_id: id,
    user_id: user.id,
    name: profile?.full_name || 'User',
    email: profile?.email || null,
    phone: profile?.phone || null,
    total_contributed: 0,
    is_active: true,
  };

  const { error: memberError } = await supabase
    .from('travel_circle_members')
    .insert(insertData);

  if (memberError) {
    logger.error('Failed to join circle', memberError);
    return NextResponse.json(
      { error: 'Failed to join circle' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Joined circle successfully',
    circleId: circle.id,
    circleName: circle.name,
  });
});
