# Connection Pooling Setup (Supavisor)

## Sesuai PRD 2.9.C - Database Scaling

### Problem
Saat trafik tinggi (Viral Campaign), ribuan koneksi simultan dari Serverless functions bisa menyebabkan bottleneck.

### Solution: Supavisor (Supabase Connection Pooler)

## Setup di Production

1. **Enable Connection Pooling di Supabase Dashboard**
   - Go to Project Settings > Database
   - Enable "Connection Pooling"
   - Mode: **Transaction** (recommended untuk Serverless)

2. **Update Connection String**

   **Before (Direct):**
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

   **After (Pooled):**
   ```
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

3. **Update Environment Variables**
   ```env
   # Direct connection (untuk migrations/admin)
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

   # Pooled connection (untuk aplikasi)
   DATABASE_POOLED_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

4. **Update Supabase Client untuk Production**
   ```typescript
   // lib/supabase/client.ts
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
   
   // Use pooled connection di production
   const connectionString = process.env.NODE_ENV === 'production' 
     ? process.env.DATABASE_POOLED_URL
     : undefined;
   
   export const supabase = createClient(supabaseUrl, supabaseKey, {
     db: connectionString ? { schema: 'public' } : undefined,
   });
   ```

## Benefits
- ✅ Handle ribuan koneksi simultan
- ✅ Reduce connection overhead
- ✅ Better performance untuk Serverless
- ✅ Cost efficient

## Notes
- Pooled connection **TIDAK BISA** untuk:
  - LISTEN/NOTIFY (Realtime)
  - Prepared statements
  - Transaction dengan multiple statements
- Untuk use case tersebut, tetap gunakan direct connection

