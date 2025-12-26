/**
 * Travel Circle / Arisan Logic
 * BRD 10 - Travel Circle / Arisan
 * Group savings feature untuk travel bookings
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type TravelCircle = {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
  packageId?: string;
  preferredDestination?: string;
  status: 'active' | 'completed' | 'cancelled';
  currentAmount: number;
  contributionCount: number;
  createdBy: string;
  branchId?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type TravelCircleMember = {
  id: string;
  circleId: string;
  userId: string;
  memberName: string;
  memberEmail?: string;
  memberPhone?: string;
  targetContribution: number;
  currentContribution: number;
  status: 'pending' | 'active' | 'completed' | 'left';
  joinedAt: string;
};

export type TravelCircleContribution = {
  id: string;
  circleId: string;
  memberId: string;
  amount: number;
  paymentMethod: 'wallet' | 'transfer' | 'midtrans';
  paymentReference?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  walletTransactionId?: string;
  contributedAt: string;
  confirmedAt?: string;
};

/**
 * Create travel circle
 */
export async function createTravelCircle(data: {
  name: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
  packageId?: string;
  preferredDestination?: string;
  createdBy: string;
  branchId?: string | null;
}): Promise<{ success: boolean; circleId?: string; message: string }> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    const { data: circle, error } = await client
      .from('travel_circles')
      .insert({
        name: data.name,
        description: data.description,
        target_amount: data.targetAmount,
        target_date: data.targetDate,
        package_id: data.packageId,
        preferred_destination: data.preferredDestination,
        created_by: data.createdBy,
        branch_id: data.branchId,
        status: 'active',
        current_amount: 0,
        contribution_count: 0,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to create travel circle', error);
      return { success: false, message: 'Gagal membuat travel circle.' };
    }

    logger.info('Travel circle created', { circleId: circle.id, createdBy: data.createdBy });

    return {
      success: true,
      circleId: circle.id,
      message: 'Travel circle berhasil dibuat.',
    };
  } catch (error) {
    logger.error('Failed to create travel circle', error);
    return { success: false, message: 'Gagal membuat travel circle.' };
  }
}

/**
 * Add member to travel circle
 */
export async function addCircleMember(data: {
  circleId: string;
  userId: string;
  memberName: string;
  memberEmail?: string;
  memberPhone?: string;
  targetContribution: number;
}): Promise<{ success: boolean; memberId?: string; message: string }> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    // Check if circle exists and is active
    const { data: circle } = await client
      .from('travel_circles')
      .select('id, status, target_amount')
      .eq('id', data.circleId)
      .single();

    if (!circle || circle.status !== 'active') {
      return { success: false, message: 'Travel circle tidak aktif atau tidak ditemukan.' };
    }

    // Calculate remaining target
    const { data: existingContributions } = await client
      .from('travel_circle_contributions')
      .select('amount')
      .eq('circle_id', data.circleId)
      .eq('status', 'confirmed');

    const totalContributed = (existingContributions || []).reduce(
      (sum: number, c: { amount: number }) => sum + Number(c.amount),
      0
    );
    const remaining = Number(circle.target_amount) - totalContributed;

    // Validate target contribution doesn't exceed remaining
    if (data.targetContribution > remaining) {
      return {
        success: false,
        message: `Target contribution melebihi sisa target (Rp ${remaining.toLocaleString('id-ID')}).`,
      };
    }

    // Add member
    const { data: member, error } = await client
      .from('travel_circle_members')
      .insert({
        circle_id: data.circleId,
        user_id: data.userId,
        member_name: data.memberName,
        member_email: data.memberEmail,
        member_phone: data.memberPhone,
        target_contribution: data.targetContribution,
        current_contribution: 0,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to add circle member', error);
      return { success: false, message: 'Gagal menambahkan member.' };
    }

    logger.info('Circle member added', { circleId: data.circleId, memberId: member.id });

    return {
      success: true,
      memberId: member.id,
      message: 'Member berhasil ditambahkan.',
    };
  } catch (error) {
    logger.error('Failed to add circle member', error);
    return { success: false, message: 'Gagal menambahkan member.' };
  }
}

/**
 * Record contribution
 */
export async function recordContribution(data: {
  circleId: string;
  memberId: string;
  amount: number;
  paymentMethod: 'wallet' | 'transfer' | 'midtrans';
  paymentReference?: string;
  walletTransactionId?: string;
}): Promise<{ success: boolean; contributionId?: string; message: string }> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    // Check circle and member
    const { data: circle } = await client
      .from('travel_circles')
      .select('id, status, target_amount, current_amount')
      .eq('id', data.circleId)
      .single();

    if (!circle || circle.status !== 'active') {
      return { success: false, message: 'Travel circle tidak aktif.' };
    }

    const { data: member } = await client
      .from('travel_circle_members')
      .select('id, target_contribution, current_contribution')
      .eq('id', data.memberId)
      .eq('circle_id', data.circleId)
      .single();

    if (!member) {
      return { success: false, message: 'Member tidak ditemukan.' };
    }

    // Validate amount doesn't exceed remaining target
    const remaining = Number(circle.target_amount) - Number(circle.current_amount);
    if (data.amount > remaining) {
      return {
        success: false,
        message: `Jumlah contribution melebihi sisa target (Rp ${remaining.toLocaleString('id-ID')}).`,
      };
    }

    // Create contribution
    const contributionStatus = data.paymentMethod === 'wallet' ? 'confirmed' : 'pending';
    
    const { data: contribution, error } = await client
      .from('travel_circle_contributions')
      .insert({
        circle_id: data.circleId,
        member_id: data.memberId,
        amount: data.amount,
        payment_method: data.paymentMethod,
        payment_reference: data.paymentReference,
        wallet_transaction_id: data.walletTransactionId,
        status: contributionStatus,
        confirmed_at: contributionStatus === 'confirmed' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to record contribution', error);
      return { success: false, message: 'Gagal mencatat contribution.' };
    }

    // Update progress (trigger will handle this, but we can also call function)
    if (contributionStatus === 'confirmed') {
      await client.rpc('update_travel_circle_progress', { p_circle_id: data.circleId });
      await client.rpc('update_member_contribution', { p_member_id: data.memberId });
    }

    logger.info('Contribution recorded', {
      circleId: data.circleId,
      memberId: data.memberId,
      amount: data.amount,
    });

    return {
      success: true,
      contributionId: contribution.id,
      message: 'Contribution berhasil dicatat.',
    };
  } catch (error) {
    logger.error('Failed to record contribution', error);
    return { success: false, message: 'Gagal mencatat contribution.' };
  }
}

/**
 * Get travel circle dengan members dan contributions
 */
export async function getTravelCircle(
  circleId: string,
  userId?: string
): Promise<TravelCircle & {
  members: TravelCircleMember[];
  contributions: TravelCircleContribution[];
  progress: {
    percentage: number;
    remaining: number;
    daysRemaining: number;
  };
} | null> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    // Get circle
    const { data: circle, error: circleError } = await client
      .from('travel_circles')
      .select('*')
      .eq('id', circleId)
      .single();

    if (circleError || !circle) {
      return null;
    }

    // Check access (creator or member)
    if (userId) {
      const isCreator = circle.created_by === userId;
      const { data: member } = await client
        .from('travel_circle_members')
        .select('id')
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!isCreator && !member) {
        return null; // No access
      }
    }

    // Get members
    const { data: members } = await client
      .from('travel_circle_members')
      .select('*')
      .eq('circle_id', circleId)
      .order('joined_at');

    // Get contributions
    const { data: contributions } = await client
      .from('travel_circle_contributions')
      .select('*')
      .eq('circle_id', circleId)
      .order('contributed_at', { ascending: false });

    // Calculate progress
    const currentAmount = Number(circle.current_amount || 0);
    const targetAmount = Number(circle.target_amount || 0);
    const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const remaining = Math.max(0, targetAmount - currentAmount);

    const targetDate = new Date(circle.target_date);
    const today = new Date();
    const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      targetAmount: Number(circle.target_amount),
      targetDate: circle.target_date,
      packageId: circle.package_id,
      preferredDestination: circle.preferred_destination,
      status: circle.status,
      currentAmount: currentAmount,
      contributionCount: Number(circle.contribution_count || 0),
      createdBy: circle.created_by,
      branchId: circle.branch_id,
      createdAt: circle.created_at,
      updatedAt: circle.updated_at,
      completedAt: circle.completed_at,
      members: (members || []).map((m: unknown) => {
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
          status: member.status as TravelCircleMember['status'],
          joinedAt: member.joined_at,
        };
      }),
      contributions: (contributions || []).map((c: unknown) => {
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
        };
        return {
          id: contrib.id,
          circleId: contrib.circle_id,
          memberId: contrib.member_id,
          amount: Number(contrib.amount),
          paymentMethod: contrib.payment_method as TravelCircleContribution['paymentMethod'],
          paymentReference: contrib.payment_reference,
          status: contrib.status as TravelCircleContribution['status'],
          walletTransactionId: contrib.wallet_transaction_id,
          contributedAt: contrib.contributed_at,
          confirmedAt: contrib.confirmed_at,
        };
      }),
      progress: {
        percentage: Math.min(100, Math.round(percentage * 100) / 100),
        remaining,
        daysRemaining: Math.max(0, daysRemaining),
      },
    };
  } catch (error) {
    logger.error('Failed to get travel circle', error, { circleId });
    return null;
  }
}

/**
 * Auto-book saat target tercapai
 */
export async function autoBookOnTargetReached(
  circleId: string,
  bookingData: {
    packageId: string;
    tripDate: string;
    paxCount: number;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
  }
): Promise<{ success: boolean; bookingId?: string; message: string }> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    // Get circle
    const { data: circle } = await client
      .from('travel_circles')
      .select('id, status, created_by, current_amount, target_amount')
      .eq('id', circleId)
      .single();

    if (!circle || circle.status !== 'completed') {
      return { success: false, message: 'Circle belum mencapai target atau tidak aktif.' };
    }

    // Create booking (simplified - reuse booking API logic)
    // For now, we'll just link to existing booking creation
    // In production, this would trigger actual booking creation

    // Link circle to booking (will be created separately)
    logger.info('Auto-booking triggered for travel circle', {
      circleId,
      createdBy: circle.created_by,
    });

    return {
      success: true,
      message: 'Auto-booking akan diproses. Silakan buat booking manual untuk saat ini.',
    };
  } catch (error) {
    logger.error('Failed to auto-book for travel circle', error, { circleId });
    return { success: false, message: 'Gagal melakukan auto-booking.' };
  }
}

