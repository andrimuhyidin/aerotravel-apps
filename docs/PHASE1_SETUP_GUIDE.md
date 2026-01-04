# Phase 1: Setup Guide

## Overview

Guide ini menjelaskan langkah-langkah untuk setup Phase 1 Critical Features setelah implementasi selesai.

## Prerequisites

- ✅ Migrations sudah di-run
- ✅ Supabase project sudah setup
- ✅ Environment variables sudah dikonfigurasi
- ✅ Storage bucket `guide-photos` sudah dibuat

## Step 1: Run Database Migrations

### Via Supabase Dashboard

1. Go to **Supabase Dashboard** > **Database** > **Migrations**
2. Upload atau paste migration files:
   - `supabase/migrations/20250124000004_057-absence-detection.sql`
   - `supabase/migrations/20250124000005_058-auto-delete-manifest.sql`
3. Click **Run migration**

### Via Supabase CLI (if available)

```bash
supabase db push
```

## Step 2: Enable pg_cron Extension

1. Go to **Supabase Dashboard** > **Database** > **Extensions**
2. Search for `pg_cron`
3. Click **Enable**

Atau run SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## Step 3: Setup Cron Jobs

### Option A: Via SQL Script (Recommended)

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Open file `scripts/setup-phase1-cron-jobs.sql`
3. Copy and paste seluruh isi file
4. Click **Run**

### Option B: Manual Setup

1. Go to **Supabase Dashboard** > **Database** > **Cron Jobs**
2. Create new cron job:

**Job 1: Absence Detection**
- Name: `detect-absence`
- Schedule: `*/15 * * * *` (every 15 minutes)
- SQL: `SELECT detect_guide_absence();`

**Job 2: Auto-Delete Manifest**
- Name: `auto-delete-manifest`
- Schedule: `0 2 * * *` (daily at 02:00 UTC = 09:00 WIB)
- SQL: `SELECT auto_delete_manifest_data();`

## Step 4: Verify Setup

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Open file `scripts/verify-phase1-setup.sql`
3. Copy and paste seluruh isi file
4. Click **Run**
5. Verify semua checks menunjukkan ✅

## Step 5: Environment Variables

Pastikan environment variables berikut sudah dikonfigurasi di `.env.local`:

```env
# WhatsApp Configuration (untuk absence notifications)
WHATSAPP_OPS_PHONE=6281234567890
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_APP_SECRET=your_app_secret

# Supabase (sudah ada)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 6: Storage Bucket Setup

### Create Bucket

1. Go to **Supabase Dashboard** > **Storage**
2. Click **New bucket**
3. Name: `guide-photos`
4. Public: `false` (private bucket)
5. File size limit: `10MB` (atau sesuai kebutuhan)
6. Allowed MIME types: `image/*`

### Setup RLS Policies

1. Go to **Supabase Dashboard** > **Storage** > **Policies**
2. Create policies untuk bucket `guide-photos`:

**Policy 1: Guides can upload their own photos**
```sql
CREATE POLICY "Guides can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'guide-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Guides can view their own photos**
```sql
CREATE POLICY "Guides can view own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'guide-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 3: Admins can view all photos**
```sql
CREATE POLICY "Admins can view all photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'guide-photos'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
  )
);
```

## Step 7: Test Functions

### Test Absence Detection

```sql
-- Create test trip dengan meeting_time 20 menit yang lalu
-- (Pastikan guide belum check-in)
SELECT detect_guide_absence();
```

Expected result: Returns list of absent guides (if any)

### Test Manifest Deletion

```sql
-- Create test trip dengan completed_at 73 jam yang lalu
SELECT auto_delete_manifest_data();
```

Expected result: Returns `{deleted_count: X, trips_processed: Y}`

## Step 8: Monitor Cron Jobs

### View Cron Job Logs

```sql
SELECT 
  jobid,
  jobname,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname IN ('detect-absence', 'auto-delete-manifest')
ORDER BY start_time DESC
LIMIT 20;
```

### View Recent Absence Detections

```sql
SELECT 
  id,
  trip_id,
  guide_id,
  guide_name,
  trip_code,
  minutes_late,
  detected_at
FROM guide_absence_logs
ORDER BY detected_at DESC
LIMIT 20;
```

### View Recent Manifest Deletions

```sql
SELECT 
  id,
  trip_id,
  table_name,
  deleted_at,
  retention_period_hours,
  metadata
FROM data_retention_logs
WHERE table_name = 'trip_manifest'
ORDER BY deleted_at DESC
LIMIT 20;
```

## Troubleshooting

### Cron Jobs Not Running

1. Check if pg_cron extension is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Check cron job status:
```sql
SELECT * FROM cron.job WHERE jobname IN ('detect-absence', 'auto-delete-manifest');
```

3. Check cron job logs for errors:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname IN ('detect-absence', 'auto-delete-manifest')
ORDER BY start_time DESC
LIMIT 10;
```

### Functions Not Found

1. Verify migrations were run:
```sql
SELECT * FROM supabase_migrations.schema_migrations 
WHERE name LIKE '%057%' OR name LIKE '%058%'
ORDER BY version DESC;
```

2. Check if functions exist:
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('detect_guide_absence', 'auto_delete_manifest_data');
```

### WhatsApp Notifications Not Sending

1. Verify environment variables:
```bash
echo $WHATSAPP_OPS_PHONE
echo $WHATSAPP_PHONE_NUMBER_ID
echo $WHATSAPP_ACCESS_TOKEN
```

2. Test WhatsApp API manually:
```bash
curl -X POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "6281234567890",
    "type": "text",
    "text": { "body": "Test message" }
  }'
```

3. Check notification queue:
```sql
SELECT * FROM guide_absence_notifications 
WHERE status = 'pending'
ORDER BY created_at DESC;
```

## Next Steps

Setelah setup selesai:

1. ✅ Run verification script
2. ✅ Test semua functions
3. ✅ Monitor cron jobs untuk 24 jam pertama
4. ✅ Test end-to-end flow:
   - Create trip dengan meeting time di masa lalu
   - Verify absence detection bekerja
   - Verify notification terkirim
   - Test photo upload (online & offline)
   - Test manifest deletion

## Support

Jika ada masalah, check:
- Supabase Dashboard > Logs
- Application logs (Sentry/PostHog)
- Cron job logs (via SQL query di atas)

