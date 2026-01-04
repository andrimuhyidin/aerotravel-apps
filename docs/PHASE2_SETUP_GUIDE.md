# Phase 2: Setup Guide

## Overview

Guide ini menjelaskan langkah-langkah untuk setup Phase 2 Safety & Compliance Enhancements setelah implementasi selesai.

## Prerequisites

- ✅ Migrations sudah di-run
- ✅ Supabase project sudah setup
- ✅ Environment variables sudah dikonfigurasi
- ✅ Storage bucket `guide-photos` sudah dibuat (dari Phase 1)

## Step 1: Run Database Migrations

### Via Supabase Dashboard

1. Go to **Supabase Dashboard** > **Database** > **Migrations**
2. Upload atau paste migration files (dalam urutan):
   - `supabase/migrations/20250124000010_063-risk-assessment-weather-enhancement.sql`
   - `supabase/migrations/20250124000011_064-safety-briefing-enhancement.sql`
   - `supabase/migrations/20250124000012_065-sos-gps-streaming.sql`
   - `supabase/migrations/20250124000013_066-manifest-audit-log.sql`
   - `supabase/migrations/20250124000014_067-risk-override-audit.sql`
3. Click **Run migration** untuk setiap file

### Via Supabase CLI (if available)

```bash
supabase db push
```

## Step 2: Environment Variables

Pastikan environment variables berikut sudah dikonfigurasi di `.env.local`:

```env
# Weather API (untuk risk assessment)
OPENWEATHER_API_KEY=your_openweather_api_key

# WhatsApp (untuk SOS & notifications)
WHATSAPP_OPS_PHONE=6281234567890
WHATSAPP_SOS_GROUP_ID=your_group_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_APP_SECRET=your_app_secret

# Google Maps (untuk SOS live map)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Supabase (sudah ada)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (untuk internal API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # atau production URL
```

## Step 3: Verify Database Functions

### Check Risk Assessment Functions

```sql
-- Verify calculate_risk_score function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'calculate_risk_score';

-- Verify get_risk_level function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_risk_level';

-- Test risk score calculation
SELECT calculate_risk_score(2.0, 25.0, 'rainy', false, false);
-- Expected: Should return score > 70 (blocked)
```

### Check SOS Functions

```sql
-- Verify SOS streaming functions
SELECT proname 
FROM pg_proc 
WHERE proname IN ('start_sos_streaming', 'stop_sos_streaming', 'get_active_sos_alerts');

-- Test get active SOS alerts
SELECT * FROM get_active_sos_alerts();
```

### Check Briefing Functions

```sql
-- Verify briefing tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('safety_briefings', 'passenger_consents');
```

### Check Manifest Audit Functions

```sql
-- Verify manifest access logs table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'manifest_access_logs';

-- Verify get_manifest_access_summary function
SELECT proname 
FROM pg_proc 
WHERE proname = 'get_manifest_access_summary';
```

### Check Risk Trends Functions

```sql
-- Verify risk trends functions
SELECT proname 
FROM pg_proc 
WHERE proname IN ('get_guide_risk_trends', 'detect_unsafe_risk_patterns');

-- Test risk trends (replace with actual guide_id)
SELECT * FROM get_guide_risk_trends('guide-uuid-here', 4);
```

## Step 4: Test API Endpoints

### Test Weather API

```bash
# Test weather endpoint
curl "http://localhost:3000/api/guide/weather?lat=-5.1477&lng=105.1784"
```

Expected: JSON response dengan current weather dan forecast

### Test Risk Assessment

```bash
# Test risk assessment endpoint
curl -X POST "http://localhost:3000/api/guide/trips/{tripId}/risk-assessment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "wave_height": 2.5,
    "wind_speed": 30,
    "weather_condition": "stormy",
    "crew_ready": true,
    "equipment_complete": true,
    "use_weather_data": false
  }'
```

Expected: Response dengan risk_score > 70 (blocked)

### Test Briefing Generation

```bash
# Test briefing generation
curl -X POST "http://localhost:3000/api/guide/trips/{tripId}/briefing/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"language": "id"}'
```

Expected: JSON response dengan briefing points

### Test SOS Streaming

```bash
# Test SOS stream endpoint
curl -X POST "http://localhost:3000/api/guide/sos/stream" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "sos_alert_id": "{sosAlertId}",
    "latitude": -5.1477,
    "longitude": 105.1784,
    "accuracy_meters": 10
  }'
```

Expected: Success response dengan location recorded

### Test Manifest Audit

```bash
# Test manifest access (should log automatically)
curl "http://localhost:3000/api/guide/manifest?tripId={tripId}" \
  -H "Authorization: Bearer {token}"

# Check audit log
curl "http://localhost:3000/api/guide/manifest/audit?tripId={tripId}" \
  -H "Authorization: Bearer {token}"
```

Expected: Manifest data + audit log entry

## Step 5: Test UI Components

### Risk Assessment Dialog
1. Buka trip detail page
2. Klik "Start Trip"
3. Verify risk assessment dialog muncul
4. Test "Ambil Data Cuaca" button
5. Test risk score calculation
6. Test trip blocked jika score > 70

### Safety Briefing
1. Buka trip detail page
2. Scroll ke "Passenger Consent" section
3. Verify briefing auto-generated
4. Test language selector (ID/EN/ZH/JA)
5. Test briefing checklist accordion
6. Test consent collection dengan signature

### SOS Button
1. Buka guide app
2. Test long-press SOS button (3 detik)
3. Verify SOS alert terkirim
4. Verify GPS streaming start (check network tab)
5. Test admin live map (jika ada)

### Manifest Privacy
1. Buka manifest section
2. Verify privacy indicator muncul
3. Test copy-paste prevention (tidak bisa copy)
4. Test data masking (jika guide juga passenger)
5. Verify audit log entry dibuat

## Step 6: Admin Dashboard Setup

### SOS Live Map (Jika belum ada)

1. Create page: `app/[locale]/(dashboard)/console/sos/live-map/page.tsx`
2. Integrate dengan `/api/admin/sos/live-map`
3. Add Google Maps component
4. Display active SOS alerts dengan real-time updates

### Risk Trends Dashboard

1. Create widget untuk risk trends
2. Integrate dengan `/api/guide/risk-trends`
3. Display weekly trends chart
4. Show unsafe patterns alerts

### Manifest Audit Viewer

1. Create page untuk view manifest access logs
2. Integrate dengan `/api/admin/manifest/audit`
3. Display access summary dan logs

## Step 7: Monitor & Verify

### Check Database Tables

```sql
-- Check all Phase 2 tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'pre_trip_assessments',
  'safety_briefings',
  'sos_location_history',
  'manifest_access_logs',
  'risk_assessment_overrides'
);
```

### Check Indexes

```sql
-- Verify indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN (
  'pre_trip_assessments',
  'safety_briefings',
  'sos_location_history',
  'manifest_access_logs',
  'risk_assessment_overrides'
);
```

### Check RLS Policies

```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'pre_trip_assessments',
    'safety_briefings',
    'sos_location_history',
    'manifest_access_logs',
    'risk_assessment_overrides'
  );
```

## Troubleshooting

### Weather API Not Working

1. Verify `OPENWEATHER_API_KEY` di `.env.local`
2. Check API quota/limits
3. Test API key manually:
```bash
curl "https://api.openweathermap.org/data/2.5/weather?lat=-5.1477&lon=105.1784&appid={YOUR_API_KEY}"
```

### Risk Score Calculation Wrong

1. Verify migration `063-risk-assessment-weather-enhancement.sql` sudah di-run
2. Check function definition:
```sql
SELECT prosrc FROM pg_proc WHERE proname = 'calculate_risk_score';
```
3. Test dengan known values:
```sql
SELECT calculate_risk_score(2.0, 30.0, 'stormy', false, false);
-- Expected: (2.0*20) + (30.0*10) + 25 + 30 = 40 + 300 + 25 + 30 = 395 (capped at 200)
```

### SOS Streaming Not Working

1. Verify `sos_location_history` table exists
2. Check function `start_sos_streaming` exists
3. Verify GPS permissions di browser
4. Check network tab untuk streaming requests

### Briefing Not Generating

1. Verify Gemini API key configured
2. Check passenger data exists untuk trip
3. Verify `safety_briefings` table exists
4. Check AI usage logs

### Manifest Audit Not Logging

1. Verify `manifest_access_logs` table exists
2. Check RLS policies allow inserts
3. Verify API endpoint calls insert function
4. Check logs untuk errors

## Next Steps

Setelah setup selesai:

1. ✅ Run verification script (`scripts/verify-phase2-setup.sql`)
2. ✅ Test semua API endpoints
3. ✅ Test UI components end-to-end
4. ✅ Monitor untuk 24 jam pertama
5. ✅ Deploy ke production setelah testing selesai

## Support

Jika ada masalah, check:
- Supabase Dashboard > Logs
- Application logs (Sentry/PostHog)
- Browser console untuk client-side errors
- Network tab untuk API calls

