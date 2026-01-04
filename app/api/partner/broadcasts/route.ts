/**
 * API: Partner Broadcasts
 * GET /api/partner/broadcasts - List broadcasts
 * POST /api/partner/broadcasts - Create broadcast
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeRequestBody, sanitizeSearchParams, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createBroadcastSchema = z.object({
  name: z.string().min(3),
  templateName: z.string().min(1),
  audienceType: z.enum(['all', 'segment', 'custom']),
  segment: z.string().optional(),
  recipientIds: z.array(z.string()).optional(),
  recipientCount: z.number().min(1),
  sendNow: z.boolean(),
  scheduledAt: z.string().optional().nullable(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
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
    return NextResponse.json(
      { error: 'User is not a partner or team member' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  // Sanitize search params
  const sanitizedParams = sanitizeSearchParams(searchParams);
  const status = sanitizedParams.status || null;
  const limit = Math.min(parseInt(sanitizedParams.limit || '50'), 100); // Max 100
  const offset = parseInt(sanitizedParams.offset || '0');

  try {
    let query = client
      .from('partner_broadcasts')
      .select('*', { count: 'exact' })
      .eq('partner_id', partnerId) // Use verified partnerId
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: broadcasts, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch broadcasts', error, { userId: user.id });
      throw error;
    }

    const transformedBroadcasts = (broadcasts || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      templateName: b.template_name,
      recipientCount: b.recipient_count,
      sentCount: b.sent_count,
      failedCount: b.failed_count,
      status: b.status,
      scheduledAt: b.scheduled_at,
      sentAt: b.sent_at,
      createdAt: b.created_at,
    }));

    return NextResponse.json({
      broadcasts: transformedBroadcasts,
      total: count || 0,
    });
  } catch (error) {
    logger.error('Failed to fetch broadcasts', error, { userId: user.id });
    throw error;
  }
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
    return NextResponse.json(
      { error: 'User is not a partner or team member' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = createBroadcastSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  // Sanitize validated data
  const sanitizedData = sanitizeRequestBody(validation.data, {
    strings: ['name', 'templateName', 'segment'],
  });

  const { name, templateName, audienceType, segment, recipientIds, recipientCount, sendNow, scheduledAt } =
    sanitizedData;

  try {
    // Create broadcast (use verified partnerId)
    const { data: broadcast, error: broadcastError } = await client
      .from('partner_broadcasts')
      .insert({
        partner_id: partnerId, // Use verified partnerId
        name,
        template_name: templateName,
        audience_filter: { type: audienceType, segment },
        recipient_count: recipientCount,
        sent_count: 0,
        failed_count: 0,
        status: sendNow ? 'sending' : 'scheduled',
        scheduled_at: sendNow ? null : scheduledAt,
      })
      .select('id')
      .single();

    if (broadcastError || !broadcast) {
      logger.error('Failed to create broadcast', broadcastError, { userId: user.id });
      throw broadcastError;
    }

    // Get recipients based on audience type (use verified partnerId)
    let recipientQuery = client
      .from('partner_customers')
      .select('id, phone')
      .eq('partner_id', partnerId) // Use verified partnerId
      .is('deleted_at', null);

    if (audienceType === 'segment' && segment) {
      recipientQuery = recipientQuery.eq('segment', segment);
    } else if (audienceType === 'custom' && recipientIds) {
      recipientQuery = recipientQuery.in('id', recipientIds);
    }

    const { data: recipients, error: recipientsError } = await recipientQuery;

    if (recipientsError) {
      logger.error('Failed to fetch recipients', recipientsError, { userId: user.id });
      throw recipientsError;
    }

    // Create recipient records
    if (recipients && recipients.length > 0) {
      const recipientRecords = recipients.map((r: { id: string; phone: string }) => ({
        broadcast_id: broadcast.id,
        customer_id: r.id,
        phone_number: r.phone,
        status: 'pending',
      }));

      await client.from('partner_broadcast_recipients').insert(recipientRecords);
    }

    // If sendNow, trigger the broadcast job (in real app, this would be a background job)
    if (sendNow) {
      // Start sending in background
      // For now, we'll just log
      logger.info('Broadcast created and started', { broadcastId: broadcast.id, userId: user.id });

      // Trigger async sending via edge function or cron
      // await fetch('/api/cron/broadcast-sender', {
      //   method: 'POST',
      //   body: JSON.stringify({ broadcastId: broadcast.id }),
      // });
    }

    return NextResponse.json({
      success: true,
      broadcastId: broadcast.id,
    });
  } catch (error) {
    logger.error('Failed to create broadcast', error, { userId: user.id });
    throw error;
  }
});

