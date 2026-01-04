/**
 * Broadcast Sender
 * Send notifications to multiple users
 */

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type BroadcastPayload = {
  id: string;
  title: string;
  message: string;
  targetRoles: string[];
  targetBranches?: string[];
  deliveryMethods: string[];
};

export type DeliveryResult = {
  recipientId: string;
  method: string;
  success: boolean;
  error?: string;
};

/**
 * Get target recipients based on broadcast settings
 */
export async function getTargetRecipients(
  targetRoles: string[],
  targetBranches?: string[]
): Promise<{ id: string; email: string; phone?: string; pushToken?: string }[]> {
  const supabase = await createAdminClient();

  let query = supabase
    .from('users')
    .select('id, email, phone, push_token')
    .eq('is_active', true);

  if (targetRoles.length > 0) {
    query = query.in('role', targetRoles);
  }

  if (targetBranches && targetBranches.length > 0) {
    query = query.in('branch_id', targetBranches);
  }

  const { data: users, error } = await query;

  if (error) {
    logger.error('Failed to get target recipients', error);
    return [];
  }

  return (users || []).map(u => ({
    id: u.id,
    email: u.email,
    phone: u.phone || undefined,
    pushToken: u.push_token || undefined,
  }));
}

/**
 * Send broadcast via in-app notification
 */
async function sendInAppNotification(
  broadcastId: string,
  recipientId: string,
  title: string,
  message: string
): Promise<DeliveryResult> {
  const supabase = await createAdminClient();

  try {
    // Insert into notifications table
    const { error } = await supabase.from('notifications').insert({
      user_id: recipientId,
      title,
      message,
      type: 'broadcast',
      is_read: false,
      metadata: { broadcast_id: broadcastId },
    });

    if (error) throw error;

    // Log delivery
    await supabase.from('broadcast_delivery_logs').insert({
      broadcast_id: broadcastId,
      recipient_id: recipientId,
      delivery_method: 'in_app',
      status: 'delivered',
      sent_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
    });

    return { recipientId, method: 'in_app', success: true };
  } catch (error) {
    logger.error('Failed to send in-app notification', error);
    
    await supabase.from('broadcast_delivery_logs').insert({
      broadcast_id: broadcastId,
      recipient_id: recipientId,
      delivery_method: 'in_app',
      status: 'failed',
      sent_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      recipientId,
      method: 'in_app',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send broadcast via email
 */
async function sendEmailNotification(
  broadcastId: string,
  recipientId: string,
  email: string,
  title: string,
  message: string
): Promise<DeliveryResult> {
  const supabase = await createAdminClient();

  try {
    // TODO: Integrate with Resend for email sending
    // For now, just log it
    logger.info('Would send email', { to: email, subject: title, body: message });

    await supabase.from('broadcast_delivery_logs').insert({
      broadcast_id: broadcastId,
      recipient_id: recipientId,
      delivery_method: 'email',
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return { recipientId, method: 'email', success: true };
  } catch (error) {
    logger.error('Failed to send email notification', error);
    
    await supabase.from('broadcast_delivery_logs').insert({
      broadcast_id: broadcastId,
      recipient_id: recipientId,
      delivery_method: 'email',
      status: 'failed',
      sent_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      recipientId,
      method: 'email',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send broadcast to all target recipients
 */
export async function sendBroadcast(
  payload: BroadcastPayload,
  onProgress?: (sent: number, total: number) => void
): Promise<{
  totalRecipients: number;
  successCount: number;
  failedCount: number;
}> {
  const supabase = await createAdminClient();

  // Update broadcast status to sending
  await supabase
    .from('broadcast_notifications')
    .update({
      status: 'sending',
      sent_at: new Date().toISOString(),
    })
    .eq('id', payload.id);

  // Get recipients
  const recipients = await getTargetRecipients(
    payload.targetRoles,
    payload.targetBranches
  );

  // Update recipient count
  await supabase
    .from('broadcast_notifications')
    .update({ recipient_count: recipients.length })
    .eq('id', payload.id);

  let successCount = 0;
  let failedCount = 0;
  let sent = 0;

  // Send to each recipient
  for (const recipient of recipients) {
    const results: DeliveryResult[] = [];

    for (const method of payload.deliveryMethods) {
      let result: DeliveryResult;

      switch (method) {
        case 'in_app':
          result = await sendInAppNotification(
            payload.id,
            recipient.id,
            payload.title,
            payload.message
          );
          break;

        case 'email':
          result = await sendEmailNotification(
            payload.id,
            recipient.id,
            recipient.email,
            payload.title,
            payload.message
          );
          break;

        // TODO: Add push, sms, whatsapp handlers
        default:
          result = {
            recipientId: recipient.id,
            method,
            success: false,
            error: `Unsupported method: ${method}`,
          };
      }

      results.push(result);
    }

    // Count successes for this recipient
    const anySuccess = results.some(r => r.success);
    if (anySuccess) {
      successCount++;
    } else {
      failedCount++;
    }

    sent++;
    onProgress?.(sent, recipients.length);
  }

  // Update broadcast status
  await supabase
    .from('broadcast_notifications')
    .update({
      status: failedCount === recipients.length ? 'failed' : 'completed',
      success_count: successCount,
      failed_count: failedCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.id);

  logger.info('Broadcast completed', {
    broadcastId: payload.id,
    totalRecipients: recipients.length,
    successCount,
    failedCount,
  });

  return {
    totalRecipients: recipients.length,
    successCount,
    failedCount,
  };
}

