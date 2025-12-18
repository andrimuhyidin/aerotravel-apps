# Guide Feature Migration Checklist

Dokumen ini mendokumentasikan semua data yang masih **hardcoded** di fitur `/guide` dan perlu di-migrate ke database.

## 📋 Ringkasan

Fitur Guide App memiliki beberapa data yang masih hardcoded di kode dan perlu dipindahkan ke database untuk fleksibilitas dan maintainability yang lebih baik.

---

## 🔴 Data yang Perlu Di-Migrate

### 1. **Rating Hardcoded di Dashboard** ⭐
**Lokasi:** `app/[locale]/(mobile)/guide/guide-dashboard-client.tsx:415`

**Masalah:**
```tsx
<div className="text-2xl font-bold text-amber-500">⭐ 4.9</div>
```

**Status:** Rating hardcoded `4.9` tidak terhubung ke data real dari database.

**Solusi:**
- ✅ API `/api/guide/stats` sudah ada dan mengembalikan `averageRating`
- ❌ Dashboard belum menggunakan data dari API untuk rating
- **Action:** Ganti hardcoded rating dengan data dari `statsData?.averageRating`

**File yang perlu diubah:**
- `app/[locale]/(mobile)/guide/guide-dashboard-client.tsx` (line 415)

---

### 2. **Quick Actions Menu** 🎯
**Lokasi:** `app/[locale]/(mobile)/guide/guide-dashboard-client.tsx:67-145`

**Masalah:**
Array `quickActions` hardcoded dengan 11 item:
- Absensi
- Manifest
- SOS
- Insight
- Insiden
- Trip Saya
- Status
- Preferensi
- Dompet
- Broadcast
- Lokasi

**Status:** Semua quick actions hardcoded di kode.

**Solusi:**
- Buat tabel `guide_quick_actions` di database
- Kolom: `id`, `branch_id`, `href`, `label`, `icon_name`, `color`, `description`, `order`, `is_active`, `created_at`
- Admin bisa mengatur quick actions per branch
- Guide bisa customize quick actions mereka (opsional)

**Migration SQL yang dibutuhkan:**
```sql
CREATE TABLE guide_quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  href VARCHAR(200) NOT NULL,
  label VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50) NOT NULL, -- 'MapPin', 'ClipboardList', etc.
  color VARCHAR(50) NOT NULL, -- 'bg-emerald-500', etc.
  description VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default quick actions
INSERT INTO guide_quick_actions (branch_id, href, label, icon_name, color, description, display_order) VALUES
  (NULL, '/guide/attendance', 'Absensi', 'MapPin', 'bg-emerald-500', 'Check-in lokasi', 1),
  (NULL, '/guide/manifest', 'Manifest', 'ClipboardList', 'bg-blue-500', 'Cek tamu', 2),
  -- ... dst
```

**File yang perlu diubah:**
- `app/[locale]/(mobile)/guide/guide-dashboard-client.tsx` (lines 67-145)
- Buat API endpoint: `app/api/guide/quick-actions/route.ts`
- Update query keys: `lib/queries/query-keys.ts`

---

### 3. **Profile Menu Items** 📱
**Lokasi:** `app/[locale]/(mobile)/guide/profile/profile-client.tsx:54-79`

**Masalah:**
Array `menuItems` hardcoded dengan 3 section:
- **Akun:** Edit Profil, Rating & Ulasan
- **Operasional:** Insight Pribadi, Broadcast Ops, Laporan Insiden
- **Pengaturan:** Pengaturan, Dokumen, Kebijakan Privasi, Bantuan

**Status:** Semua menu items hardcoded di kode.

**Solusi:**
- Buat tabel `guide_menu_items` di database
- Kolom: `id`, `branch_id`, `section`, `href`, `label`, `icon_name`, `description`, `order`, `is_active`, `created_at`
- Admin bisa mengatur menu items per branch

**Migration SQL yang dibutuhkan:**
```sql
CREATE TABLE guide_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  section VARCHAR(50) NOT NULL, -- 'Akun', 'Operasional', 'Pengaturan'
  href VARCHAR(200) NOT NULL,
  label VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default menu items
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order) VALUES
  (NULL, 'Akun', '/guide/profile/edit', 'Edit Profil', 'User', 'Ubah informasi profil', 1),
  (NULL, 'Akun', '/guide/ratings', 'Rating & Ulasan', 'Star', 'Lihat penilaian customer', 2),
  -- ... dst
```

**File yang perlu diubah:**
- `app/[locale]/(mobile)/guide/profile/profile-client.tsx` (lines 54-79)
- Buat API endpoint: `app/api/guide/menu-items/route.ts`
- Update query keys: `lib/queries/query-keys.ts`

---

### 4. **Level Benefits Configuration** 💎
**Lokasi:** `lib/guide/level-benefits.ts`

**Status:** ✅ **TIDAK PERLU MIGRATE** (Konfigurasi sistem)

**Alasan:**
- Level benefits adalah konfigurasi sistem yang jarang berubah
- Hardcoded di kode sudah cukup untuk maintainability
- Tidak perlu fleksibilitas admin untuk mengubah benefits

**Rekomendasi:** Biarkan hardcoded, tapi bisa ditambahkan dokumentasi di database untuk referensi.

---

### 5. **Badges Configuration** 🏆
**Lokasi:** `lib/guide/gamification.ts:114-188`

**Status:** ✅ **TIDAK PERLU MIGRATE** (Konfigurasi sistem)

**Alasan:**
- Badges adalah konfigurasi sistem yang jarang berubah
- Logic calculation badges sudah di kode
- Tidak perlu fleksibilitas admin untuk mengubah badges

**Rekomendasi:** Biarkan hardcoded, tapi bisa ditambahkan dokumentasi di database untuk referensi.

---

### 6. **Sample Data** 📝
**Lokasi:** `lib/guide/sample-data.ts`

**Status:** ✅ **SUDAH TIDAK DIGUNAKAN**

**Alasan:**
- Sample data hanya untuk development/testing
- Tidak ditemukan penggunaan di production code
- Bisa dihapus atau dipertahankan untuk testing

**Rekomendasi:** Hapus atau pindahkan ke `tests/` folder jika masih diperlukan untuk testing.

---

## ✅ Data yang Sudah Terhubung ke Database

### 1. **Guide Stats** ✅
- Total trips
- Average rating
- Total ratings
- Complaints
- Penalties
- Current level
- Badges earned
- **API:** `/api/guide/stats`

### 2. **Guide Trips** ✅
- Trip list
- Trip status
- Trip details
- **API:** `/api/guide/trips`

### 3. **Guide Status** ✅
- Current status (standby/on_trip/not_available)
- **API:** `/api/guide/status`

### 4. **Leaderboard** ✅
- Monthly/yearly leaderboard
- Guide rankings
- **API:** `/api/guide/leaderboard`

### 5. **Insights** ✅
- Monthly summary
- Weekly breakdown
- Penalties history
- **API:** `/api/guide/insights/monthly`, `/api/guide/insights/penalties`

### 6. **Ratings** ✅
- Reviews list
- Rating summary
- **API:** `/api/guide/ratings`

### 7. **Wallet** ✅
- Balance
- Transactions
- **API:** `/api/guide/wallet`

---

## 🎯 Prioritas Migration

### **Priority 1: Critical (Harus segera)**
1. ✅ **Rating Hardcoded** - Ganti dengan data dari API (5 menit fix)

### **Priority 2: High (Penting untuk fleksibilitas)**
2. 🔄 **Quick Actions Menu** - Buat tabel dan API (2-3 jam)
3. 🔄 **Profile Menu Items** - Buat tabel dan API (2-3 jam)

### **Priority 3: Low (Nice to have)**
4. ⚪ **Level Benefits** - Dokumentasi di database (opsional)
5. ⚪ **Badges Configuration** - Dokumentasi di database (opsional)
6. ⚪ **Sample Data** - Hapus atau pindahkan (cleanup)

---

## 📝 Migration Steps

### Step 1: Fix Rating Hardcoded
```tsx
// Before
<div className="text-2xl font-bold text-amber-500">⭐ 4.9</div>

// After
<div className="text-2xl font-bold text-amber-500">
  ⭐ {statsData?.averageRating?.toFixed(1) ?? '0.0'}
</div>
```

### Step 2: Create Quick Actions Table
1. Buat migration SQL
2. Insert default quick actions
3. Buat API endpoint `/api/guide/quick-actions`
4. Update `guide-dashboard-client.tsx` untuk fetch dari API

### Step 3: Create Menu Items Table
1. Buat migration SQL
2. Insert default menu items
3. Buat API endpoint `/api/guide/menu-items`
4. Update `profile-client.tsx` untuk fetch dari API

---

## 🔍 Testing Checklist

Setelah migration, pastikan:
- [ ] Rating di dashboard menampilkan data real dari database
- [ ] Quick actions bisa diatur per branch (jika multi-tenant)
- [ ] Menu items bisa diatur per branch (jika multi-tenant)
- [ ] Default quick actions dan menu items ter-load dengan benar
- [ ] Tidak ada breaking changes di UI/UX
- [ ] Performance tidak terpengaruh (caching jika perlu)

---

## 📚 Related Files

### Files yang perlu diubah:
- `app/[locale]/(mobile)/guide/guide-dashboard-client.tsx`
- `app/[locale]/(mobile)/guide/profile/profile-client.tsx`
- `lib/queries/query-keys.ts`

### Files yang perlu dibuat:
- `app/api/guide/quick-actions/route.ts`
- `app/api/guide/menu-items/route.ts`
- `supabase/migrations/XXX-guide-quick-actions.sql`
- `supabase/migrations/XXX-guide-menu-items.sql`

---

**Last Updated:** 2025-01-XX
**Status:** In Progress

