/**
 * API: Travel Circle Members
 * GET /api/partner/travel-circle/[id]/members - List members
 * POST /api/partner/travel-circle/[id]/members - Add member
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { addCircleMember } from '@/lib/partner/travel-circle';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type Params = Promise<{ id: string }>;

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  memberName: z.string().min(2).max(255),
  memberEmail: z.string().email().optional(),
  memberPhone: z.string().max(20).optional(),
  targetContribution: z.number().min(10000), // Min Rp 10k
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: circleId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // Verify access
    const { data: circle } = await client
      .from('travel_circles')
      .select('id, created_by')
      .eq('id', circleId)
      .single();

    if (!circle) {
      return NextResponse.json(
        { error: 'Travel circle tidak ditemukan' },
        { status: 404 }
      );
    }

    const isCreator = circle.created_by === user.id;
    const { data: member } = await client
      .from('travel_circle_members')
      .select('id')
      .eq('circle_id', circleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!isCreator && !member) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Get members
    const { data: members, error } = await client
      .from('travel_circle_members')
      .select('*')
      .eq('circle_id', circleId)
      .order('joined_at');

    if (error) {
      logger.error('Failed to fetch circle members', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    const transformedMembers = (members || []).map((m: unknown) => {
      const member = m as {
        id: string;
        circle_id: string;
        user_id: string;
        member_name: string;
        member_email?: string;
        member_phone?: string;
        target_contribution: number;
        current_contribution: number;
        status: string;
        joined_at: string;
      };
      return {
        id: member.id,
        circleId: member.circle_id,
        userId: member.user_id,
        memberName: member.member_name,
        memberEmail: member.member_email,
        memberPhone: member.member_phone,
        targetContribution: Number(member.target_contribution),
        currentContribution: Number(member.current_contribution),
        status: member.status,
        joinedAt: member.joined_at,
        progress: {
          percentage: member.target_contribution > 0
            ? Math.min(100, (Number(member.current_contribution) / Number(member.target_contribution)) * 100)
            : 0,
          remaining: Math.max(0, Number(member.target_contribution) - Number(member.current_contribution)),
        },
      };
    });

    return NextResponse.json({ members: transformedMembers });
  } catch (error) {
    logger.error('Failed to get circle members', error, { circleId });
    throw error;
  }
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: circleId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = addMemberSchema.parse(body);

  const client = supabase as unknown as any;

  try {
    // Verify user is creator
    const { data: circle } = await client
      .from('travel_circles')
      .select('id, created_by, status')
      .eq('id', circleId)
      .single();

    if (!circle || circle.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - hanya creator yang bisa menambah member' },
        { status: 403 }
      );
    }

    if (circle.status !== 'active') {
      return NextResponse.json(
        { error: 'Hanya circle aktif yang bisa menambah member' },
        { status: 400 }
      );
    }

    // Add member
    const result = await addCircleMember({
      circleId,
      userId: data.userId,
      memberName: data.memberName,
      memberEmail: data.memberEmail,
      memberPhone: data.memberPhone,
      targetContribution: data.targetContribution,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    logger.info('Circle member added', {
      circleId,
      memberId: result.memberId,
      addedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      memberId: result.memberId,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to add circle member', error, {
      circleId,
      userId: user.id,
    });
    throw error;
  }
});

