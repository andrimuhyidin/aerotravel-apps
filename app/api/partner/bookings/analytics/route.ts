/**
 * API: Booking Analytics Tracking
 * POST /api/partner/bookings/analytics - Track conversion events
 * 
 * Events:
 * - started: User started booking flow
 * - step_completed: User completed a step
 * - abandoned: User abandoned booking
 * - completed: Booking successfully created
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    bookingId,
    draftId,
    eventType,
    stepName,
    timeSpentSeconds,
    metadata = {},
  } = body;

  // Validate event type
  const validEvents = ['started', 'step_completed', 'abandoned', 'completed'];
  if (!eventType || !validEvents.includes(eventType)) {
    return NextResponse.json(
      { error: `Invalid event type. Must be one of: ${validEvents.join(', ')}` },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  try {
    // Insert analytics event
    const { data: event, error } = await client
      .from('booking_analytics')
      .insert({
        partner_id: user.id,
        booking_id: bookingId || null,
        draft_id: draftId || null,
        event_type: eventType,
        step_name: stepName || null,
        time_spent_seconds: timeSpentSeconds || null,
        metadata: {
          ...metadata,
          user_agent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to track analytics event', error, {
        userId: user.id,
        eventType,
      });
      // Don't fail the request for analytics errors
      return NextResponse.json({ success: false, error: 'Failed to track event' }, { status: 500 });
    }

    logger.info('Analytics event tracked', {
      userId: user.id,
      eventType,
      stepName,
      eventId: event.id,
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    logger.error('Failed to track analytics event', error, {
      userId: user.id,
      eventType,
    });
    // Don't throw - analytics should be fire-and-forget
    return NextResponse.json({ success: false }, { status: 200 });
  }
});

