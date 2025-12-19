# Guide Quick Actions - Debug Guide

## Masalah: Quick Actions Tidak Muncul

### Kemungkinan Penyebab

1. **Data belum di-seed**
   - Solution: Jalankan `npm run migrate:guide-improvements`
   - Verifikasi: Cek di Supabase Dashboard apakah data ada di `guide_quick_actions`

2. **RLS Policy Blocking**
   - RLS policy memerlukan user memiliki `branch_id` yang sesuai
   - Solution: Pastikan user guide memiliki `branch_id` di tabel `users`

3. **API Error**
   - Cek console browser untuk error API
   - Cek network tab untuk response dari `/api/guide/quick-actions`

4. **Filtering Terlalu Ketat**
   - Actions di-filter berdasarkan bottom nav
   - Contextual actions mungkin tidak match

### Debug Steps

1. **Cek Console Browser**
   - Buka Developer Tools → Console
   - Cari log: `[GuideDashboard] Quick Actions Debug`
   - Cari log: `[ContextualActions] Debug`

2. **Cek Network Tab**
   - Buka Developer Tools → Network
   - Filter: `/api/guide/quick-actions`
   - Cek response: Apakah `actions` array kosong?

3. **Cek Database**
   ```sql
   SELECT * FROM guide_quick_actions 
   WHERE is_active = true 
   ORDER BY display_order;
   ```

4. **Cek User Branch**
   ```sql
   SELECT id, email, branch_id, role 
   FROM users 
   WHERE role = 'guide';
   ```

### Quick Fix

Jika data belum ada, jalankan:
```bash
npm run migrate:guide-improvements
```

Jika masih tidak muncul, cek:
1. User memiliki `branch_id`?
2. RLS policy mengizinkan akses?
3. API mengembalikan data?
