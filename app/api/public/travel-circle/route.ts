/**
 * Travel Circle API
 * GET /api/public/travel-circle - Get user's circles
 * POST /api/public/travel-circle - Create new circle
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { checkRateLimit, getRequestIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/api/public-rate-limit';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  logger.info('GET /api/public/travel-circle');

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  // Get circles where user is a member
  const { data: memberships, error: memberError } = await supabase
    .from('travel_circle_members')
    .select(`
      id,
      status,
      target_contribution,
      current_contribution,
      travel_circles (
        id,
        name,
        description,
        target_amount,
        target_date,
        current_amount,
        status,
        created_by,
        packages (
          id,
          name,
          destination,
          slug
        )
      )
    `)
    .eq('user_id', user.id)
    .not('status', 'eq', 'left');

  if (memberError) {
    logger.error('Failed to fetch travel circles', memberError);
    return NextResponse.json(
      { error: 'Failed to fetch circles' },
      { status: 500 }
    );
  }

  const circles = (memberships || []).map((m) => {
    const circle = m.travel_circles as {
      id: string;
      name: string;
      description: string | null;
      target_amount: number;
      target_date: string;
      current_amount: number;
      status: string;
      created_by: string;
      packages: {
        id: string;
        name: string;
        destination: string;
        slug: string;
      } | null;
    } | null;

    return {
      id: circle?.id,
      name: circle?.name,
      description: circle?.description,
      targetAmount: Number(circle?.target_amount),
      targetDate: circle?.target_date,
      currentAmount: Number(circle?.current_amount),
      status: circle?.status,
      isAdmin: circle?.created_by === user.id,
      memberStatus: m.status,
      targetContribution: Number(m.target_contribution),
      currentContribution: Number(m.current_contribution),
      package: circle?.packages,
    };
  }).filter((c) => c.id);

  return NextResponse.json({ circles });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const identifier = getRequestIdentifier(request);
  const rateLimit = checkRateLimit(`travelcircle:${identifier}`, RATE_LIMIT_CONFIGS.POST);
  
  if (!rateLimit.success) {
    logger.warn('Rate limit exceeded for travel-circle', { identifier });
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
      { status: 429 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { name, description, targetAmount, targetDate, packageId, memberCount } = body;

  logger.info('POST /api/public/travel-circle', { name, targetAmount, memberCount });

  if (!name || !targetAmount || !targetDate) {
    return NextResponse.json(
      { error: 'Name, target amount, and target date are required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Create circle
  const { data: circle, error: circleError } = await supabase
    .from('travel_circles')
    .insert({
      name,
      description: description || null,
      target_amount: targetAmount,
      target_date: targetDate,
      package_id: packageId || null,
      status: 'active',
      current_amount: 0,
      contribution_count: 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (circleError || !circle) {
    logger.error('Failed to create travel circle', circleError);
    return NextResponse.json(
      { error: 'Failed to create circle' },
      { status: 500 }
    );
  }

  // Add creator as first member (admin)
  const targetContribution = Math.ceil(targetAmount / (memberCount || 1));
  const profile = user.profile as { full_name?: string; email?: string; phone?: string } | null;

  const { error: memberError } = await supabase
    .from('travel_circle_members')
    .insert({
      circle_id: circle.id,
      user_id: user.id,
      member_name: profile?.full_name || 'User',
      member_email: profile?.email || null,
      member_phone: profile?.phone || null,
      target_contribution: targetContribution,
      current_contribution: 0,
      status: 'active',
    });

  if (memberError) {
    logger.error('Failed to add creator as member', memberError);
  }

  return NextResponse.json({
    id: circle.id,
    name: circle.name,
    joinCode: circle.id.slice(0, 8).toUpperCase(),
  });
});

