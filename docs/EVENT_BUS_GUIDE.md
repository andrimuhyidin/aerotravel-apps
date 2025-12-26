# Event Bus Guide

## Overview

Event Bus adalah sistem event-driven architecture untuk cross-app communication. Semua events disimpan di database untuk audit trail dan dapat trigger notifications, cache invalidation, dan actions lainnya.

## Architecture

```
App Action (e.g., booking created)
    ↓
Emit Event (via event bus)
    ↓
Store in app_events table
    ↓
Trigger Registered Handlers
    ↓
- Create notifications
- Invalidate cache
- Update analytics
- Log audit trail
```

## Event Types

### Booking Events
- `booking.created` - Booking baru dibuat
- `booking.status_changed` - Status booking berubah
- `booking.cancelled` - Booking dibatalkan
- `booking.confirmed` - Booking dikonfirmasi

### Payment Events
- `payment.received` - Pembayaran diterima
- `payment.failed` - Pembayaran gagal

### Trip Events
- `trip.assigned` - Trip ditugaskan ke guide
- `trip.status_changed` - Status trip berubah
- `trip.cancelled` - Trip dibatalkan

### Package Events
- `package.availability_changed` - Availability package berubah
- `package.updated` - Package di-update

### Wallet Events
- `wallet.balance_changed` - Saldo wallet berubah
- `wallet.transaction_completed` - Transaksi wallet selesai

### Refund Events
- `refund.processed` - Refund diproses
- `refund.rejected` - Refund ditolak

### Support Events
- `support.ticket_created` - Ticket support dibuat
- `support.ticket_updated` - Ticket di-update
- `support.ticket_resolved` - Ticket diselesaikan

### System Events
- `system.announcement` - System announcement
- `system.maintenance` - Maintenance notification

## Usage

### Emitting Events

```typescript
import { emitEvent } from '@/lib/events/event-bus';

// Emit booking created event
await emitEvent(
  {
    type: 'booking.created',
    app: 'partner',
    userId: user.id,
    data: {
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      packageId: booking.package_id,
      tripDate: booking.trip_date,
      totalAmount: booking.total_amount,
    },
  },
  {
    ipAddress: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
  }
);
```

### Subscribing to Events

```typescript
import { subscribeToEvent } from '@/lib/events/event-bus';

// Subscribe to booking events
const unsubscribe = subscribeToEvent('booking.status_changed', async (event) => {
  console.log('Booking status changed:', event.data);
  
  // Your custom logic here
  await updateRelatedData(event.data.bookingId);
});

// Later, unsubscribe
unsubscribe();
```

### Multiple Event Subscriptions

```typescript
import { subscribeToEvents } from '@/lib/events/event-bus';

const unsubscribe = subscribeToEvents([
  {
    eventType: 'booking.created',
    handler: async (event) => {
      // Handle booking created
    },
  },
  {
    eventType: 'payment.received',
    handler: async (event) => {
      // Handle payment received
    },
  },
]);

// Unsubscribe all
unsubscribe();
```

## Pre-configured Handlers

Default handlers sudah di-configure di `lib/events/event-handlers.ts`:

- **Booking handlers**: Create notifications, invalidate cache
- **Payment handlers**: Create notifications, update booking status
- **Trip handlers**: Create notifications, update assignments
- **Package handlers**: Invalidate availability cache
- **Wallet handlers**: Create notifications

### Initialize Handlers

Handlers harus di-initialize saat app startup:

```typescript
import { initializeEventHandlers } from '@/lib/events/event-handlers';

// In app initialization
initializeEventHandlers();
```

## Event History

### Get Event History

```typescript
import { getEventHistory } from '@/lib/events/event-bus';

const { events, total } = await getEventHistory({
  eventType: 'booking.created',
  app: 'partner',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  limit: 50,
  offset: 0,
});
```

### API Endpoint

```
GET /api/events?type=booking.created&app=partner&startDate=2025-01-01&endDate=2025-01-31
```

## Best Practices

1. **Always emit events** untuk important actions (create, update, delete)
2. **Include relevant data** dalam event payload
3. **Use appropriate event types** - don't create custom types unless necessary
4. **Handle errors gracefully** dalam event handlers
5. **Don't block** - event handlers should be async and non-blocking

## Integration Examples

### Booking Creation

```typescript
// In booking creation API
const booking = await createBooking(data);

// Emit event
await emitEvent(
  {
    type: 'booking.created',
    app: 'partner',
    userId: user.id,
    data: {
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      packageId: booking.package_id,
      tripDate: booking.trip_date,
    },
  },
  { ipAddress, userAgent }
);

// Event handlers will:
// 1. Create notifications
// 2. Invalidate availability cache
// 3. Log audit trail
```

### Payment Received

```typescript
// In payment webhook
await emitEvent(
  {
    type: 'payment.received',
    app: 'customer',
    userId: booking.customer_id,
    data: {
      bookingId: booking.id,
      paymentId: payment.id,
      amount: payment.amount,
    },
  }
);

// Event handlers will:
// 1. Create notifications
// 2. Update booking status
// 3. Update wallet balance (if applicable)
```

## Custom Event Handlers

### Creating Custom Handler

```typescript
import { subscribeToEvent } from '@/lib/events/event-bus';

// Custom handler untuk specific business logic
subscribeToEvent('booking.created', async (event) => {
  // Your custom logic
  await sendCustomNotification(event.data);
  await updateCustomMetrics(event.data);
});
```

## Monitoring

### Get Subscription Count

```typescript
import { getSubscriptionCount } from '@/lib/events/event-bus';

const totalSubscriptions = getSubscriptionCount();
const bookingSubscriptions = getSubscriptionCount('booking.created');
```

## Troubleshooting

### Events not firing
- Check if handlers are initialized
- Verify event is being emitted correctly
- Check event bus logs

### Handlers not executing
- Verify handler is subscribed
- Check for errors in handler execution
- Verify event type matches subscription

### Performance issues
- Limit number of handlers per event type
- Make handlers async and non-blocking
- Use event filtering when possible

