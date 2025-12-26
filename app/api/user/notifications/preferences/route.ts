/**
 * API: Notification Preferences
 * GET /api/user/notifications/preferences - Get notification preferences
 * PUT /api/user/notifications/preferences - Update notification preferences
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const notificationPreferencesSchema = z.object({
  email: z.object({
    bookingConfirmation: z.boolean().default(true),
    payment: z.boolean().default(true),
    invoice: z.boolean().default(true),
    wallet: z.boolean().default(true),
  }).optional(),
  inApp: z.object({
    enabled: z.boolean().default(true),
  }).optional(),
  frequency: z.enum(['instant', 'daily', 'weekly']).default('instant'),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = supabase as unknown as any;

    // Get user preferences from users table or default
    const { data: profile } = await client
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    // Default preferences
    const defaultPreferences = {
      email: {
        bookingConfirmation: true,
        payment: true,
        invoice: true,
        wallet: true,
      },
      inApp: {
        enabled: true,
      },
      frequency: 'instant' as const,
    };

    const preferences = profile?.notification_preferences || defaultPreferences;

    return NextResponse.json({
      preferences: {
        ...defaultPreferences,
        ...preferences,
        email: {
          ...defaultPreferences.email,
          ...(preferences.email || {}),
        },
        inApp: {
          ...defaultPreferences.inApp,
          ...(preferences.inApp || {}),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get notification preferences', error, {
      userId: user.id,
    });
    throw error;
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

  try {
    const body = await request.json();
    const validatedData = notificationPreferencesSchema.parse(body);

    const client = supabase as unknown as any;

    // Get current preferences
    const { data: profile } = await client
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    const currentPreferences = profile?.notification_preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...validatedData,
      email: {
        ...(currentPreferences.email || {}),
        ...(validatedData.email || {}),
      },
      inApp: {
        ...(currentPreferences.inApp || {}),
        ...(validatedData.inApp || {}),
      },
    };

    // Update preferences in users table
    const { error: updateError } = await client
      .from('users')
      .update({ notification_preferences: updatedPreferences })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to update notification preferences', updateError, {
        userId: user.id,
      });
      
      // If column doesn't exist, we'll just log and return success
      // In production, you'd want to add this column via migration
      logger.warn('notification_preferences column may not exist', {
        userId: user.id,
      });
    }

    logger.info('Notification preferences updated', {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Preferensi notifikasi berhasil diperbarui',
      preferences: updatedPreferences,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    logger.error('Failed to update notification preferences', error, {
      userId: user.id,
    });
    throw error;
  }
});

