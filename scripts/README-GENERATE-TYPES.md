# Cara Generate Supabase Types

## Opsi 1: Menggunakan Access Token (Recommended)

1. **Buka Supabase Dashboard:**
   - https://app.supabase.com/account/tokens

2. **Generate Personal Access Token:**
   - Klik "Generate new token"
   - Copy token yang dihasilkan

3. **Tambahkan ke .env.local:**
   ```bash
   SUPABASE_ACCESS_TOKEN=your_token_here
   ```

4. **Generate types:**
   ```bash
   npm run update-types
   ```

## Opsi 2: Login Manual (Sekali Saja)

1. **Login via browser:**
   ```bash
   npx supabase login
   ```
   - Akan membuka browser untuk login
   - Setelah login, token akan tersimpan otomatis

2. **Generate types:**
   ```bash
   npm run update-types
   ```

## Opsi 3: Menggunakan Project ID Langsung

Jika sudah login sebelumnya:
```bash
npx supabase gen types typescript --project-id mjzukilsgkdqmcusjdut > types/supabase.ts
```

## Setelah Types Ter-generate

1. **Verifikasi:**
   ```bash
   npm run type-check
   ```

2. **Hapus temporary type assertions** dari code (opsional, setelah types lengkap)

3. **Commit types:**
   ```bash
   git add types/supabase.ts
   git commit -m "chore: update Supabase types"
   ```
