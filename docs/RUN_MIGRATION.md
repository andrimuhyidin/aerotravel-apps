# 🚀 Cara Menjalankan Wallet Migration

## ✅ **METODE TERMUDAH: Supabase Dashboard**

1. **Buka Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new
   ```

2. **Copy Migration SQL:**
   ```bash
   cat supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql
   ```

3. **Paste di SQL Editor** dan klik **Run**

4. **Verifikasi:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN ('guide_savings_goals', 'guide_wallet_milestones');
   ```

## 🔧 **METODE ALTERNATIF**

### Option 1: Install psql dan jalankan

```bash
# Install psql (macOS)
brew install postgresql

# Run migration
psql "$DATABASE_URL" -f supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql
```

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref mjzukilsgkdqmcusjdut

# Push migration
supabase db push
```

---

**Status:** Migration file sudah siap di: `supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql`

