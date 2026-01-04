# 🧪 Booking & Order Management - Testing Guide

## Manual Testing Checklist

### ✅ 1. Booking Creation with Passenger Details

**Steps:**
1. Login sebagai partner
2. Navigate ke `/id/partner/bookings/new`
3. Fill booking form:
   - Pilih package
   - Pilih trip date
   - Set pax count (adult, child, infant)
4. Di Step 3 (Passenger Details):
   - Verify passenger forms auto-generated berdasarkan pax count
   - Fill passenger details untuk beberapa passengers:
     - Full name
     - Date of birth
     - Dietary requirements
     - Health conditions
     - Emergency contact
5. Submit booking
6. Verify:
   - ✅ Booking created dengan status 'pending_payment' atau 'paid'
   - ✅ Passenger details tersimpan (check di booking detail page)
   - ✅ Redirect ke booking detail page

**Expected Result:**
- Booking created successfully
- All passenger details saved
- Passenger count badge shows correct total

### ✅ 2. Save as Draft

**Steps:**
1. Navigate ke booking wizard
2. Fill partial booking form (tidak perlu complete)
3. Click "Save as Draft" button
4. Verify:
   - ✅ Toast message: "Booking berhasil disimpan sebagai draft!"
   - ✅ Redirect ke bookings list
   - ✅ Booking appears dengan status "Draft"

**Expected Result:**
- Draft saved successfully
- Draft appears in bookings list dengan filter "Draft"
- Can resume draft later

### ✅ 3. Resume Draft Booking

**Steps:**
1. Navigate ke bookings list
2. Filter by "Draft" status
3. Click on a draft booking
4. Verify:
   - ✅ "Resume" button visible
   - ✅ Click "Resume" redirects to booking wizard
   - ✅ Form pre-filled dengan draft data

**Expected Result:**
- Can resume draft booking
- Form data preserved

### ✅ 4. Edit Booking (Draft/Pending Payment)

**Steps:**
1. Navigate ke booking detail (status: draft atau pending_payment)
2. Click "Edit Booking" button
3. Update:
   - Customer name
   - Customer phone/email
   - Passenger details
4. Save changes
5. Verify:
   - ✅ Changes saved
   - ✅ Updated data visible di booking detail

**Expected Result:**
- Booking updated successfully
- Passenger details updated
- Cannot edit if status is 'confirmed' or 'completed'

### ✅ 5. Passenger Details Display

**Steps:**
1. Navigate ke booking detail (with passengers)
2. Scroll to "Passenger Details" section
3. Verify:
   - ✅ All passengers listed
   - ✅ Each passenger shows:
     - Full name
     - Passenger type (adult/child/infant)
     - Date of birth (if provided)
     - Dietary requirements (if provided)
     - Health conditions (if provided)
     - Emergency contact (if provided)

**Expected Result:**
- All passenger details displayed correctly
- Empty fields handled gracefully

### ✅ 6. Bookings List Enhancements

**Steps:**
1. Navigate ke `/id/partner/bookings`
2. Verify:
   - ✅ "Draft" option in status filter
   - ✅ Passenger count badge visible untuk each booking
   - ✅ Draft bookings show "Draft" badge
3. Filter by "Draft"
4. Verify:
   - ✅ Only draft bookings shown

**Expected Result:**
- Filter works correctly
- Passenger count accurate
- Draft indicator visible

### ✅ 7. Booking Reminder Cron Job

**Manual Test:**
```bash
# Test endpoint manually
curl -X GET "http://localhost:3000/api/cron/booking-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Steps:**
1. Create test booking dengan trip_date = 7 days from now
2. Set booking status = 'confirmed' or 'pending_payment'
3. Run cron endpoint manually
4. Verify:
   - ✅ Reminder email sent to partner
   - ✅ Record created in `booking_reminders` table
   - ✅ Reminder type = 'H-7'

**Expected Result:**
- Reminder sent successfully
- No duplicate reminders (test by running twice)

### ✅ 8. Draft Cleanup Cron Job

**Manual Test:**
```bash
# Test endpoint manually
curl -X GET "http://localhost:3000/api/cron/booking-draft-cleanup" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Steps:**
1. Create test draft booking dengan `draft_saved_at` = 8 days ago
2. Run cron endpoint manually
3. Verify:
   - ✅ Draft booking deleted
   - ✅ Drafts < 7 days NOT deleted

**Expected Result:**
- Only old drafts (> 7 days) deleted
- Recent drafts preserved

## Automated Testing

### E2E Tests

Run E2E tests:
```bash
npm run test:e2e tests/e2e/partner-booking.spec.ts
```

### API Tests

Test endpoints:
```bash
./scripts/test-booking-endpoints.sh
```

## Database Verification

### Check Migrations Applied

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

### Check Passenger Data

```sql
-- Check passenger details saved
SELECT 
  bp.*,
  b.booking_code,
  b.status
FROM booking_passengers bp
JOIN bookings b ON bp.booking_id = b.id
ORDER BY bp.created_at DESC
LIMIT 10;
```

### Check Reminders

```sql
-- Check reminder records
SELECT 
  br.*,
  b.booking_code,
  b.trip_date
FROM booking_reminders br
JOIN bookings b ON br.booking_id = b.id
ORDER BY br.sent_at DESC
LIMIT 10;
```

## Common Issues & Solutions

### Issue: Passenger details not saving
**Solution:**
- Check `booking_passengers` table exists
- Check API response for errors
- Check form validation
- Check database constraints

### Issue: Draft not appearing in list
**Solution:**
- Check booking status = 'draft'
- Check filter is set correctly
- Check RLS policies allow viewing

### Issue: Reminders not sending
**Solution:**
- Check `get_bookings_needing_reminders()` returns data
- Check email service (Resend) configured
- Check partner emails valid
- Check booking status = 'confirmed' or 'pending_payment'
- Check trip_date = exactly 7, 3, or 1 days away

### Issue: Cannot edit booking
**Solution:**
- Check booking status (only 'draft' or 'pending_payment' can be edited)
- Check user permissions
- Check API response for errors

## Performance Testing

### Load Test Passenger Forms

1. Create booking dengan 20+ passengers
2. Verify:
   - ✅ Form renders quickly
   - ✅ Auto-save works
   - ✅ Submit doesn't timeout

### Load Test Bookings List

1. Create 100+ bookings (mix of statuses)
2. Verify:
   - ✅ List loads quickly
   - ✅ Filter works efficiently
   - ✅ Pagination works

## Security Testing

### Test Unauthorized Access

1. Try to access cron endpoints without CRON_SECRET
2. Verify:
   - ✅ Returns 401 Unauthorized
   - ✅ No data exposed

### Test RLS Policies

1. Login as different partner
2. Try to view/edit other partner's bookings
3. Verify:
   - ✅ Cannot access other partner's bookings
   - ✅ Can only view own bookings

## Success Criteria

All tests should pass:
- ✅ Booking creation with passengers
- ✅ Draft save/resume
- ✅ Booking edit
- ✅ Passenger display
- ✅ List filters
- ✅ Reminder cron job
- ✅ Draft cleanup cron job
- ✅ Security (unauthorized access blocked)
- ✅ Performance (acceptable load times)

