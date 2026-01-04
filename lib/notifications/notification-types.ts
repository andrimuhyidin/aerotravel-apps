/**
 * Unified Notification Types
 * Type definitions untuk cross-app notification system
 */

export type AppType = 'customer' | 'partner' | 'guide' | 'admin' | 'corporate';

export type NotificationType =
  | 'booking.created'
  | 'booking.status_changed'
  | 'booking.cancelled'
  | 'booking.confirmed'
  | 'payment.received'
  | 'payment.failed'
  | 'trip.assigned'
  | 'trip.status_changed'
  | 'trip.cancelled'
  | 'package.availability_changed'
  | 'wallet.balance_changed'
  | 'wallet.transaction_completed'
  | 'refund.processed'
  | 'refund.rejected'
  | 'support.ticket_created'
  | 'support.ticket_updated'
  | 'support.ticket_resolved'
  | 'system.announcement'
  | 'system.maintenance'
  | 'corporate.approval_requested'
  | 'corporate.approval_approved'
  | 'corporate.approval_rejected'
  | 'corporate.budget_threshold'
  | 'corporate.booking_reminder'
  | 'corporate.employee_invited'
  | 'custom';

export type UnifiedNotification = {
  id: string;
  user_id: string;
  app: AppType;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
};

export type NotificationPreference = {
  id: string;
  user_id: string;
  app: AppType;
  notification_type: NotificationType;
  enabled: boolean;
  channels: Array<'in_app' | 'email' | 'push' | 'sms'>;
  created_at: string;
  updated_at: string;
};

export type CreateNotificationInput = {
  user_id: string;
  app: AppType;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export type NotificationFilter = {
  app?: AppType;
  type?: NotificationType;
  read?: boolean;
  limit?: number;
  offset?: number;
};

