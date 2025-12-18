# Wallet Enhancements Migration Guide

## 📋 Overview

Migration ini menambahkan fitur **Savings Goals** dan **Milestones** untuk Guide Wallet. Migration file sudah dibuat dan siap dijalankan.

## 🗂️ Migration File

**Location:** `supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql`

**Tables Created:**
- `guide_savings_goals` - Savings goals dengan auto-save settings
- `guide_wallet_milestones` - Achieved milestones

**Functions Created:**
- `check_wallet_milestones()` - Auto-check dan create milestones saat balance berubah

## 🚀 Cara Menjalankan Migration

### Option 1: Supabase Dashboard (Recommended)

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy seluruh isi file: `supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql`
5. Paste di SQL Editor
6. Klik **Run** atau tekan `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)
7. Verifikasi tidak ada error

### Option 2: Supabase CLI

```bash
# Pastikan sudah login
supabase login

# Link project (jika belum)
supabase link --project-ref <your-project-ref>

# Push migration
supabase db push

# Atau run specific migration
supabase db execute -f supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql
```

### Option 3: Script Helper

```bash
# Run helper script
./scripts/apply-wallet-migration.sh

# Script akan memberikan instruksi lengkap
```

## ✅ Verifikasi Migration

Setelah migration dijalankan, verifikasi dengan query berikut di SQL Editor:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('guide_savings_goals', 'guide_wallet_milestones')
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('guide_savings_goals', 'guide_wallet_milestones');

-- Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'check_wallet_milestones';
```

## 🔄 Update TypeScript Types

Setelah migration berhasil, update TypeScript types:

```bash
npm run update-types
```

Atau:

```bash
supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > types/supabase.ts
```

## 🐛 Troubleshooting

### Error: "table does not exist"

**Penyebab:** Migration belum dijalankan.

**Solusi:** Jalankan migration sesuai instruksi di atas.

### Error: "relation already exists"

**Penyebab:** Migration sudah pernah dijalankan sebelumnya.

**Solusi:** Migration menggunakan `IF NOT EXISTS`, jadi aman untuk dijalankan ulang. Tapi jika error tetap muncul, skip migration ini.

### Error: "permission denied"

**Penyebab:** User tidak memiliki permission untuk create table.

**Solusi:** Pastikan menggunakan service role key atau user dengan permission yang cukup.

### Error: "function already exists"

**Penyebab:** Function sudah ada dari migration sebelumnya.

**Solusi:** Migration menggunakan `CREATE OR REPLACE FUNCTION`, jadi akan replace function yang sudah ada. Ini aman.

## 📝 Rollback (Jika Diperlukan)

Jika perlu rollback migration:

```sql
-- Drop function
DROP FUNCTION IF EXISTS check_wallet_milestones(UUID, DECIMAL);

-- Drop tables (WARNING: akan menghapus semua data)
DROP TABLE IF EXISTS guide_wallet_milestones CASCADE;
DROP TABLE IF EXISTS guide_savings_goals CASCADE;
```

## 🎯 Setelah Migration

Setelah migration berhasil:

1. ✅ Fitur **Savings Goals** akan tersedia di tab "Goals"
2. ✅ Fitur **Milestones** akan muncul di tab "Overview"
3. ✅ Auto-check milestones akan berjalan saat balance berubah
4. ✅ Semua API endpoints untuk goals dan milestones akan berfungsi

## 📞 Support

Jika ada masalah dengan migration, hubungi:
- Development team
- Atau buat issue di repository

---

**Last Updated:** December 18, 2025

