# 🚀 Instruksi Menjalankan Wallet Migration

## ✅ **Migration File Sudah Siap!**

File migration sudah dibuat di:
```
supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql
```

## 📋 **Cara Menjalankan (Pilih Salah Satu)**

### **Metode 1: Supabase Dashboard (RECOMMENDED)**

1. **Buka Supabase Dashboard:**
   - Login ke: https://supabase.com/dashboard
   - Pilih project: **mjzukilsgkdqmcusjdut**
   - Buka menu **SQL Editor** (di sidebar kiri)

2. **Copy Migration SQL:**
   ```bash
   cat supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql
   ```
   Atau buka file: `supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql`

3. **Paste di SQL Editor** dan klik tombol **Run** (atau tekan `Cmd+Enter` / `Ctrl+Enter`)

4. **Verifikasi:**
   Setelah migration berhasil, jalankan query ini untuk verifikasi:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN ('guide_savings_goals', 'guide_wallet_milestones')
   ORDER BY table_name;
   ```
   
   Seharusnya menampilkan 2 rows:
   - `guide_savings_goals`
   - `guide_wallet_milestones`

### **Metode 2: Install psql dan Jalankan**

```bash
# Install psql (macOS)
brew install postgresql

# Run migration
psql "$DATABASE_URL" -f supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql
```

### **Metode 3: Supabase CLI**

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

## ✅ **Setelah Migration Berhasil**

1. **Update TypeScript Types:**
   ```bash
   npm run update-types
   ```

2. **Verifikasi Fitur:**
   - Buka: http://localhost:3000/id/guide/wallet
   - Tab "Goals" seharusnya sudah bisa digunakan
   - Milestones akan muncul di tab "Overview" jika ada

---

## 🐛 **Troubleshooting**

### Error: "relation already exists"
**Solusi:** Ini normal jika migration sudah pernah dijalankan. Migration menggunakan `IF NOT EXISTS`, jadi aman untuk dijalankan ulang.

### Error: "permission denied"
**Solusi:** Pastikan menggunakan service role key atau user dengan permission yang cukup.

### Error: "function already exists"
**Solusi:** Migration menggunakan `CREATE OR REPLACE FUNCTION`, jadi akan replace function yang sudah ada. Ini aman.

---

## 📝 **Isi Migration**

Migration ini akan membuat:

1. **Table: `guide_savings_goals`**
   - Untuk savings goals dengan auto-save settings
   - Progress tracking

2. **Table: `guide_wallet_milestones`**
   - Untuk achieved milestones
   - Achievement metadata

3. **Function: `check_wallet_milestones()`**
   - Auto-check dan create milestones saat balance berubah

4. **RLS Policies**
   - Guide bisa lihat goals & milestones sendiri
   - Staff bisa lihat semua (untuk analytics)

5. **Indexes**
   - Untuk performance optimization

---

**Status:** ✅ Migration file ready, tinggal dijalankan!

