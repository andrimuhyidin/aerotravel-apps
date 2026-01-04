/**
 * API: Training Reminders Send
 * POST /api/admin/guide/training/reminders/send - Manual trigger reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { sendTextMessage } from '@/lib/integrations/whatsapp';
import { logger } from '@/lib/utils/logger';

const sendReminderSchema = z.object({
  guide_id: z.string().uuid().optional(),
  training_id: z.string().uuid().optional(),
  reminder_type: z.enum(['due_soon', 'overdue']).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = sendReminderSchema.parse(await request.json());
  const client = supabase as unknown as any;

  try {
    // Get reminders from function
    const { data: reminders, error: remindersError } = await client.rpc(
      'check_mandatory_training_reminders'
    );

    if (remindersError) {
      logger.error('Failed to fetch reminders', remindersError);
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }

    // Filter reminders if specific guide_id or training_id provided
    let filteredReminders = reminders || [];
    if (payload.guide_id) {
      filteredReminders = filteredReminders.filter((r: any) => r.guide_id === payload.guide_id);
    }
    if (payload.training_id) {
      filteredReminders = filteredReminders.filter((r: any) => r.training_id === payload.training_id);
    }
    if (payload.reminder_type) {
      const typeMap: Record<string, string> = {
        due_soon: 'due_soon_7d',
        overdue: 'overdue',
      };
      filteredReminders = filteredReminders.filter(
        (r: any) => r.reminder_type === typeMap[payload.reminder_type!]
      );
    }

    // Send WhatsApp reminders
    const sentReminders = [];
    const failedReminders = [];

    for (const reminder of filteredReminders) {
      try {
        const daysText =
          reminder.reminder_type === 'overdue'
            ? `${Math.abs(reminder.days_until_due)} hari yang lalu`
            : reminder.reminder_type === 'due_soon_7d'
              ? '7 hari lagi'
              : '1 hari lagi';

        const message = `🔔 *Training Reminder*

Halo, ini adalah reminder untuk mandatory training Anda:

*${reminder.training_title}*

Due Date: ${new Date(reminder.due_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}

Status: ${reminder.reminder_type === 'overdue' ? '⚠️ OVERDUE' : '⏰ Due ' + daysText}

Silakan selesaikan training ini sebelum due date untuk menjaga compliance Anda.

Terima kasih.`;

        // Send WhatsApp message
        if (reminder.guide_phone) {
          await sendTextMessage(reminder.guide_phone, message);
        }

        // Update last_reminder_sent_at
        await client.rpc('update_last_reminder_sent', {
          p_assignment_id: reminder.assignment_id,
        });

        sentReminders.push(reminder.assignment_id);
      } catch (error) {
        logger.error('Failed to send reminder', error, { assignmentId: reminder.assignment_id });
        failedReminders.push({
          assignment_id: reminder.assignment_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Training reminders sent', {
      total: filteredReminders.length,
      sent: sentReminders.length,
      failed: failedReminders.length,
      adminId: user.id,
    });

    return NextResponse.json({
      success: true,
      total: filteredReminders.length,
      sent: sentReminders.length,
      failed: failedReminders.length,
      sent_reminders: sentReminders,
      failed_reminders: failedReminders,
    });
  } catch (error) {
    logger.error('Failed to send training reminders', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
});

