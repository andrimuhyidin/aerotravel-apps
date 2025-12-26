# Booking Reminder System Documentation

## Overview

Sistem reminder otomatis untuk partner bookings yang mengirimkan notifikasi email kepada partner (mitra) pada H-7, H-3, dan H-1 hari sebelum tanggal trip.

## Architecture

### Components

1. **Database Function**: `get_bookings_needing_reminders()`
   - Location: `supabase/migrations/20250125000012_094-booking-reminder-function.sql`
   - Returns bookings yang perlu reminder (H-7, H-3, H-1)
   - Excludes bookings yang sudah pernah dikirim reminder untuk type tersebut

2. **Cron Job**: `/api/cron/booking-reminders`
   - Location: `app/api/cron/booking-reminders/route.ts`
   - Schedule: Daily at 02:00 UTC (09:00 WIB)
   - Configuration: `vercel.json`

3. **Manual Reminder API**: `/api/partner/bookings/[id]/reminders`
   - Location: `app/api/partner/bookings/[id]/reminders/route.ts`
   - Allows manual trigger untuk specific booking

4. **Email Template**: `generateBookingReminderEmail()`
   - Location: `lib/partner/email-templates/booking-reminder.ts`
   - Generates HTML email dengan booking details

## Flow Diagram

```
┌─────────────────┐
│  Vercel Cron    │
│  (Daily 02:00)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ /api/cron/booking-     │
│ reminders (GET)         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Verify CRON_SECRET      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Call DB Function:       │
│ get_bookings_needing_   │
│ reminders()             │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ For each booking:       │
│ 1. Generate email       │
│ 2. Send to partner      │
│ 3. Record in DB         │
└─────────────────────────┘
```

## Reminder Types

| Type | Days Before Trip | Purpose |
|------|------------------|---------|
| **H-7** | 7 days | Early reminder untuk persiapan |
| **H-3** | 3 days | Final confirmation reminder |
| **H-1** | 1 day | Last minute reminder |

## Database Schema

### `booking_reminders` Table

```sql
CREATE TABLE booking_reminders (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  reminder_type VARCHAR(10), -- 'H-7', 'H-3', 'H-1'
  sent_to_email VARCHAR(255),
  sent_to_phone VARCHAR(20),
  notification_method VARCHAR(20), -- 'email', 'whatsapp', 'sms'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Function: `get_bookings_needing_reminders()`

**Logic:**
- Only partner bookings (`mitra_id IS NOT NULL`)
- Status: `confirmed` or `pending_payment`
- Trip date >= today
- Days until trip IN (7, 3, 1)
- No existing reminder untuk type tersebut

## Configuration

### Vercel Cron (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/booking-reminders",
      "schedule": "0 2 * * *"  // Daily at 02:00 UTC (09:00 WIB)
    }
  ]
}
```

### Environment Variables

- `CRON_SECRET`: Secret untuk protect cron endpoint (optional, untuk development bisa kosong)
- `NEXT_PUBLIC_APP_URL`: Base URL untuk booking links
- Resend API key: Untuk send email

## Email Template

Email dikirim ke partner (mitra) dengan informasi:
- Booking code
- Package name
- Trip date
- Pax count (adult, child, infant)
- Link ke booking detail page

## Manual Reminder

Partner bisa trigger manual reminder via:
- `POST /api/partner/bookings/[id]/reminders`
- Body: `{ "reminderType": "H-7" | "H-3" | "H-1" }`

## Testing

### Test Cases

1. **H-7 Reminder**
   - Create booking dengan trip_date = today + 7 days
   - Run cron job
   - Verify email sent
   - Verify reminder recorded in DB

2. **H-3 Reminder**
   - Create booking dengan trip_date = today + 3 days
   - Run cron job
   - Verify email sent

3. **H-1 Reminder**
   - Create booking dengan trip_date = today + 1 day
   - Run cron job
   - Verify email sent

4. **Duplicate Prevention**
   - Send H-7 reminder
   - Run cron job again
   - Verify no duplicate reminder sent

5. **Status Filter**
   - Create booking dengan status `cancelled`
   - Run cron job
   - Verify no reminder sent

6. **Past Trip**
   - Create booking dengan trip_date < today
   - Run cron job
   - Verify no reminder sent

### Manual Testing

```bash
# Test cron endpoint (with CRON_SECRET)
curl -X GET https://your-app.vercel.app/api/cron/booking-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test manual reminder
curl -X POST https://your-app.vercel.app/api/partner/bookings/{bookingId}/reminders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reminderType": "H-7"}'
```

## Monitoring

### Logs

Cron job logs:
- `[Cron] Starting booking reminder notifications`
- `[Cron] Found bookings needing reminders`
- `[Cron] Reminder email sent`
- `[Cron] Booking reminder notifications completed`

### Metrics

Track:
- Total reminders sent per day
- Failed reminders
- Reminder types distribution (H-7, H-3, H-1)

## Troubleshooting

### Reminders Not Sending

1. Check cron job configuration di Vercel
2. Verify `CRON_SECRET` (jika configured)
3. Check database function exists
4. Verify booking status dan trip_date
5. Check email service (Resend) configuration
6. Review logs untuk errors

### Duplicate Reminders

- Function sudah prevent duplicates dengan `NOT EXISTS` check
- Jika masih terjadi, check `booking_reminders` table untuk existing records

## Future Enhancements

1. WhatsApp notifications (selain email)
2. SMS notifications untuk critical reminders
3. Custom reminder schedules per partner
4. Reminder preferences (opt-in/opt-out)
5. Reminder analytics dashboard

