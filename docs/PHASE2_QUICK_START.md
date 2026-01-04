# Phase 2: Quick Start Guide

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Run Migrations (2 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Navigate to: **Database** → **Migrations**

2. **Run Migrations in Order**
   
   Click "New Migration" and paste each file content:

   **Migration 1:**
   ```bash
   # File: supabase/migrations/20250124000010_063-risk-assessment-weather-enhancement.sql
   ```
   - Copy entire file content
   - Paste in migration editor
   - Click "Run migration"
   - Wait for success ✅

   **Migration 2:**
   ```bash
   # File: supabase/migrations/20250124000011_064-safety-briefing-enhancement.sql
   ```
   - Repeat process

   **Migration 3:**
   ```bash
   # File: supabase/migrations/20250124000012_065-sos-gps-streaming.sql
   ```

   **Migration 4:**
   ```bash
   # File: supabase/migrations/20250124000013_066-manifest-audit-log.sql
   ```

   **Migration 5:**
   ```bash
   # File: supabase/migrations/20250124000014_067-risk-override-audit.sql
   ```

### Step 2: Verify Setup (1 minute)

1. **Go to Supabase SQL Editor**
2. **Run Verification Script:**
   ```bash
   # Copy entire content from: scripts/verify-phase2-setup.sql
   ```
3. **Check Output:**
   - Should see ✅ for all checks
   - If any ❌, check migration errors

### Step 3: Test API Keys (1 minute)

```bash
# Test OpenWeather API (if configured)
curl "https://api.openweathermap.org/data/2.5/weather?lat=-5.1477&lon=105.1784&appid=${OPENWEATHER_API_KEY}"

# Should return JSON with weather data
```

### Step 4: Build & Deploy (1 minute)

```bash
# Build check
npm run build

# If successful, deploy
# (Your deployment method here)
```

## ✅ Verification Checklist

After deployment, verify these endpoints work:

### 1. Weather API
```bash
GET /api/guide/weather?lat=-5.1477&lng=105.1784
```
Expected: JSON with current weather data

### 2. Risk Assessment
```bash
POST /api/guide/trips/{tripId}/risk-assessment
```
Expected: Risk score calculated with weather data

### 3. Briefing Generation
```bash
POST /api/guide/trips/{tripId}/briefing/generate
```
Expected: AI-generated briefing points

### 4. SOS Streaming
```bash
POST /api/guide/sos/stream
```
Expected: Location saved to database

### 5. Manifest Audit
```bash
GET /api/guide/manifest/audit?tripId={tripId}
```
Expected: Access logs returned

## 🎯 Quick Test

1. **Open Guide App**
   - Navigate to a trip
   - Click "Start Trip"
   - Open risk assessment dialog
   - Click "Ambil Data Cuaca"
   - ✅ Weather data should auto-fill

2. **Test Briefing**
   - Go to "Passenger Consent" section
   - Click "Generate Briefing"
   - ✅ Briefing should appear with sections

3. **Test SOS**
   - Long-press SOS button (3 seconds)
   - ✅ SOS alert created
   - ✅ GPS streaming starts

4. **Test Admin Live Map**
   - As admin, go to `/console/operations/sos`
   - ✅ Active SOS alerts displayed
   - ✅ Map shows guide location

## 📝 Environment Variables Checklist

Verify these are in `.env.local`:

- [x] `OPENWEATHER_API_KEY` (for weather integration)
- [x] `WHATSAPP_OPS_PHONE` (for SOS notifications)
- [x] `WHATSAPP_PHONE_NUMBER_ID` (for WhatsApp API)
- [x] `WHATSAPP_ACCESS_TOKEN` (for WhatsApp API)
- [x] `NEXT_PUBLIC_SUPABASE_URL` (already configured)
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (already configured)
- [x] `SUPABASE_SERVICE_ROLE_KEY` (already configured)

## 🐛 Common Issues

### Migration Fails
- Check if tables already exist
- Verify RLS policies don't conflict
- Check Supabase logs for details

### Weather API Not Working
- Verify `OPENWEATHER_API_KEY` is valid
- Check API quota not exceeded
- Test API key manually

### Briefing Not Generating
- Check Gemini API key configured
- Verify passenger data exists
- Check AI usage logs

### SOS Streaming Not Working
- Verify GPS permissions granted
- Check `sos_location_history` table exists
- Verify network connectivity

## 📞 Support

If issues persist:
1. Check Supabase Dashboard → Logs
2. Review application logs (Sentry/PostHog)
3. Verify all migrations ran successfully
4. Check environment variables are correct

---

**Status:** ✅ Ready for Deployment  
**Estimated Time:** 5 minutes  
**Last Updated:** 2025-01-24

