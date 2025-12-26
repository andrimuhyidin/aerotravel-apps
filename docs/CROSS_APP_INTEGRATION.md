# Cross-App Data Integration

## Overview

Sistem integrasi data cross-app memastikan konsistensi data real-time antar semua aplikasi (Customer, Guide, Partner, Admin, Corporate). Sistem ini menggunakan Supabase Realtime, Event Bus, Unified Notifications, dan Cache Layer untuk mencapai tujuan tersebut.

## Architecture

```
Client Apps (Customer, Partner, Guide, Admin, Corporate)
    ↓
Real-time Layer (Supabase Realtime)
    ↓
Event Bus (Event-driven architecture)
    ↓
Notification Service (Unified notifications)
    ↓
Cache Layer (Redis)
    ↓
Data Layer (Supabase PostgreSQL)
```

## Components

### 1. Realtime Infrastructure

**Location:** `lib/realtime/`

- `realtime-client.ts` - Client-side Realtime channel management
- `realtime-hooks.ts` - React hooks untuk subscriptions
- `realtime-server.ts` - Server-side Realtime utilities

**Usage:**

```typescript
import { useRealtimeSubscription } from '@/lib/realtime/realtime-hooks';

function MyComponent() {
  useRealtimeSubscription(
    'my-channel',
    { table: 'bookings', event: 'UPDATE', filter: 'id=eq.123' },
    (payload) => {
      console.log('Booking updated:', payload);
    }
  );
}
```

### 2. Unified Notifications

**Location:** `lib/notifications/`

- `unified-notifications.ts` - Core notification service
- `notification-types.ts` - Type definitions
- `notification-routing.ts` - Cross-app routing logic

**Usage:**

```typescript
import { createEventNotifications } from '@/lib/notifications/unified-notifications';

await createEventNotifications(
  'booking.created',
  { bookingId: '123', bookingCode: 'BK-001' },
  'Booking Baru',
  'Booking baru telah dibuat'
);
```

### 3. Event Bus

**Location:** `lib/events/`

- `event-bus.ts` - Core event bus
- `event-types.ts` - Event type definitions
- `event-handlers.ts` - Pre-configured handlers

**Usage:**

```typescript
import { emitEvent } from '@/lib/events/event-bus';

await emitEvent({
  type: 'booking.status_changed',
  app: 'partner',
  userId: 'user-123',
  data: { bookingId: '123', newStatus: 'confirmed' },
});
```

### 4. Cache Layer

**Location:** `lib/cache/`

- `package-availability-cache.ts` - Availability caching
- `cache-invalidation.ts` - Cache invalidation utilities

**Usage:**

```typescript
import { getCachedAvailability } from '@/lib/cache/package-availability-cache';

const availability = await getCachedAvailability(
  packageId,
  date,
  minPax,
  async () => {
    // Calculate availability
    return calculatedAvailability;
  }
);
```

## Real-time Sync

### Booking Status Sync

**Location:** `lib/realtime/booking-sync.ts`, `hooks/use-booking-realtime.ts`

```typescript
import { useBookingRealtimeUpdate } from '@/hooks/use-booking-realtime';

function BookingDetail({ bookingId }: { bookingId: string }) {
  const { isSubscribed } = useBookingRealtimeUpdate(
    bookingId,
    (updatedBooking) => {
      // Update booking state
      setBooking(updatedBooking);
    }
  );
}
```

### Package Availability Sync

**Location:** `lib/realtime/availability-sync.ts`, `hooks/use-availability-realtime.ts`

### Wallet Balance Sync

**Location:** `lib/realtime/wallet-sync.ts`, `hooks/use-wallet-realtime.ts`

### Trip Assignment Sync

**Location:** `lib/realtime/trip-sync.ts`, `hooks/use-trip-realtime.ts`

## Unified Customer Profiles

**Location:** `lib/customers/`

- `unified-customer.ts` - Unified customer service
- `customer-matching.ts` - Customer matching algorithm

**Usage:**

```typescript
import { getUnifiedCustomer } from '@/lib/customers/unified-customer';

const customer = await getUnifiedCustomer({
  email: 'customer@example.com',
  phone: '+6281234567890',
});
```

## Audit Trail

**Location:** `lib/audit/cross-app-audit.ts`

**Usage:**

```typescript
import { logAuditEvent } from '@/lib/audit/cross-app-audit';

await logAuditEvent(
  'partner',
  userId,
  'update',
  'booking',
  bookingId,
  { status: { from: 'pending', to: 'confirmed' } },
  { ipAddress, userAgent }
);
```

## Unified Analytics

**Location:** `lib/analytics/unified-analytics.ts`

**API:** `GET /api/analytics/unified`

Returns aggregated metrics dari semua apps:
- Bookings by app and status
- Revenue by app
- Customer metrics
- Package popularity

## Monitoring

**Location:** `lib/monitoring/`

- `realtime-health.ts` - Realtime health checks
- `cache-metrics.ts` - Cache performance metrics

**API:** `GET /api/health/realtime`

Returns:
- Realtime connection status
- Active subscriptions count
- Cache hit/miss rates

## Database Tables

### unified_notifications
Stores notifications untuk all apps.

### notification_preferences
User preferences untuk notification types.

### app_events
Event bus audit trail.

### audit_logs
Cross-app audit trail.

### unified_customer_profiles (View)
Unified view of customers across apps.

## Migration Files

1. `20250202000001_106-enable-realtime-tables.sql` - Enable Realtime untuk tables
2. `20250202000002_107-unified-notifications.sql` - Create unified notifications tables
3. `20250202000003_108-app-events.sql` - Create app_events table
4. `20250202000004_109-unified-customer-views.sql` - Create unified customer views
5. `20250202000005_110-cross-app-audit.sql` - Create audit_logs table

## Best Practices

1. **Always use event bus** untuk cross-app communication
2. **Use cache layer** untuk expensive queries
3. **Subscribe to Realtime** hanya untuk data yang perlu real-time updates
4. **Log audit events** untuk semua data changes
5. **Monitor health** regularly via health endpoints

## Troubleshooting

### Realtime not working
- Check if table is enabled for Realtime: `GET /api/health/realtime`
- Verify Supabase Realtime is enabled in project settings
- Check browser console untuk connection errors

### Cache not updating
- Check cache invalidation is called after data changes
- Verify Redis connection: Check `.env.local` for `UPSTASH_REDIS_*` vars
- Check cache metrics: `GET /api/health/realtime`

### Events not firing
- Verify event handlers are initialized: `initializeEventHandlers()`
- Check event bus subscription count
- Verify event is being emitted correctly

