/**
 * API: Process Absence Notifications
 * POST /api/admin/guide/absence/notify - Process pending absence notifications and send WhatsApp to admin
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sendTextMessage } from '@/lib/integrations/whatsapp';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  // Get pending notifications
  const { data: pendingNotifications, error: fetchError } = await client
    .from('guide_absence_notifications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10); // Process 10 at a time

  if (fetchError) {
    logger.error('Failed to fetch pending notifications', fetchError);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  if (!pendingNotifications || pendingNotifications.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: 'No pending notifications',
    });
  }

  const opsPhone = process.env.WHATSAPP_OPS_PHONE;
  if (!opsPhone) {
    logger.warn('WHATSAPP_OPS_PHONE not configured, skipping notifications');
    return NextResponse.json({
      success: false,
      error: 'WhatsApp Ops Phone not configured',
    });
  }

  let processed = 0;
  let failed = 0;

  // Get template processor
  const { processNotificationTemplateWithFallback } = await import('@/lib/templates/notification');

  const fallbackTemplate = `⚠️ *GUIDE ABSENT DETECTED* ⚠️

*Guide:* {{guide_name}}
*Trip:* {{trip_code}}
*Meeting Time:* {{meeting_time}}
*Minutes Late:* {{minutes_late}} menit

Guide belum melakukan check-in 15 menit setelah meeting time.

Mohon segera ditindaklanjuti dari dashboard Admin.
Detail: {{trip_url}}`;

  for (const notification of pendingNotifications) {
    try {
      const guideName = notification.guide_name || 'Unknown Guide';
      const tripCode = notification.trip_code || 'Unknown Trip';
      const meetingTime = new Date(notification.meeting_time).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const minutesLate = notification.minutes_late || 0;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Use template with variables
      const variables = {
        guide_name: guideName,
        trip_code: tripCode,
        meeting_time: meetingTime,
        minutes_late: minutesLate,
        trip_url: `${baseUrl}/admin/trips/${notification.trip_id}`,
      };

      const message = await processNotificationTemplateWithFallback(
        'guide_absence',
        variables,
        fallbackTemplate
      );

      // Send WhatsApp
      await sendTextMessage(opsPhone, message);

      // Update notification status
      await client
        .from('guide_absence_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      processed++;
      logger.info('Absence notification sent', {
        notificationId: notification.id,
        guideId: notification.guide_id,
        tripId: notification.trip_id,
      });
    } catch (error) {
      logger.error('Failed to send absence notification', error, {
        notificationId: notification.id,
      });

      // Update notification status to failed
      await client
        .from('guide_absence_notifications')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error),
          retry_count: (notification.retry_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    failed,
    total: pendingNotifications.length,
  });
});

