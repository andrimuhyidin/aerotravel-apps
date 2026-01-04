/**
 * Travel Circle Detail API
 * GET /api/public/travel-circle/[id] - Get circle details
 * PATCH /api/public/travel-circle/[id] - Update circle
 * DELETE /api/public/travel-circle/[id] - Cancel circle
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id } = await context.params;
  logger.info('GET /api/public/travel-circle/[id]', { id });

  const supabase = await createClient();
  const user = await getCurrentUser();

  // Get circle with members and contributions
  const { data: circle, error } = await supabase
    .from('travel_circles')
    .select(`
      id,
      name,
      description,
      target_amount,
      target_date,
      current_amount,
      contribution_count,
      status,
      created_by,
      created_at,
      packages (
        id,
        name,
        destination,
        slug,
        duration_days,
        duration_nights
      ),
      travel_circle_members (
        id,
        user_id,
        member_name,
        member_email,
        target_contribution,
        current_contribution,
        status,
        joined_at
      ),
      travel_circle_contributions (
        id,
        member_id,
        amount,
        payment_method,
        status,
        contributed_at
      )
    `)
    .eq('id', id)
    .single();

  if (error || !circle) {
    return NextResponse.json(
      { error: 'Circle not found' },
      { status: 404 }
    );
  }

  // Check if user is a member
  const members = circle.travel_circle_members as {
    id: string;
    user_id: string;
    member_name: string;
    member_email: string | null;
    target_contribution: number;
    current_contribution: number;
    status: string;
    joined_at: string;
  }[];

  const isMember = members.some((m) => m.user_id === user?.id);
  const isAdmin = circle.created_by === user?.id;

  const pkg = circle.packages as {
    id: string;
    name: string;
    destination: string;
    slug: string;
    duration_days: number;
    duration_nights: number;
  } | null;

  const contributions = circle.travel_circle_contributions as {
    id: string;
    member_id: string;
    amount: number;
    payment_method: string;
    status: string;
    contributed_at: string;
  }[];

  const sortedContributions = [...contributions]
    .filter((c) => c.status === 'confirmed')
    .sort((a, b) => new Date(b.contributed_at).getTime() - new Date(a.contributed_at).getTime())
    .slice(0, 10);

  return NextResponse.json({
    id: circle.id,
    name: circle.name,
    description: circle.description,
    targetAmount: Number(circle.target_amount),
    targetDate: circle.target_date,
    currentAmount: Number(circle.current_amount),
    contributionCount: circle.contribution_count,
    status: circle.status,
    progress: (Number(circle.current_amount) / Number(circle.target_amount)) * 100,
    isAdmin,
    isMember,
    createdAt: circle.created_at,
    joinCode: circle.id.slice(0, 8).toUpperCase(),
    package: pkg ? {
      id: pkg.id,
      name: pkg.name,
      destination: pkg.destination,
      slug: pkg.slug,
      duration: `${pkg.duration_days}H${pkg.duration_nights}M`,
    } : null,
    members: members.map((m) => ({
      id: m.id,
      name: m.member_name,
      email: m.member_email,
      targetContribution: Number(m.target_contribution),
      currentContribution: Number(m.current_contribution),
      progress: (Number(m.current_contribution) / Number(m.target_contribution)) * 100,
      status: m.status,
      isCurrentUser: m.user_id === user?.id,
    })),
    recentContributions: sortedContributions.map((c) => {
      const member = members.find((m) => m.id === c.member_id);
      return {
        id: c.id,
        memberName: member?.member_name || 'Member',
        amount: Number(c.amount),
        paymentMethod: c.payment_method,
        contributedAt: c.contributed_at,
      };
    }),
  });
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id } = await context.params;
  const body = await request.json();
  
  logger.info('PATCH /api/public/travel-circle/[id]', { id });

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  // Check if user is admin
  const { data: circle } = await supabase
    .from('travel_circles')
    .select('created_by')
    .eq('id', id)
    .single();

  if (!circle || circle.created_by !== user.id) {
    return NextResponse.json(
      { error: 'Only admin can update circle' },
      { status: 403 }
    );
  }

  const { name, description, targetDate } = body;
  const updateData: Record<string, unknown> = {};

  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (targetDate) updateData.target_date = targetDate;

  const { error } = await supabase
    .from('travel_circles')
    .update(updateData)
    .eq('id', id);

  if (error) {
    logger.error('Failed to update circle', error);
    return NextResponse.json(
      { error: 'Failed to update circle' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id } = await context.params;
  
  logger.info('DELETE /api/public/travel-circle/[id]', { id });

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  // Check if user is admin
  const { data: circle } = await supabase
    .from('travel_circles')
    .select('created_by, current_amount')
    .eq('id', id)
    .single();

  if (!circle || circle.created_by !== user.id) {
    return NextResponse.json(
      { error: 'Only admin can cancel circle' },
      { status: 403 }
    );
  }

  // Can't cancel if there are contributions
  if (Number(circle.current_amount) > 0) {
    return NextResponse.json(
      { error: 'Cannot cancel circle with contributions. Contact support.' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('travel_circles')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) {
    logger.error('Failed to cancel circle', error);
    return NextResponse.json(
      { error: 'Failed to cancel circle' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});

