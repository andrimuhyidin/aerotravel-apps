# Booking Flow Migration - Manual Instructions

## Step 1: Run Database Migration

### Option A: Via Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Click "SQL Editor" in the left sidebar
4. Copy and paste the contents of `scripts/migrations/009-booking-flow-redesign.sql`
5. Click "Run"

### Option B: Via Local psql
If you have local database credentials:

```bash
psql "postgresql://[YOUR_CONNECTION_STRING]" -f scripts/migrations/009-booking-flow-redesign.sql
```

### Option C: Via Supabase CLI
```bash
supabase db push
```

---

## Step 2: Verify Migration

Run these queries to verify tables were created:

```sql
-- Check booking_drafts
SELECT COUNT(*) FROM booking_drafts;

-- Check booking_analytics
SELECT COUNT(*) FROM booking_analytics;

-- Check customer_booking_history
SELECT COUNT(*) FROM customer_booking_history;

-- Verify new columns in bookings
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('conversion_source', 'time_to_complete_seconds', 'draft_id');

-- Verify new columns in packages
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'packages' 
AND column_name IN ('booking_count_today', 'last_booked_at');
```

Expected results:
- `booking_drafts`: 0 rows (new table)
- `booking_analytics`: 0 rows (new table)
- `customer_booking_history`: 0 rows (new table)
- `bookings` new columns: 3 rows returned
- `packages` new columns: 2 rows returned

---

## Step 3: Test the Booking Flow

### 3.1 Start Development Server
```bash
npm run dev
```

### 3.2 Navigate to Booking Page
Open browser: `http://localhost:3000/id/partner/bookings/new`

### 3.3 Test Scenarios

#### Scenario 1: Complete Booking Flow
1. Select a package
2. Choose a date
3. Enter customer details
4. Review and confirm
5. Check success page appears with confetti

#### Scenario 2: Auto-Save & Draft Recovery
1. Start a booking (select package)
2. Close browser tab (don't complete)
3. Reopen `/partner/bookings/new`
4. Verify "Lanjutkan booking sebelumnya?" prompt appears
5. Click "Lanjutkan" → draft should restore

#### Scenario 3: Customer Search
1. Go to Step 2 (Customer Details)
2. Type a phone number in search
3. Verify dropdown appears (even if empty initially)
4. Type 3+ characters to trigger search

#### Scenario 4: Analytics Tracking
1. Complete a booking
2. Check database: `SELECT * FROM booking_analytics ORDER BY created_at DESC LIMIT 10;`
3. Verify events: `started`, `step_completed` (x3), `completed`

---

## Step 4: Monitor for Issues

### Check Browser Console
- Open DevTools (F12)
- Look for errors in Console tab
- Verify no 404s in Network tab

### Check Server Logs
- Watch terminal for API errors
- Look for database connection issues
- Verify auto-save is working (check logs every 5s)

---

## Step 5: Production Checklist

Before deploying to production:

- [ ] Migration ran successfully
- [ ] All tables created with correct schema
- [ ] RLS policies are active
- [ ] Indexes are created
- [ ] Triggers are working
- [ ] Frontend has zero console errors
- [ ] API endpoints return correct data
- [ ] Auto-save works (check localStorage)
- [ ] Draft recovery works
- [ ] Customer search works
- [ ] Analytics events are tracked
- [ ] Success page shows correctly
- [ ] WhatsApp share works
- [ ] Mobile responsive (test on real device)

---

## Troubleshooting

### Issue: "Table already exists"
**Solution:** Tables were already created. Skip migration or drop tables first:
```sql
DROP TABLE IF EXISTS booking_drafts CASCADE;
DROP TABLE IF EXISTS booking_analytics CASCADE;
DROP TABLE IF EXISTS customer_booking_history CASCADE;
```

### Issue: "Column already exists"
**Solution:** Columns were already added. Check with:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings';
```

### Issue: Auto-save not working
**Solution:** 
1. Check browser localStorage: DevTools → Application → Local Storage
2. Check API endpoint: `/api/partner/bookings/drafts` should return 200
3. Check console for errors

### Issue: Customer search returns nothing
**Solution:**
1. Verify `customer_booking_history` has data
2. Check API endpoint: `/api/partner/customers/search?q=test`
3. Initially empty is normal (no bookings yet)

### Issue: Package selector is empty
**Solution:**
1. The `PackageSelectorSheet` uses mock data initially
2. To connect real data, modify `loadPackages()` function in `package-selector-sheet.tsx`
3. Replace mock with: `const response = await fetch('/api/partner/packages');`

---

## Next Steps After Testing

Once everything works:

1. **Commit Changes:**
   ```bash
   git add .
   git commit -m "feat(bookings): implement 3-step booking flow with auto-save and analytics"
   git push origin main
   ```

2. **Deploy to Production:**
   - Run migration on production database
   - Deploy frontend via Vercel/your platform
   - Monitor error tracking (Sentry)

3. **Monitor Metrics:**
   - Track conversion rate
   - Analyze drop-off points
   - Gather user feedback

4. **Iterate:**
   - Connect real package data
   - Add more trust signals
   - Optimize based on metrics

---

## Support

If you encounter issues:
1. Check `docs/BOOKING_FLOW_PROGRESS.md` for detailed documentation
2. Review error logs in terminal and browser console
3. Verify all dependencies are installed: `npm install`
4. Clear `.next` cache: `rm -rf .next && npm run dev`

---

**Status:** Ready for testing! 🚀

