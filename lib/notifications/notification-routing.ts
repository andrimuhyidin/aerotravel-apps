/**
 * Notification Routing Logic
 * Cross-app notification routing berdasarkan user roles dan preferences
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import type {
  AppType,
  CreateNotificationInput,
  NotificationType,
} from './notification-types';

/**
 * Determine which apps should receive a notification
 * based on event type and user roles
 */
export async function determineNotificationApps(
  userId: string,
  eventType: NotificationType
): Promise<AppType[]> {
  const supabase = await createClient();
  const apps: AppType[] = [];

  try {
    // Get user profile and roles
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (!userProfile) {
      return apps;
    }

    const role = userProfile.role as string;

    // Route based on event type
    switch (eventType) {
      case 'booking.created':
      case 'booking.status_changed':
      case 'booking.cancelled':
      case 'booking.confirmed':
        // Notify customer, partner (if mitra_id), and admin
        apps.push('customer', 'admin');
        if (role === 'mitra' || role === 'customer') {
          apps.push('partner');
        }
        break;

      case 'payment.received':
      case 'payment.failed':
        // Notify customer, partner (if mitra_id), and admin
        apps.push('customer', 'admin');
        if (role === 'mitra') {
          apps.push('partner');
        }
        break;

      case 'trip.assigned':
      case 'trip.status_changed':
      case 'trip.cancelled':
        // Notify guide, partner (if booking has mitra_id), and admin
        apps.push('guide', 'admin');
        if (role === 'mitra') {
          apps.push('partner');
        }
        break;

      case 'wallet.balance_changed':
      case 'wallet.transaction_completed':
        // Notify based on wallet type
        if (role === 'mitra') {
          apps.push('partner');
        } else if (role === 'guide') {
          apps.push('guide');
        }
        apps.push('admin');
        break;

      case 'refund.processed':
      case 'refund.rejected':
        // Notify customer, partner (if mitra_id), and admin
        apps.push('customer', 'admin');
        if (role === 'mitra') {
          apps.push('partner');
        }
        break;

      case 'support.ticket_created':
      case 'support.ticket_updated':
      case 'support.ticket_resolved':
        // Notify based on ticket creator
        if (role === 'mitra') {
          apps.push('partner');
        } else if (role === 'customer') {
          apps.push('customer');
        }
        apps.push('admin');
        break;

      case 'system.announcement':
      case 'system.maintenance':
        // Notify all apps
        apps.push('customer', 'partner', 'guide', 'admin', 'corporate');
        break;

      default:
        // Default: notify admin only
        apps.push('admin');
    }

    // Remove duplicates
    return Array.from(new Set(apps));
  } catch (error) {
    logger.error('[Notification] Failed to determine apps', error, { userId, eventType });
    // Fallback: notify admin only
    return ['admin'];
  }
}

/**
 * Get user IDs that should receive notification
 * based on event context (e.g., booking owner, partner, etc.)
 */
export async function getNotificationRecipients(
  eventType: NotificationType,
  metadata: Record<string, unknown>
): Promise<string[]> {
  const supabase = await createClient();
  const recipients: string[] = [];

  try {
    switch (eventType) {
      case 'booking.created':
      case 'booking.status_changed':
      case 'booking.cancelled':
      case 'booking.confirmed':
      case 'payment.received':
      case 'payment.failed':
        // Get booking owner (customer_id or user who created booking)
        if (metadata.bookingId) {
          const { data: booking } = await supabase
            .from('bookings')
            .select('customer_id, mitra_id, created_by')
            .eq('id', metadata.bookingId as string)
            .maybeSingle();

          if (booking) {
            // Add customer if exists
            if (booking.customer_id) {
              recipients.push(booking.customer_id as string);
            }
            // Add partner if exists
            if (booking.mitra_id) {
              recipients.push(booking.mitra_id as string);
            }
            // Add creator if different
            if (booking.created_by && !recipients.includes(booking.created_by as string)) {
              recipients.push(booking.created_by as string);
            }
          }
        }
        break;

      case 'trip.assigned':
      case 'trip.status_changed':
      case 'trip.cancelled':
        // Get assigned guides
        if (metadata.tripId) {
          const { data: tripGuides } = await supabase
            .from('trip_guides')
            .select('guide_id')
            .eq('trip_id', metadata.tripId as string);

          if (tripGuides) {
            tripGuides.forEach((tg) => {
              if (tg.guide_id && !recipients.includes(tg.guide_id as string)) {
                recipients.push(tg.guide_id as string);
              }
            });
          }
        }
        break;

      case 'wallet.balance_changed':
      case 'wallet.transaction_completed':
        // Get wallet owner
        if (metadata.userId) {
          recipients.push(metadata.userId as string);
        }
        break;

      case 'refund.processed':
      case 'refund.rejected':
        // Get refund owner
        if (metadata.refundId) {
          const { data: refund } = await supabase
            .from('refunds')
            .select('booking_id')
            .eq('id', metadata.refundId as string)
            .maybeSingle();

          if (refund?.booking_id) {
            const { data: booking } = await supabase
              .from('bookings')
              .select('customer_id, mitra_id')
              .eq('id', refund.booking_id as string)
              .maybeSingle();

            if (booking) {
              if (booking.customer_id) {
                recipients.push(booking.customer_id as string);
              }
              if (booking.mitra_id) {
                recipients.push(booking.mitra_id as string);
              }
            }
          }
        }
        break;

      case 'support.ticket_created':
      case 'support.ticket_updated':
      case 'support.ticket_resolved':
        // Get ticket creator and assigned admin
        if (metadata.ticketId) {
          const { data: ticket } = await supabase
            .from('tickets')
            .select('user_id, assigned_to')
            .eq('id', metadata.ticketId as string)
            .maybeSingle();

          if (ticket) {
            if (ticket.user_id) {
              recipients.push(ticket.user_id as string);
            }
            if (ticket.assigned_to && !recipients.includes(ticket.assigned_to as string)) {
              recipients.push(ticket.assigned_to as string);
            }
          }
        }
        break;

      case 'system.announcement':
      case 'system.maintenance':
        // Get all active users (or specific user groups from metadata)
        if (metadata.userIds && Array.isArray(metadata.userIds)) {
          recipients.push(...(metadata.userIds as string[]));
        } else if (metadata.userGroup) {
          // Get users by role or group
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('role', metadata.userGroup as string)
            .eq('is_active', true);

          if (users) {
            users.forEach((u) => {
              if (u.id && !recipients.includes(u.id)) {
                recipients.push(u.id);
              }
            });
          }
        }
        break;
    }

    // Remove duplicates
    return Array.from(new Set(recipients));
  } catch (error) {
    logger.error('[Notification] Failed to get recipients', error, { eventType, metadata });
    return [];
  }
}

/**
 * Check if user has notification preference enabled
 */
export async function isNotificationEnabled(
  userId: string,
  app: AppType,
  notificationType: NotificationType
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { data: preference } = await supabase
      .from('notification_preferences')
      .select('enabled')
      .eq('user_id', userId)
      .eq('app', app)
      .eq('notification_type', notificationType)
      .maybeSingle();

    // Default to enabled if no preference found
    return preference?.enabled ?? true;
  } catch (error) {
    logger.error('[Notification] Failed to check preference', error, {
      userId,
      app,
      notificationType,
    });
    // Default to enabled on error
    return true;
  }
}

