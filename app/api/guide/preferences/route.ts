/**
 * API: Guide Preferences
 * GET /api/guide/preferences - Get preferences
 * PUT /api/guide/preferences - Update preferences
 * POST /api/guide/preferences/reset - Reset to defaults
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: preferences, error: prefError } = await (supabase as any)
      .from('guide_preferences')
      .select('*')
      .eq('guide_id', user.id)
      .maybeSingle();

    if (prefError) {
      logger.error('Failed to fetch preferences', prefError, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Return defaults if not exists
    if (!preferences) {
      return NextResponse.json({
        preferences: {
          guide_id: user.id,
          preferred_trip_types: [],
          preferred_locations: [],
          preferred_days_of_week: [],
          preferred_time_slots: { morning: true, afternoon: true, evening: false },
          max_trips_per_day: 1,
          max_trips_per_week: 5,
          notification_preferences: { push: true, email: false, sms: false },
          preferred_language: 'id',
          theme_preference: 'system',
          dashboard_layout: null,
          learning_style: null,
          preferred_content_format: null,
          favorite_destinations: [],
          preferred_durations: [],
        },
      });
    }

    return NextResponse.json({
      preferences,
    });
  } catch (error) {
    logger.error('Failed to fetch preferences', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    // Check if preferences exist
    const { data: existing } = await (supabase as any)
      .from('guide_preferences')
      .select('id')
      .eq('guide_id', user.id)
      .maybeSingle();

    let preferences;
    if (existing) {
      // Update
      const { data: updated, error: updateError } = await (supabase as any)
        .from('guide_preferences')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to update preferences', updateError, { guideId: user.id });
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
      }

      preferences = updated;
    } else {
      // Create
      const { data: created, error: createError } = await (supabase as any)
        .from('guide_preferences')
        .insert({
          guide_id: user.id,
          ...body,
        })
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create preferences', createError, { guideId: user.id });
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
      }

      preferences = created;
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    logger.error('Failed to update preferences', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { pathname } = new URL(request.url);
  
  if (pathname.includes('/reset')) {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const defaults = {
        preferred_trip_types: [],
        preferred_locations: [],
        preferred_days_of_week: [],
        preferred_time_slots: { morning: true, afternoon: true, evening: false },
        max_trips_per_day: 1,
        max_trips_per_week: 5,
        notification_preferences: { push: true, email: false, sms: false },
        preferred_language: 'id',
        theme_preference: 'system',
        dashboard_layout: null,
        learning_style: null,
        preferred_content_format: null,
        favorite_destinations: [],
        preferred_durations: [],
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await (supabase as any)
        .from('guide_preferences')
        .select('id')
        .eq('guide_id', user.id)
        .maybeSingle();

      if (existing) {
        const { data: reset, error: resetError } = await (supabase as any)
          .from('guide_preferences')
          .update(defaults)
          .eq('id', existing.id)
          .select()
          .single();

        if (resetError) {
          logger.error('Failed to reset preferences', resetError, { guideId: user.id });
          return NextResponse.json({ error: 'Failed to reset preferences' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          preferences: reset,
        });
      }

      // Create with defaults
      const { data: created, error: createError } = await (supabase as any)
        .from('guide_preferences')
        .insert({
          guide_id: user.id,
          ...defaults,
        })
        .select()
        .single();

      if (createError) {
        logger.error('Failed to reset preferences', createError, { guideId: user.id });
        return NextResponse.json({ error: 'Failed to reset preferences' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        preferences: created,
      });
    } catch (error) {
      logger.error('Failed to reset preferences', error, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to reset preferences' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
});
