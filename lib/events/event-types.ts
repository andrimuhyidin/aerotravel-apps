/**
 * Event Types for Cross-App Event Bus
 * Type definitions untuk event-driven architecture
 */

export type AppType = 'customer' | 'partner' | 'guide' | 'admin' | 'corporate';

export type EventType =
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
  | 'package.updated'
  | 'wallet.balance_changed'
  | 'wallet.transaction_completed'
  | 'refund.processed'
  | 'refund.rejected'
  | 'support.ticket_created'
  | 'support.ticket_updated'
  | 'support.ticket_resolved'
  | 'customer.created'
  | 'customer.updated'
  | 'system.announcement'
  | 'system.maintenance'
  | 'custom';

export type AppEvent = {
  id: string;
  type: EventType;
  app: AppType;
  userId: string;
  data: Record<string, unknown>;
  timestamp: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
  };
};

export type EventHandler = (event: AppEvent) => Promise<void> | void;

export type EventHandlerRegistry = Map<EventType, Set<EventHandler>>;

