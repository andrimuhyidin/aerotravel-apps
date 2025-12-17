# Supabase pg_cron Helper Documentation

## Setup pg_cron Extension

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to service role
GRANT USAGE ON SCHEMA cron TO postgres;
```

## Contoh Cron Jobs

### 1. Auto-Delete KTP (H+30) - PRD 6.2.A
```sql
SELECT cron.schedule(
  'auto-delete-ktp',
  '0 0 * * *', -- Setiap hari jam 00:00
  $$
  DELETE FROM storage.objects
  WHERE bucket_id = 'ktp-documents'
  AND created_at < NOW() - INTERVAL '30 days';
  $$
);
```

### 2. Auto-Insurance Manifest Email - PRD 6.1.B
```sql
SELECT cron.schedule(
  'auto-insurance-manifest',
  '0 6 * * *', -- Setiap hari jam 06:00 WIB
  $$
  -- Call Supabase Edge Function untuk kirim email
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-insurance-manifest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := json_build_object('date', CURRENT_DATE)::text
  );
  $$
);
```

### 3. Reminder Tagihan
```sql
SELECT cron.schedule(
  'reminder-tagihan',
  '0 9 * * *', -- Setiap hari jam 09:00
  $$
  -- Call Edge Function untuk kirim reminder
  $$
);
```

## List Scheduled Jobs
```sql
SELECT * FROM cron.job;
```

## Unschedule Job
```sql
SELECT cron.unschedule('auto-delete-ktp');
```

## Notes
- Cron jobs berjalan di database server, bukan di Next.js
- Gunakan Supabase Edge Functions untuk logic kompleks
- Test cron jobs di development environment dulu

