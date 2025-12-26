/**
 * Unified Notification Service
 * Core service untuk create dan manage notifications across all apps
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import {
  determineNotificationApps,
  getNotificationRecipients,
  isNotificationEnabled,
} from './notification-routing';
import type {
  AppType,
  CreateNotificationInput,
  NotificationFilter,
  NotificationType,
  UnifiedNotification,
} from './notification-types';

/**
 * Create a single notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<UnifiedNotification | null> {
  const supabase = await createClient();

  try {
    // Check if notification is enabled for this user/app/type
    const enabled = await isNotificationEnabled(input.user_id, input.app, input.type);
    if (!enabled) {
      logger.debug('[Notification] Notification disabled by preference', {
        userId: input.user_id,
        app: input.app,
        type: input.type,
      });
      return null;
    }

    const { data: notification, error } = await supabase
      .from('unified_notifications')
      .insert({
        user_id: input.user_id,
        app: input.app,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata || {},
        read: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('[Notification] Failed to create notification', error, input);
      return null;
    }

    logger.debug('[Notification] Notification created', {
      notificationId: notification.id,
      userId: input.user_id,
      app: input.app,
      type: input.type,
    });

    return notification as UnifiedNotification;
  } catch (error) {
    logger.error('[Notification] Failed to create notification', error, input);
    return null;
  }
}

/**
 * Create notifications for an event
 * Automatically routes to appropriate apps and users
 */
export async function createEventNotifications(
  eventType: NotificationType,
  metadata: Record<string, unknown>,
  title: string,
  message: string
): Promise<Array<UnifiedNotification>> {
  const notifications: UnifiedNotification[] = [];

  try {
    // Get recipients based on event type and metadata
    const recipients = await getNotificationRecipients(eventType, metadata);

    if (recipients.length === 0) {
      logger.warn('[Notification] No recipients found for event', { eventType, metadata });
      return notifications;
    }

    // Determine which apps should receive notifications
    const apps = await determineNotificationApps(recipients[0] || '', eventType);

    // Create notifications for each recipient and app combination
    for (const userId of recipients) {
      for (const app of apps) {
        // Check if notification is enabled
        const enabled = await isNotificationEnabled(userId, app, eventType);
        if (!enabled) {
          continue;
        }

        const notification = await createNotification({
          user_id: userId,
          app,
          type: eventType,
          title,
          message,
          metadata,
        });

        if (notification) {
          notifications.push(notification);
        }
      }
    }

    logger.info('[Notification] Event notifications created', {
      eventType,
      count: notifications.length,
      recipients: recipients.length,
      apps: apps.length,
    });

    return notifications;
  } catch (error) {
    logger.error('[Notification] Failed to create event notifications', error, {
      eventType,
      metadata,
    });
    return notifications;
  }
}

/**
 * Create batch notifications
 * Useful untuk bulk operations
 */
export async function createBatchNotifications(
  inputs: Array<CreateNotificationInput>
): Promise<Array<UnifiedNotification>> {
  const supabase = await createClient();
  const notifications: UnifiedNotification[] = [];

  try {
    // Filter enabled notifications
    const enabledInputs: CreateNotificationInput[] = [];

    for (const input of inputs) {
      const enabled = await isNotificationEnabled(input.user_id, input.app, input.type);
      if (enabled) {
        enabledInputs.push(input);
      }
    }

    if (enabledInputs.length === 0) {
      return notifications;
    }

    const { data: createdNotifications, error } = await supabase
      .from('unified_notifications')
      .insert(
        enabledInputs.map((input) => ({
          user_id: input.user_id,
          app: input.app,
          type: input.type,
          title: input.title,
          message: input.message,
          metadata: input.metadata || {},
          read: false,
        }))
      )
      .select();

    if (error) {
      logger.error('[Notification] Failed to create batch notifications', error);
      return notifications;
    }

    logger.info('[Notification] Batch notifications created', {
      count: createdNotifications?.length || 0,
      requested: inputs.length,
    });

    return (createdNotifications || []) as UnifiedNotification[];
  } catch (error) {
    logger.error('[Notification] Failed to create batch notifications', error);
    return notifications;
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  filter: NotificationFilter = {}
): Promise<{
  notifications: UnifiedNotification[];
  total: number;
}> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('unified_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filter.app) {
      query = query.eq('app', filter.app);
    }

    if (filter.type) {
      query = query.eq('type', filter.type);
    }

    if (filter.read !== undefined) {
      query = query.eq('read', filter.read);
    }

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error, count } = await query;

    if (error) {
      logger.error('[Notification] Failed to get notifications', error, { userId, filter });
      return { notifications: [], total: 0 };
    }

    return {
      notifications: (notifications || []) as UnifiedNotification[],
      total: count || 0,
    };
  } catch (error) {
    logger.error('[Notification] Failed to get notifications', error, { userId, filter });
    return { notifications: [], total: 0 };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('unified_notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      logger.error('[Notification] Failed to mark as read', error, {
        notificationId,
        userId,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[Notification] Failed to mark as read', error, { notificationId, userId });
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string,
  app?: AppType
): Promise<boolean> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('unified_notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (app) {
      query = query.eq('app', app);
    }

    const { error } = await query;

    if (error) {
      logger.error('[Notification] Failed to mark all as read', error, { userId, app });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[Notification] Failed to mark all as read', error, { userId, app });
    return false;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string, app?: AppType): Promise<number> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('unified_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (app) {
      query = query.eq('app', app);
    }

    const { count, error } = await query;

    if (error) {
      logger.error('[Notification] Failed to get unread count', error, { userId, app });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('[Notification] Failed to get unread count', error, { userId, app });
    return 0;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('unified_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      logger.error('[Notification] Failed to delete notification', error, {
        notificationId,
        userId,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[Notification] Failed to delete notification', error, {
      notificationId,
      userId,
    });
    return false;
  }
}

