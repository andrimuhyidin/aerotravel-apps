/**
 * Partner Notifications Service
 * In-app notifications untuk partner
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'wallet_low_balance'
  | 'commission_settled'
  | 'trip_approaching'
  | 'payment_due'
  | 'system_announcement';

export type Notification = {
  id: string;
  partnerId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
};

/**
 * Create in-app notification for partner
 */
export async function createPartnerNotification(
  partnerId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as any;

    await client.from('partner_notifications').insert({
      partner_id: partnerId,
      type,
      title,
      message,
      is_read: false,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    });

    logger.info('Partner notification created', {
      partnerId,
      type,
    });
  } catch (error) {
    logger.error('Failed to create partner notification', error, {
      partnerId,
      type,
    });
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string,
  partnerId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as any;

    const { error } = await client
      .from('partner_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('partner_id', partnerId);

    if (error) {
      logger.error('Failed to mark notification as read', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to mark notification as read', error);
    return false;
  }
}

/**
 * Mark all notifications as read for partner
 */
export async function markAllNotificationsRead(
  partnerId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as any;

    const { error } = await client
      .from('partner_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('partner_id', partnerId)
      .eq('is_read', false);

    if (error) {
      logger.error('Failed to mark all notifications as read', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to mark all notifications as read', error);
    return false;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(
  partnerId: string
): Promise<number> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as any;

    const { count, error } = await client
      .from('partner_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId)
      .eq('is_read', false);

    if (error) {
      logger.error('Failed to get unread count', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('Failed to get unread count', error);
    return 0;
  }
}

