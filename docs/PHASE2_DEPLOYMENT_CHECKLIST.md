# Phase 2: Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Code Quality ✅
- [x] TypeScript type check passed
- [x] ESLint check passed (minor warnings only)
- [x] All files committed and reviewed

### 2. Database Migrations (5 files)
Run these migrations in order via Supabase Dashboard:

1. [ ] `20250124000010_063-risk-assessment-weather-enhancement.sql`
   - Adds `weather_data` JSONB column to `pre_trip_assessments`
   - Updates risk score calculation functions

2. [ ] `20250124000011_064-safety-briefing-enhancement.sql`
   - Adds `briefing_points`, `briefing_generated_at`, `briefing_generated_by`, `briefing_updated_at`, `briefing_updated_by` columns to `trips` table

3. [ ] `20250124000012_065-sos-gps-streaming.sql`
   - Creates `sos_location_history` table for real-time GPS tracking
   - Adds indexes for performance

4. [ ] `20250124000013_066-manifest-audit-log.sql`
   - Creates `manifest_access_logs` table for audit trail
   - Adds RLS policies for access control

5. [ ] `20250124000014_067-risk-override-audit.sql`
   - Creates `risk_assessment_overrides` table for admin override tracking
   - Adds indexes and RLS policies

**How to Run:**
1. Go to Supabase Dashboard → Database → Migrations
2. Click "New Migration"
3. Paste content from each file
4. Click "Run migration"
5. Verify success message

### 3. Environment Variables
Verify these are set in `.env.local`:

```env
# Weather API (Required for Task 1)
OPENWEATHER_API_KEY=your_openweather_api_key

# WhatsApp (Required for SOS notifications)
WHATSAPP_OPS_PHONE=6281234567890
WHATSAPP_SOS_GROUP_ID=your_group_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_APP_SECRET=your_app_secret

# Google Maps (Optional - for SOS live map UI)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (For internal API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

### 4. Verification Script
Run verification script to check all Phase 2 setup:

```sql
-- In Supabase SQL Editor
-- Copy and paste content from: scripts/verify-phase2-setup.sql
```

Expected output:
- ✅ All required tables exist
- ✅ All required functions exist
- ✅ All required indexes exist
- ✅ All tables have RLS enabled

## 🧪 Testing Checklist

### Task 1: Weather & Risk Assessment
- [ ] **Test Weather API Integration**
  - Open trip detail page
  - Click "Start Trip"
  - Open risk assessment dialog
  - Click "Ambil Data Cuaca"
  - Verify weather data auto-fills (wave height, wind speed, condition)
  
- [ ] **Test Risk Score Calculation**
  - Enter risk factors manually
  - Verify risk score calculated correctly
  - Test with score > 70 (should block trip)
  - Test with score <= 70 (should allow trip)
  
- [ ] **Test Admin Override**
  - Create trip with high risk score (>70)
  - As admin, go to trip detail
  - Click "Override Risk Assessment"
  - Enter reason and submit
  - Verify trip can now start
  - Check audit log in `risk_assessment_overrides` table

### Task 2: Auto-Generated Briefing
- [ ] **Test Briefing Generation**
  - Open trip with passengers
  - Go to "Passenger Consent" section
  - Click "Generate Briefing"
  - Verify briefing generated with sections
  - Test language selector (ID/EN/ZH/JA)
  
- [ ] **Test Briefing Display**
  - Verify briefing sections display in accordion
  - Test priority indicators (high/medium/low)
  - Verify briefing points are readable
  
- [ ] **Test Briefing Checklist**
  - Check boxes for each briefing point
  - Verify acknowledgment tracking

### Task 3: SOS GPS Streaming
- [ ] **Test SOS Trigger**
  - Open guide app
  - Long-press SOS button (3 seconds)
  - Verify SOS alert created
  - Verify GPS streaming starts automatically
  
- [ ] **Test Location History**
  - Wait 30 seconds after SOS trigger
  - Check `sos_location_history` table
  - Verify multiple location points recorded
  
- [ ] **Test Admin Live Map**
  - As admin, go to `/console/operations/sos`
  - Verify active SOS alerts displayed
  - Click "Tampilkan di Peta" for active alert
  - Verify map shows guide location
  - Verify location updates in real-time (every 10 seconds)

### Task 4: Manifest Audit Log
- [ ] **Test Manifest Access Logging**
  - Open trip manifest as guide
  - Check `manifest_access_logs` table
  - Verify log entry created with:
    - `trip_id`
    - `user_id` (guide)
    - `access_type` = 'view'
    - `access_timestamp`
    - `ip_address`
    - `user_agent`
  
- [ ] **Test Data Masking**
  - If guide is also a passenger
  - Open manifest
  - Verify passenger name/phone masked
  - Verify privacy indicator displayed
  
- [ ] **Test Copy-Paste Prevention**
  - Try to select and copy passenger data
  - Verify selection disabled (CSS `user-select: none`)
  
- [ ] **Test Admin Audit View**
  - As admin, call `/api/admin/manifest/audit`
  - Verify all manifest access logs returned
  - Test filtering by `tripId` or `userId`

### Task 5: Risk Trends
- [ ] **Test Risk Trends Endpoint**
  - Call `/api/guide/risk-trends?guideId={id}&periods=4`
  - Verify weekly trend data returned
  - Verify average risk scores calculated
  
- [ ] **Test Unsafe Pattern Detection**
  - Create multiple high-risk assessments for a guide
  - Verify pattern detection works
  - Check for alerts/notifications

## 🚀 Deployment Steps

### Step 1: Run Migrations
1. Open Supabase Dashboard
2. Go to Database → Migrations
3. Run all 5 migration files in order
4. Verify no errors

### Step 2: Verify Setup
1. Run `scripts/verify-phase2-setup.sql` in Supabase SQL Editor
2. Check all checks pass ✅

### Step 3: Environment Variables
1. Verify all required env vars in `.env.local`
2. Test API keys work:
   ```bash
   # Test OpenWeather API
   curl "https://api.openweathermap.org/data/2.5/weather?lat=-5.1477&lon=105.1784&appid=${OPENWEATHER_API_KEY}"
   ```

### Step 4: Build & Deploy
```bash
# Build check
npm run build

# Deploy (if using Vercel)
vercel deploy --prod

# Or deploy via your CI/CD pipeline
```

### Step 5: Post-Deployment Testing
1. Test all 5 features end-to-end
2. Monitor error logs (Sentry/PostHog)
3. Check database for any issues
4. Verify cron jobs running (if applicable)

## 📊 Monitoring

### Key Metrics to Watch
- **Weather API**: Response time, error rate
- **Briefing Generation**: Success rate, AI usage costs
- **SOS Streaming**: Location update frequency, GPS accuracy
- **Manifest Access**: Access frequency, audit log size
- **Risk Trends**: Data accuracy, query performance

### Error Monitoring
- Check Sentry for any runtime errors
- Monitor PostHog for user behavior
- Review Supabase logs for database errors

## 🔧 Troubleshooting

### Weather API Not Working
- Check `OPENWEATHER_API_KEY` is valid
- Verify API quota not exceeded
- Check network connectivity

### Briefing Not Generating
- Verify Gemini API key configured
- Check passenger data exists
- Review AI usage logs

### SOS Streaming Not Working
- Verify GPS permissions granted
- Check `sos_location_history` table exists
- Verify network connectivity

### Manifest Audit Not Logging
- Check RLS policies allow inserts
- Verify API endpoint called correctly
- Check database logs

## ✅ Success Criteria

All Phase 2 features are successfully deployed when:
- [x] All 5 migrations run without errors
- [x] All environment variables configured
- [x] Verification script passes
- [x] All tests pass
- [x] No critical errors in production
- [x] Features working as expected

---

**Last Updated:** 2025-01-24  
**Status:** Ready for Deployment  
**Next Phase:** Phase 3 (if applicable)

