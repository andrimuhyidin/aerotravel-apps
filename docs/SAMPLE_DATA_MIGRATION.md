# Sample Data Migration - Complete Guide App Data

**Tanggal:** 2025-12-21  
**Status:** ✅ **MIGRATION READY**

---

## 📋 **OVERVIEW**

Migration ini menambahkan sample data lengkap untuk Guide App:
- ✅ **Package Itinerary JSONB** - Update packages dengan itinerary data dalam format JSONB
- ✅ **Ops Broadcasts** - Insert sample broadcasts untuk testing
- ✅ **Reviews** - Update/insert additional reviews dengan `is_published = true`

---

## 🗂️ **MIGRATION FILE**

**Location:** `supabase/migrations/20251221000003_031-complete-sample-data.sql`

---

## 🚀 **CARA MENJALANKAN**

### **Option 1: Supabase Dashboard (Recommended)**

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy seluruh isi file: `supabase/migrations/20251221000003_031-complete-sample-data.sql`
5. Paste di SQL Editor
6. Klik **Run** atau tekan `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)
7. Verifikasi tidak ada error

### **Option 2: psql (Direct Connection)**

```bash
# Pastikan DATABASE_URL ada di .env.local
psql "$DATABASE_URL" -f supabase/migrations/20251221000003_031-complete-sample-data.sql
```

### **Option 3: Script Helper**

```bash
# Run helper script (akan suggest manual execution jika RPC tidak tersedia)
node scripts/execute-complete-sample-data.mjs
```

---

## 📊 **DATA YANG DITAMBAHKAN**

### **1. Package Itinerary JSONB**

**Format:**
```json
[
  {
    "day": 1,
    "dayNumber": 1,
    "title": "Berangkat & Snorkeling",
    "activities": [
      {"time": "07:00", "label": "Berkumpul di meeting point"},
      {"time": "08:00", "label": "Berangkat menuju dermaga"},
      ...
    ]
  },
  {
    "day": 2,
    "dayNumber": 2,
    "title": "Island Hopping & Pulang",
    "activities": [...]
  }
]
```

**Packages yang di-update:**
- ✅ Pahawang packages (2D1N itinerary)
- ✅ Kiluan packages (2D1N itinerary)
- ✅ Other packages (basic 1-day itinerary jika belum ada)

---

### **2. Ops Broadcasts**

**Sample broadcasts:**
1. **SOP Change** - "Penting: Update SOP Keamanan" (urgent, expires in 7 days)
2. **General Announcement** - "Info: Libur Nasional" (expires in 5 days)
3. **Weather Info** - "Peringatan Cuaca: Hujan Deras" (urgent, expires in 1 day)
4. **General Announcement** - "Reminder: Checklist Pre-Trip" (no expiry)
5. **Dock Info** - "Info Dermaga: Perubahan Lokasi" (expires in 3 days)

**Fields:**
- `broadcast_type`: sop_change, weather_info, dock_info, general_announcement
- `is_urgent`: true/false
- `target_guides`: NULL (all guides) or specific guide IDs
- `expires_at`: Optional expiry date
- `is_active`: true

---

### **3. Reviews**

**Additional reviews:**
- ✅ Reviews dengan `is_published = true` untuk bookings yang sudah ada
- ✅ Guide ratings (4-5 stars)
- ✅ Review text yang lengkap

---

## ✅ **VERIFICATION**

### **1. Check Package Itinerary:**

```sql
SELECT 
  id,
  name,
  itinerary
FROM packages
WHERE itinerary IS NOT NULL
LIMIT 5;
```

### **2. Check Ops Broadcasts:**

```sql
SELECT 
  id,
  broadcast_type,
  title,
  is_active,
  is_urgent,
  expires_at
FROM ops_broadcasts
WHERE is_active = true
ORDER BY created_at DESC;
```

### **3. Check Reviews:**

```sql
SELECT 
  id,
  booking_id,
  guide_rating,
  overall_rating,
  is_published,
  reviewer_name
FROM reviews
WHERE is_published = true
ORDER BY created_at DESC;
```

---

## 🎯 **EXPECTED RESULTS**

Setelah migration:

1. ✅ **Itinerary API** (`/api/guide/trips/[id]/itinerary`)
   - Akan return itinerary data dari JSONB
   - Tidak lagi error "table not found"

2. ✅ **Broadcasts API** (`/api/guide/broadcasts`)
   - Akan return active broadcasts
   - Creator names akan ter-fetch dengan benar

3. ✅ **Ratings API** (`/api/guide/ratings`)
   - Akan return reviews dengan `is_published = true`
   - Guide ratings akan terlihat

---

## 📝 **NOTES**

- Migration menggunakan `ON CONFLICT DO NOTHING` untuk avoid duplicates
- DO blocks perlu dijalankan sebagai satu statement (tidak bisa di-split)
- Jika RPC `exec_sql` tidak tersedia, gunakan Supabase Dashboard atau psql

---

## 🎉 **CONCLUSION**

**Status:** ✅ **MIGRATION READY**

Setelah migration dijalankan, semua sample data akan tersedia untuk testing Guide App features!
