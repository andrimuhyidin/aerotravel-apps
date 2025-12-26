# Migration: Voice Note URL Column

## Overview

Migration untuk menambahkan kolom `voice_note_url` ke tabel `incident_reports` untuk mendukung fitur Voice-to-Text Integration.

**Migration File:** `supabase/migrations/20250130000001_076-incident-reports-voice-note.sql`

## Prerequisites

1. **Database URL** harus dikonfigurasi di `.env.local`:
   ```bash
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
   ```
   
   Dapatkan dari: **Supabase Dashboard > Settings > Database > Connection string (URI)**

2. **psql** client harus terinstall:
   ```bash
   # macOS
   brew install postgresql
   
   # Linux
   apt-get install postgresql-client
   ```

## Running Migration

### Method 1: Using Helper Script (Recommended)

```bash
./scripts/run-voice-note-migration.sh
```

### Method 2: Manual via psql

```bash
# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Run migration
psql "$DATABASE_URL" -f supabase/migrations/20250130000001_076-incident-reports-voice-note.sql
```

### Method 3: Via Supabase Dashboard

1. Login ke Supabase Dashboard
2. Pilih project
3. Go to **SQL Editor** > **New Query**
4. Copy isi file: `supabase/migrations/20250130000001_076-incident-reports-voice-note.sql`
5. Paste dan klik **Run**

## What This Migration Does

1. **Adds column** `voice_note_url` (TEXT, nullable) ke tabel `incident_reports`
2. **Creates index** untuk optimasi query: `idx_incident_reports_voice_note`
3. **Adds comment** untuk dokumentasi kolom

## Verification

Setelah migration selesai, verifikasi dengan:

```sql
-- Check column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'incident_reports'
  AND column_name = 'voice_note_url';

-- Check index exists
SELECT 
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'incident_reports'
  AND indexname = 'idx_incident_reports_voice_note';
```

## Rollback (if needed)

Jika perlu rollback (hapus kolom):

```sql
-- Drop index first
DROP INDEX IF EXISTS idx_incident_reports_voice_note;

-- Drop column
ALTER TABLE incident_reports
  DROP COLUMN IF EXISTS voice_note_url;
```

## Notes

- Migration menggunakan `IF NOT EXISTS` sehingga aman dijalankan beberapa kali
- Kolom bersifat nullable (optional) karena tidak semua incident report memiliki voice note
- Index partial (hanya untuk rows yang tidak null) untuk optimasi storage

## Related Features

Migration ini mendukung fitur:
- **Voice-to-Text Integration** di Incident Report Form
- **Voice Note Storage** dari transcription API
- **Audio File URL** tracking untuk audit trail

