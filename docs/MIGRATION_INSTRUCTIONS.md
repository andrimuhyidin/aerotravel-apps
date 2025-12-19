# Instruksi Migrasi - AI Features

## Migrations yang Perlu Dijalankan

### 1. Migration 046: RAG Vector Search
**File:** `supabase/migrations/20250122000004_046-rag-vector-search.sql`

**Isi:**
- Update `embedding` column dari `vector(1536)` ke `vector(768)` untuk Gemini embedding
- Create index untuk vector similarity search
- Create function `match_documents` untuk vector search

### 2. Migration 047: Trip Briefings
**File:** `supabase/migrations/20250122000005_047-trip-briefings.sql`

**Isi:**
- Add `briefing_points` JSONB column ke `trips` table
- Add tracking columns untuk briefing generation

## Cara Menjalankan

### Opsi 1: Via Supabase Dashboard (Recommended)

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Masuk ke **SQL Editor**
4. Copy-paste isi dari `supabase/migrations/20250122000004_046-rag-vector-search.sql`
5. Klik **Run**
6. Ulangi untuk `supabase/migrations/20250122000005_047-trip-briefings.sql`

### Opsi 2: Via Supabase CLI

```bash
# Jika sudah linked
npx supabase migration up --linked --include-all --yes

# Atau run specific migration
npx supabase db push
```

### Opsi 3: Via psql (jika punya direct database access)

```bash
psql $DATABASE_URL -f supabase/migrations/20250122000004_046-rag-vector-search.sql
psql $DATABASE_URL -f supabase/migrations/20250122000005_047-trip-briefings.sql
```

## Catatan Penting

⚠️ **Migration 046 akan mengubah dimension embedding dari 1536 ke 768**
- Existing embeddings akan dihapus (karena dimension berbeda)
- Documents perlu di-regenerate embedding setelah migration

## Setelah Migration

1. ✅ Pastikan `GEMINI_API_KEY` sudah ada di `.env.local`
2. ✅ Test create AI document via admin API untuk generate embedding baru
3. ✅ Test generate briefing di trip detail page
