# Troubleshooting: Menu "Kontrak Kerja" Tidak Muncul

## ✅ Status Database

Menu item **"Kontrak Kerja"** sudah berhasil ditambahkan ke database:
- **Section:** Akun
- **Href:** `/guide/contracts`
- **Label:** Kontrak Kerja
- **Icon:** FileText
- **Display Order:** 3
- **Status:** Active

## 🔍 Troubleshooting Steps

### 1. **Clear Browser Cache & Hard Refresh**

Menu items di-cache oleh React Query (5 menit). Lakukan:

**Chrome/Edge:**
- `Ctrl + Shift + R` (Windows/Linux)
- `Cmd + Shift + R` (Mac)

**Atau:**
1. Buka DevTools (F12)
2. Klik kanan pada tombol refresh
3. Pilih "Empty Cache and Hard Reload"

### 2. **Clear React Query Cache**

Jika masih tidak muncul, clear cache programmatically:

1. Buka browser console (F12)
2. Jalankan:
```javascript
// Clear all React Query cache
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 3. **Cek API Response**

Pastikan API mengembalikan menu item:

1. Buka DevTools → Network tab
2. Refresh halaman profile
3. Cari request ke `/api/guide/menu-items`
4. Cek response JSON, pastikan ada:
```json
{
  "menuItems": [
    {
      "section": "Akun",
      "items": [
        {
          "href": "/guide/contracts",
          "label": "Kontrak Kerja",
          ...
        }
      ]
    }
  ]
}
```

### 4. **Cek Console Errors**

Buka browser console (F12) dan cek apakah ada error:
- Red errors → Fix sesuai error message
- Yellow warnings → Usually safe to ignore

### 5. **Cek User Authentication**

Pastikan user sudah login dengan role `guide`:

1. Buka browser console
2. Jalankan:
```javascript
// Check current user
fetch('/api/auth/user').then(r => r.json()).then(console.log);
```

### 6. **Cek RLS Policy**

Menu items menggunakan RLS. Pastikan:
- User memiliki role `guide`
- User memiliki `branch_id` (jika menu item branch-specific)
- Menu item `branch_id` = NULL (global) atau sesuai dengan user branch

### 7. **Manual Test API**

Test API endpoint langsung:

```bash
# Dengan authentication token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/guide/menu-items
```

## 🔧 Quick Fix Script

Jika semua di atas tidak berhasil, jalankan script ini untuk memastikan menu item ada:

```bash
node scripts/add-contracts-menu-item.mjs
```

## 📋 Verification Checklist

- [ ] Menu item ada di database (`guide_menu_items` table)
- [ ] Menu item `is_active = true`
- [ ] Menu item `section = 'Akun'`
- [ ] Menu item `href = '/guide/contracts'`
- [ ] API `/api/guide/menu-items` mengembalikan menu item
- [ ] Tidak ada error di browser console
- [ ] React Query cache sudah di-clear
- [ ] User sudah login dengan role `guide`
- [ ] Route `/guide/contracts` bisa diakses

## 🚨 Common Issues

### Issue 1: Menu Item Tidak Muncul di UI
**Cause:** React Query cache  
**Solution:** Hard refresh (Ctrl+Shift+R)

### Issue 2: API Error 401 Unauthorized
**Cause:** User tidak authenticated  
**Solution:** Login ulang sebagai guide

### Issue 3: API Error 403 Forbidden
**Cause:** RLS policy blocking  
**Solution:** Pastikan user memiliki role `guide` dan `branch_id` sesuai

### Issue 4: Menu Item Muncul Tapi Error Saat Diklik
**Cause:** Route `/guide/contracts` tidak ada atau error  
**Solution:** Cek apakah file `app/[locale]/(mobile)/guide/contracts/page.tsx` ada

## ✅ Expected Result

Setelah semua step di atas, menu "Kontrak Kerja" seharusnya muncul di:
- **Location:** Profile → Section "Akun" → Order ke-3
- **After:** "Edit Profil" (order 1), "Rating & Ulasan" (order 2)
- **Before:** "Ubah Password" (order 4)

## 📞 Still Not Working?

Jika masih tidak muncul setelah semua troubleshooting:

1. **Cek Database Langsung:**
```sql
SELECT * FROM guide_menu_items 
WHERE href = '/guide/contracts' 
AND is_active = true;
```

2. **Cek API Response:**
```bash
# Test dengan authenticated user
curl -H "Cookie: YOUR_SESSION_COOKIE" \
  http://localhost:3000/api/guide/menu-items | jq
```

3. **Cek Browser Network Tab:**
   - Pastikan request ke `/api/guide/menu-items` sukses (200)
   - Pastikan response JSON mengandung menu item

4. **Report dengan:**
   - Screenshot browser console
   - Screenshot Network tab (request/response)
   - Error message (jika ada)
