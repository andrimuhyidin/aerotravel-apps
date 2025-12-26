/**
 * API: Travel Circle Contributions
 * GET /api/partner/travel-circle/[id]/contributions - List contributions
 * POST /api/partner/travel-circle/[id]/contributions - Record contribution
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { recordContribution } from '@/lib/partner/travel-circle';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type Params = Promise<{ id: string }>;

const contributionSchema = z.object({
  memberId: z.string().uuid(),
  amount: z.number().min(10000), // Min Rp 10k
  paymentMethod: z.enum(['wallet', 'transfer', 'midtrans']),
  paymentReference: z.string().optional(),
  walletTransactionId: z.string().uuid().optional(),
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

    // Get contributions
    const { data: contributions, error } = await client
      .from('travel_circle_contributions')
      .select(`
        *,
        member:travel_circle_members(member_name, member_email)
      `)
      .eq('circle_id', circleId)
      .order('contributed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch contributions', error);
      return NextResponse.json(
        { error: 'Failed to fetch contributions' },
        { status: 500 }
      );
    }

    const transformedContributions = (contributions || []).map((c: unknown) => {
      const contrib = c as {
        id: string;
        circle_id: string;
        member_id: string;
        amount: number;
        payment_method: string;
        payment_reference?: string;
        status: string;
        wallet_transaction_id?: string;
        contributed_at: string;
        confirmed_at?: string;
        member: {
          member_name: string;
          member_email?: string;
        } | null;
      };
      return {
        id: contrib.id,
        circleId: contrib.circle_id,
        memberId: contrib.member_id,
        memberName: contrib.member?.member_name || 'Unknown',
        memberEmail: contrib.member?.member_email,
        amount: Number(contrib.amount),
        paymentMethod: contrib.payment_method,
        paymentReference: contrib.payment_reference,
        status: contrib.status,
        walletTransactionId: contrib.wallet_transaction_id,
        contributedAt: contrib.contributed_at,
        confirmedAt: contrib.confirmed_at,
      };
    });

    return NextResponse.json({ contributions: transformedContributions });
  } catch (error) {
    logger.error('Failed to get contributions', error, { circleId });
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
  const data = contributionSchema.parse(body);

  const client = supabase as unknown as any;

  try {
    // Verify member belongs to user
    const { data: member } = await client
      .from('travel_circle_members')
      .select('id, user_id, circle_id')
      .eq('id', data.memberId)
      .eq('circle_id', circleId)
      .single();

    if (!member || member.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Member tidak ditemukan atau tidak memiliki akses' },
        { status: 403 }
      );
    }

    // If wallet payment, verify wallet balance
    if (data.paymentMethod === 'wallet') {
      const { data: wallet } = await client
        .from('mitra_wallets')
        .select('balance, credit_limit')
        .eq('mitra_id', user.id)
        .single();

      if (!wallet) {
        return NextResponse.json(
          { error: 'Wallet tidak ditemukan' },
          { status: 404 }
        );
      }

      const availableBalance = Number(wallet.balance || 0) + Number(wallet.credit_limit || 0);
      if (data.amount > availableBalance) {
        return NextResponse.json(
          { error: 'Saldo tidak mencukupi' },
          { status: 400 }
        );
      }

      // Debit wallet
      const balanceBefore = Number(wallet.balance || 0);
      const newBalance = balanceBefore - data.amount;

      // Create wallet transaction
      const { data: walletTx, error: txError } = await client
        .from('mitra_wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          transaction_type: 'circle_contribution',
          amount: -data.amount,
          balance_before: balanceBefore,
          balance_after: newBalance,
          description: `Contribution untuk travel circle`,
        })
        .select('id')
        .single();

      if (txError || !walletTx) {
        logger.error('Failed to create wallet transaction', txError);
        return NextResponse.json(
          { error: 'Gagal debit wallet' },
          { status: 500 }
        );
      }

      // Update wallet balance
      await client
        .from('mitra_wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      data.walletTransactionId = walletTx.id;
    }

    // Record contribution
    const result = await recordContribution({
      circleId,
      memberId: data.memberId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      walletTransactionId: data.walletTransactionId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    logger.info('Contribution recorded', {
      circleId,
      memberId: data.memberId,
      amount: data.amount,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      contributionId: result.contributionId,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to record contribution', error, {
      circleId,
      userId: user.id,
    });
    throw error;
  }
});

