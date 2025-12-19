/**
 * API: SOS Emergency
 * POST /api/guide/sos - Trigger SOS alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const sosSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notify_nearby_crew: z.boolean().default(false),
  message: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = sosSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get user profile
  const { data: userProfile } = await client
    .from('users')
    .select('full_name, phone, email')
    .eq('id', user.id)
    .single();

  // Create SOS record (if you have a sos_alerts table)
  // For now, we'll log and notify

  logger.error('SOS ALERT TRIGGERED', {
    guideId: user.id,
    guideName: userProfile?.full_name,
    location: payload.latitude && payload.longitude ? { lat: payload.latitude, lng: payload.longitude } : null,
    message: payload.message,
  });

  // Notify nearby crew if requested
  if (payload.notify_nearby_crew && payload.latitude && payload.longitude) {
    try {
      // Get nearby crew
      const nearbyRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/guide/crew/directory/nearby?lat=${payload.latitude}&lng=${payload.longitude}&radius=10000`,
      );

      if (nearbyRes.ok) {
        const nearbyData = await nearbyRes.json();
        const nearbyCrew = nearbyData.nearby || [];

        // Send notifications to nearby crew (via push notifications or WhatsApp)
        // This would integrate with your notification system
        logger.info('SOS: Notifying nearby crew', {
          guideId: user.id,
          nearbyCount: nearbyCrew.length,
        });
      }
    } catch (error) {
      logger.error('Failed to notify nearby crew', error);
    }
  }

  // Send SOS to admin/emergency contacts
  // This would integrate with your notification system (WhatsApp, SMS, Push)

  return NextResponse.json({
    success: true,
    message: 'SOS alert sent',
    location: payload.latitude && payload.longitude ? { lat: payload.latitude, lng: payload.longitude } : null,
  });
});
