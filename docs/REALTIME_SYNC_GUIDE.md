# Real-time Sync Guide

## Overview

Guide ini menjelaskan cara menggunakan real-time sync untuk booking, availability, wallet, dan trip updates.

## Setup

### 1. Enable Realtime untuk Tables

Realtime sudah di-enable untuk tables berikut:
- `bookings`
- `trips`
- `mitra_wallet_transactions`
- `guide_wallet_transactions`
- `packages`
- `partner_notifications`
- `unified_notifications`

### 2. Import Hooks

```typescript
import { useBookingRealtimeUpdate } from '@/hooks/use-booking-realtime';
import { useAvailabilityRealtime } from '@/hooks/use-availability-realtime';
import { useWalletRealtime } from '@/hooks/use-wallet-realtime';
import { useTripRealtime } from '@/hooks/use-trip-realtime';
```

## Booking Real-time Sync

### Basic Usage

```typescript
function BookingDetail({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);

  const { isSubscribed } = useBookingRealtimeUpdate(
    bookingId,
    (updatedBooking) => {
      setBooking(updatedBooking);
      toast.info('Booking updated');
    },
    true // enabled
  );

  return (
    <div>
      {isSubscribed && <Badge>Live</Badge>}
      {/* Booking details */}
    </div>
  );
}
```

### Advanced Usage

```typescript
function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Subscribe to multiple bookings
  useEffect(() => {
    const bookingIds = bookings.map((b) => b.id);
    const unsubscribe = setupBookingsRealtimeSync(bookingIds, (updatedBooking) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
      );
    });

    return unsubscribe;
  }, [bookings]);
}
```

## Package Availability Real-time Sync

```typescript
function PackageDetail({ packageId }: { packageId: string }) {
  const [availability, setAvailability] = useState<Availability[]>([]);

  const { onUpdate, isSubscribed } = useAvailabilityRealtime(packageId, true);

  useEffect(() => {
    onUpdate((update) => {
      // Refresh availability data
      loadAvailability();
    });
  }, [onUpdate]);

  return (
    <div>
      {isSubscribed && <Badge variant="success">Live Availability</Badge>}
      {/* Availability calendar */}
    </div>
  );
}
```

## Wallet Real-time Sync

```typescript
function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const { data: { user } } = useAuth();

  const { onBalanceChange, isSubscribed } = useWalletRealtime(
    user?.id || null,
    'partner', // or 'guide'
    true
  );

  useEffect(() => {
    onBalanceChange((newBalance) => {
      setBalance(newBalance);
      toast.success('Balance updated');
    });
  }, [onBalanceChange]);

  return (
    <div>
      {isSubscribed && <Badge>Live Balance</Badge>}
      <div>Balance: {formatCurrency(balance)}</div>
    </div>
  );
}
```

## Trip Real-time Sync

```typescript
function TripDetail({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);

  const { onUpdate, isSubscribed } = useTripRealtime(tripId, true);

  useEffect(() => {
    onUpdate((updatedTrip) => {
      setTrip(updatedTrip);
    });
  }, [onUpdate]);

  // Also subscribe to assignment changes
  const { onAssignmentChange } = useTripAssignmentRealtime(tripId, true);

  useEffect(() => {
    onAssignmentChange((assignment) => {
      // Refresh trip assignments
      loadTripAssignments();
    });
  }, [onAssignmentChange]);

  return (
    <div>
      {isSubscribed && <Badge>Live Updates</Badge>}
      {/* Trip details */}
    </div>
  );
}
```

## Custom Realtime Subscriptions

### Using Realtime Client Directly

```typescript
import { createRealtimeChannel } from '@/lib/realtime/realtime-client';

function MyComponent() {
  useEffect(() => {
    const channel = createRealtimeChannel(
      'my-custom-channel',
      {
        table: 'my_table',
        event: 'UPDATE',
        filter: 'id=eq.123',
      },
      (payload) => {
        console.log('Update received:', payload);
      }
    );

    return () => channel.unsubscribe();
  }, []);
}
```

### Using Realtime Hooks

```typescript
import { useRealtimeSubscription } from '@/lib/realtime/realtime-hooks';

function MyComponent() {
  const { isSubscribed, error } = useRealtimeSubscription(
    'my-channel',
    { table: 'my_table', event: 'UPDATE', filter: 'id=eq.123' },
    (payload) => {
      console.log('Update:', payload);
    },
    true // enabled
  );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{isSubscribed ? 'Subscribed' : 'Not subscribed'}</div>;
}
```

## Best Practices

1. **Always cleanup subscriptions** - Use `useEffect` cleanup function
2. **Handle errors gracefully** - Show user-friendly error messages
3. **Show connection status** - Display subscription status to users
4. **Debounce updates** - For high-frequency updates, debounce the callback
5. **Limit subscriptions** - Don't subscribe to too many channels at once

## Troubleshooting

### Subscription not working
- Check if table is enabled for Realtime
- Verify channel name is unique
- Check browser console untuk errors
- Verify Supabase client is initialized correctly

### Too many subscriptions
- Use connection pooling (already implemented)
- Batch subscriptions when possible
- Unsubscribe when component unmounts

### Performance issues
- Limit number of active subscriptions
- Use filters to reduce event volume
- Debounce high-frequency updates

