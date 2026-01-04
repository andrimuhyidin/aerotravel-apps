/**
 * API: Wallet Events
 * POST /api/partner/wallet/events
 * Emit wallet-related events for real-time updates
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const walletEventSchema = z.object({
  eventType: z.enum(['balance_changed', 'topup_completed', 'withdrawal_requested', 'credit_used', 'credit_repaid']),
  walletId: z.string().uuid(),
  amount: z.number(),
  balanceAfter: z.number().optional(),
  transactionId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const validation = walletEventSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const { eventType, walletId, amount, balanceAfter, transactionId, metadata } = validation.data;

  try {
    // Verify wallet belongs to this partner
    const { data: wallet, error: walletError } = await client
      .from('mitra_wallets')
      .select('id, mitra_id')
      .eq('id', walletId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (wallet.mitra_id !== partnerId) {
      return NextResponse.json(
        { error: 'Wallet does not belong to this partner' },
        { status: 403 }
      );
    }

    // Emit via unified event bus
    try {
      const { emitEvent } = await import('@/lib/events/event-bus');
      
      // Map eventType to unified event types
      const eventTypeMap: Record<string, string> = {
        balance_changed: 'wallet.balance_changed',
        topup_completed: 'wallet.transaction_completed',
        withdrawal_requested: 'wallet.balance_changed',
        credit_used: 'wallet.balance_changed',
        credit_repaid: 'wallet.transaction_completed',
      };
      
      const unifiedEventType = eventTypeMap[eventType] || 'wallet.balance_changed';
      
      await emitEvent(
        {
          type: unifiedEventType as 'wallet.balance_changed' | 'wallet.transaction_completed',
          app: 'partner',
          userId: user.id,
          data: {
            eventType,
            walletId,
            amount,
            balanceAfter,
            transactionId,
            partnerId,
            ...metadata,
          },
        },
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      );
    } catch (eventBusError) {
      // Log but don't fail - event bus is not critical
      logger.warn('Failed to emit wallet event via event bus', {
        error: eventBusError,
        eventType,
        walletId,
      });
    }

    // Broadcast to Supabase Realtime channel (if configured)
    // The client can subscribe to 'wallet:{walletId}' channel
    try {
      await client
        .from('wallet_realtime_events')
        .insert({
          wallet_id: walletId,
          event_type: eventType,
          amount,
          balance_after: balanceAfter,
          transaction_id: transactionId,
          created_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();
    } catch (realtimeError) {
      // Realtime table might not exist, that's okay
      logger.debug('Realtime event insert skipped (table may not exist)', {
        eventType,
        walletId,
      });
    }

    logger.info('Wallet event emitted', {
      eventType,
      walletId,
      partnerId,
      amount,
    });

    return NextResponse.json({
      success: true,
      eventType,
      walletId,
    });
  } catch (error) {
    logger.error('Failed to emit wallet event', error, {
      eventType,
      walletId,
      partnerId,
    });
    throw error;
  }
});

