# Attendance Reminder Notifications System

## Overview

Automated notification system untuk mengingatkan guide check-in sebelum trip departure.

## Notification Schedule

### 1. **Pre-Check-in Reminder** (30 menit sebelum departure)

- **Trigger:** 30 minutes before trip `departure_time`
- **Channel:** Push notification + In-app notification
- **Message:** "🚀 Jangan lupa check-in! Trip ke {destination} berangkat dalam 30 menit."
- **Action:** Deep link ke attendance page

### 2. **Check-in Window Opened** (2 jam sebelum departure)

- **Trigger:** 2 hours before trip `departure_time`
- **Channel:** In-app notification
- **Message:** "✅ Check-in window sudah dibuka untuk trip {trip_code}"
- **Action:** Deep link ke attendance page

### 3. **Late Check-in Warning** (10 menit sebelum departure, belum check-in)

- **Trigger:** 10 minutes before departure, no check-in record
- **Channel:** Push notification (urgent)
- **Message:** "⚠️ URGENT: Segera check-in! Late penalty akan diterapkan."
- **Action:** Deep link ke attendance page

### 4. **Missed Check-in Alert** (After departure time, no check-in)

- **Trigger:** After departure time + 5 minutes
- **Channel:** Push notification + SMS
- **Message:** "❌ You missed check-in for trip {trip_code}. Contact dispatch immediately."
- **Action:** Call dispatch button

## Implementation Options

### Option A: Supabase Edge Functions + Cron (Recommended)

```typescript
// supabase/functions/attendance-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // Run every 5 minutes via cron
  // Query trips starting in next 30 minutes
  // Send notifications to guides without check-in
});
```

**Cron Schedule:** `*/5 * * * *` (every 5 minutes)

### Option B: Next.js API Route + External Cron Service

```typescript
// app/api/cron/attendance-reminders/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  // Send reminders
}
```

**External Services:**

- Vercel Cron
- Cron-job.org
- EasyCron

### Option C: Background Worker (Node.js)

Separate worker process yang run continuous loop.

## Database Schema Required

```sql
-- Notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  trip_id UUID REFERENCES trips(id),
  notification_type VARCHAR(50), -- 'pre_checkin_reminder', 'late_warning', etc
  channel VARCHAR(20), -- 'push', 'in_app', 'sms'
  title TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
```

## Push Notification Integration

### Firebase Cloud Messaging (FCM)

1. Setup FCM in project
2. Store device tokens in `user_devices` table
3. Send via FCM API

### OneSignal (Alternative)

Simpler setup, good analytics

## Testing

```bash
# Manual trigger for testing
curl -X POST http://localhost:3000/api/cron/attendance-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring

- Track notification delivery rate
- Monitor failed sends
- Alert on high failure rate

## TODO

- [ ] Setup Supabase Edge Function
- [ ] Create notification_logs table
- [ ] Implement FCM integration
- [ ] Setup cron schedule
- [ ] Add notification preferences (opt-in/out)
- [ ] Create notification settings UI
