# 🚀 Booking & Order Management - Deployment Checklist

## Pre-Deployment

### ✅ 1. Code Review
- [ ] All code reviewed and approved
- [ ] No linter errors
- [ ] No TypeScript errors
- [ ] All tests passing

### ✅ 2. Database Migrations
- [ ] Migration 092: `draft_saved_at` column added
- [ ] Migration 093: `booking_reminders` table created
- [ ] Migration 094: `get_bookings_needing_reminders()` function created
- [ ] RLS policies verified
- [ ] Indexes created

**Verify:**
```sql
-- Run in Supabase SQL Editor
SELECT 
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'bookings' AND column_name = 'draft_saved_at') as has_draft_column,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'booking_reminders') as has_reminders_table,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' AND routine_name = 'get_bookings_needing_reminders') as has_reminder_function;
```

### ✅ 3. Environment Variables

**Local (.env.local):**
```bash
CRON_SECRET=your-secret-key-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Vercel (Production):**
- [ ] `CRON_SECRET` added (generate secure random string)
- [ ] `NEXT_PUBLIC_BASE_URL` = `https://app.aerotravel.id`
- [ ] All other required env vars present

**Generate CRON_SECRET:**
```bash
# Generate secure random secret
openssl rand -base64 32
```

### ✅ 4. Vercel Configuration
- [ ] `vercel.json` committed to repository
- [ ] Cron jobs configured:
  - Booking reminders: `0 2 * * *` (02:00 UTC = 09:00 WIB)
  - Draft cleanup: `0 3 * * *` (03:00 UTC = 10:00 WIB)

### ✅ 5. Dependencies
- [ ] All npm packages installed
- [ ] No security vulnerabilities
- [ ] TypeScript types updated (if needed)

## Deployment Steps

### Step 1: Deploy to Staging (if available)
```bash
# Push to staging branch
git checkout staging
git merge main
git push origin staging
```

### Step 2: Deploy to Production
```bash
# Push to main branch
git checkout main
git add .
git commit -m "feat(partner): deploy booking & order management"
git push origin main
```

### Step 3: Verify Deployment
1. Check Vercel deployment status
2. Verify cron jobs created:
   - Go to Vercel Dashboard > Project > Settings > Cron Jobs
   - Verify 2 cron jobs listed
3. Test endpoints:
   ```bash
   # Test booking reminders
   curl -X GET "https://app.aerotravel.id/api/cron/booking-reminders" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   
   # Test draft cleanup
   curl -X GET "https://app.aerotravel.id/api/cron/booking-draft-cleanup" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Post-Deployment

### ✅ 1. Smoke Tests
- [ ] Create test booking with passenger details
- [ ] Save booking as draft
- [ ] Edit booking
- [ ] View passenger details
- [ ] Filter draft bookings

### ✅ 2. Monitor Cron Jobs
- [ ] Check Vercel Cron logs (next day)
- [ ] Verify reminders sent (check email)
- [ ] Verify draft cleanup ran (check database)

### ✅ 3. Monitor Errors
- [ ] Check Sentry for errors
- [ ] Check Vercel logs
- [ ] Check database for failed operations

### ✅ 4. Performance
- [ ] Check API response times
- [ ] Check database query performance
- [ ] Monitor cron job execution time

## Rollback Plan

If issues occur:

1. **Revert Code:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Disable Cron Jobs:**
   - Remove from `vercel.json` or disable in Vercel Dashboard

3. **Database Rollback (if needed):**
   ```sql
   -- Only if absolutely necessary
   -- Contact DBA before running
   ```

## Monitoring

### Key Metrics to Monitor

1. **Booking Creation:**
   - Success rate
   - Average creation time
   - Passenger details save rate

2. **Draft Bookings:**
   - Draft creation rate
   - Draft completion rate
   - Draft cleanup count

3. **Reminders:**
   - Reminders sent per day
   - Email delivery rate
   - Failed reminder count

4. **Cron Jobs:**
   - Execution success rate
   - Execution time
   - Error rate

### Alerts to Setup

1. Cron job failures
2. High error rate in booking creation
3. Reminder email delivery failures
4. Database connection issues

## Success Criteria

Deployment successful if:
- ✅ All migrations applied
- ✅ Environment variables set
- ✅ Cron jobs running
- ✅ Endpoints accessible
- ✅ Smoke tests passing
- ✅ No critical errors in logs
- ✅ Performance acceptable

## Support

If issues occur:
1. Check logs (Vercel, Sentry)
2. Check database (Supabase Dashboard)
3. Check cron job status (Vercel Dashboard)
4. Review documentation:
   - `docs/BOOKING_MIGRATIONS.md`
   - `docs/BOOKING_SETUP_COMPLETE.md`
   - `docs/BOOKING_TESTING_GUIDE.md`

