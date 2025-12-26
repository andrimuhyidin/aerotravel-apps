# ✅ Booking & Order Management - Setup Complete

## 🎉 Status: Ready for Production

Semua implementasi sudah selesai dan siap digunakan!

## 📋 Checklist Setup

### ✅ 1. Database Migrations

**Status:** ✅ Migrations sudah diverifikasi (semua sudah ada di database)

Verifikasi:
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

**Jika belum ada, jalankan migrations:**
1. Buka: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new
2. Run file: `supabase/migrations/20250125000010_092-booking-draft-status.sql`
3. Run file: `supabase/migrations/20250125000011_093-booking-reminders.sql`
4. Run file: `supabase/migrations/20250125000012_094-booking-reminder-function.sql`

### ✅ 2. Vercel Cron Jobs

**Status:** ✅ Konfigurasi sudah dibuat di `vercel.json`

**Cron Jobs:**
- **Booking Reminders:** Daily at 02:00 UTC (09:00 WIB)
  - Path: `/api/cron/booking-reminders`
  - Purpose: Send reminder emails (H-7, H-3, H-1 days before trip)

- **Draft Cleanup:** Daily at 03:00 UTC (10:00 WIB)
  - Path: `/api/cron/booking-draft-cleanup`
  - Purpose: Delete draft bookings older than 7 days

**Setup di Vercel:**
1. Push `vercel.json` ke repository
2. Vercel akan otomatis detect dan setup cron jobs
3. Atau setup manual di Vercel Dashboard > Settings > Cron Jobs

### ✅ 3. Environment Variables

**Tambahkan ke `.env.local` dan Vercel:**

```bash
# Cron Secret (untuk security)
CRON_SECRET=your-secret-key-here-change-in-production

# Base URL untuk booking links di email
NEXT_PUBLIC_BASE_URL=https://app.aerotravel.id
# Untuk local development:
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Setup di Vercel:**
1. Go to: Vercel Dashboard > Project > Settings > Environment Variables
2. Add:
   - `CRON_SECRET` = (generate random secret)
   - `NEXT_PUBLIC_BASE_URL` = https://app.aerotravel.id

### ✅ 4. Testing

**Test Manual Endpoints:**

```bash
# Test booking reminders (dengan CRON_SECRET)
curl -X GET "http://localhost:3000/api/cron/booking-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test draft cleanup
curl -X GET "http://localhost:3000/api/cron/booking-draft-cleanup" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Test Features:**
1. ✅ Create booking dengan passenger details
2. ✅ Save booking as draft
3. ✅ Edit booking (draft/pending_payment)
4. ✅ View passenger details di booking detail
5. ✅ Filter draft bookings di list
6. ✅ Resume draft booking

## 📝 Features Implemented

### ✅ Passenger Details
- Form untuk capture detail setiap passenger
- Auto-generate forms berdasarkan pax count
- Fields: name, DOB, dietary, health, emergency contact
- Storage di `booking_passengers` table

### ✅ Draft Booking
- "Save as Draft" button di booking wizard
- Draft status tracking (`draft_saved_at`)
- Resume draft functionality
- Auto-cleanup setelah 7 hari

### ✅ Booking Edit
- Edit customer info dan passenger details
- Hanya untuk booking dengan status 'draft' atau 'pending_payment'
- Update API dengan passenger support

### ✅ Reminder Notifications
- Auto-reminder H-7, H-3, H-1 hari sebelum trip
- Email template dengan booking details
- Tracking di `booking_reminders` table (prevent duplicates)
- Database function untuk calculate reminders

### ✅ UI Enhancements
- Passenger details display di booking detail
- Passenger count badge di bookings list
- Draft status indicator
- Draft filter di bookings list

## 🚀 Next Steps

1. **Deploy ke Production:**
   ```bash
   git add .
   git commit -m "feat(partner): complete booking & order management implementation"
   git push origin main
   ```

2. **Setup Vercel Cron Jobs:**
   - Vercel akan auto-detect dari `vercel.json`
   - Atau setup manual di Vercel Dashboard

3. **Monitor:**
   - Check Vercel Cron logs
   - Monitor email delivery (Resend dashboard)
   - Check database untuk reminder records

4. **Test Production:**
   - Create test booking dengan passenger details
   - Save as draft
   - Test reminder emails (create booking dengan trip_date 7/3/1 hari dari sekarang)

## 📚 Documentation

- **Migrations:** `docs/BOOKING_MIGRATIONS.md`
- **API Routes:**
  - `/api/partner/bookings` - Create booking with passengers
  - `/api/partner/bookings/[id]` - Get/Update booking with passengers
  - `/api/cron/booking-reminders` - Reminder cron job
  - `/api/cron/booking-draft-cleanup` - Draft cleanup cron job

## 🐛 Troubleshooting

### Reminders tidak terkirim
1. Check `get_bookings_needing_reminders()` function returns data
2. Check email service (Resend) configuration
3. Check partner emails valid
4. Check booking status = 'confirmed' or 'pending_payment'
5. Check trip_date = exactly 7, 3, or 1 days away

### Draft cleanup tidak jalan
1. Check cron job schedule di Vercel
2. Check `CRON_SECRET` di environment variables
3. Check API endpoint accessible
4. Check `draft_saved_at` column exists

### Passenger details tidak tersimpan
1. Check `booking_passengers` table exists
2. Check API response untuk errors
3. Check form validation
4. Check database constraints

## ✅ All Done!

Implementasi sudah 100% complete dan siap untuk production! 🎉

