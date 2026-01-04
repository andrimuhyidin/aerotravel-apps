# 🚀 Booking & Order Management Migrations

## Migration Files

1. **092-booking-draft-status.sql** - Add draft status and tracking
2. **093-booking-reminders.sql** - Create booking_reminders table
3. **094-booking-reminder-function.sql** - Create reminder calculation function

## ✅ Running Migrations

### Method 1: Supabase Dashboard (RECOMMENDED)

1. **Open Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new
   ```

2. **Run each migration file:**
   - Copy content from `supabase/migrations/20250125000010_092-booking-draft-status.sql`
   - Paste in SQL Editor and click **Run**
   - Repeat for migrations 093 and 094

3. **Verify:**
   ```sql
   -- Check draft_saved_at column
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'bookings' 
     AND column_name = 'draft_saved_at';
   
   -- Check booking_reminders table
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name = 'booking_reminders';
   
   -- Check function
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name = 'get_bookings_needing_reminders';
   ```

### Method 2: psql Command

```bash
# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Run migrations
psql "$DATABASE_URL" -f supabase/migrations/20250125000010_092-booking-draft-status.sql
psql "$DATABASE_URL" -f supabase/migrations/20250125000011_093-booking-reminders.sql
psql "$DATABASE_URL" -f supabase/migrations/20250125000012_094-booking-reminder-function.sql
```

### Method 3: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref mjzukilsgkdqmcusjdut

# Push migrations
supabase db push
```

## 🔧 Setting Up Cron Jobs

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/booking-reminders",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/booking-draft-cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `booking-reminders`: Daily at 02:00 UTC (09:00 WIB) - Send reminders for bookings
- `booking-draft-cleanup`: Daily at 03:00 UTC (10:00 WIB) - Clean up old draft bookings

### Environment Variables

Add to `.env.local` and Vercel:

```bash
# Cron Secret (for security)
CRON_SECRET=your-secret-key-here

# Base URL for booking links
NEXT_PUBLIC_BASE_URL=https://app.aerotravel.id
# or for local development:
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Manual Testing

Test cron endpoints manually:

```bash
# Test booking reminders
curl -X GET "http://localhost:3000/api/cron/booking-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test draft cleanup
curl -X GET "http://localhost:3000/api/cron/booking-draft-cleanup" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## ✅ Verification Checklist

After running migrations:

- [ ] `draft_saved_at` column exists in `bookings` table
- [ ] `booking_reminders` table exists with correct schema
- [ ] `get_bookings_needing_reminders()` function exists
- [ ] RLS policies are active on `booking_reminders` table
- [ ] Indexes are created for performance
- [ ] Cron jobs are configured in Vercel
- [ ] `CRON_SECRET` is set in environment variables
- [ ] `NEXT_PUBLIC_BASE_URL` is set correctly

## 🐛 Troubleshooting

### Error: "column draft_saved_at does not exist"
**Solution:** Run migration 092 manually via Supabase Dashboard

### Error: "relation booking_reminders does not exist"
**Solution:** Run migration 093 manually via Supabase Dashboard

### Error: "function get_bookings_needing_reminders does not exist"
**Solution:** Run migration 094 manually via Supabase Dashboard

### Cron jobs not running
**Check:**
1. `vercel.json` has cron configuration
2. `CRON_SECRET` is set in Vercel environment variables
3. Cron schedule is correct (UTC time)
4. API routes are accessible

### Reminders not being sent
**Check:**
1. `get_bookings_needing_reminders()` function returns data
2. Email service (Resend) is configured
3. Partner emails are valid
4. Booking status is 'confirmed' or 'pending_payment'
5. Trip date is exactly 7, 3, or 1 days away

## 📝 Next Steps

1. ✅ Run migrations
2. ✅ Setup cron jobs in Vercel
3. ✅ Test endpoints manually
4. ✅ Verify database schema
5. ✅ Monitor cron job execution
6. ✅ Test reminder emails
7. ✅ Test draft cleanup

