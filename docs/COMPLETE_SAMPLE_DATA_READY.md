# Complete Sample Data - Ready to Execute

**Tanggal:** 2025-12-21  
**Status:** ✅ **MIGRATION FILE READY**

---

## ✅ **YANG SUDAH DIBUAT**

### **1. Migration File**
- ✅ `supabase/migrations/20251221000003_031-complete-sample-data.sql`
- ✅ Berisi sample data lengkap untuk:
  - Package Itinerary JSONB (Pahawang, Kiluan, dan packages lainnya)
  - Ops Broadcasts (5 sample broadcasts dengan berbagai jenis)
  - Reviews (update dengan `is_published = true`)

### **2. Execution Script**
- ✅ `scripts/execute-complete-sample-data.mjs`
- ⚠️  Note: DO blocks perlu dijalankan manual via Supabase Dashboard

### **3. Documentation**
- ✅ `docs/SAMPLE_DATA_MIGRATION.md` - Panduan lengkap

---

## 🚀 **CARA MENJALANKAN**

### **Recommended: Supabase Dashboard**

1. **Buka Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new
   ```

2. **Copy seluruh isi file:**
   ```bash
   cat supabase/migrations/20251221000003_031-complete-sample-data.sql
   ```

3. **Paste di SQL Editor** dan klik **Run**

4. **Verifikasi:**
   - Check packages memiliki `itinerary` JSONB
   - Check `ops_broadcasts` table memiliki data
   - Check `reviews` memiliki `is_published = true`

---

## 📊 **DATA YANG AKAN DITAMBAHKAN**

### **1. Package Itinerary JSONB**

**Pahawang Package (2D1N):**
```json
[
  {
    "day": 1,
    "title": "Berangkat & Snorkeling",
    "activities": [
      {"time": "07:00", "label": "Berkumpul di meeting point"},
      {"time": "08:00", "label": "Berangkat menuju Dermaga Ketapang"},
      {"time": "10:00", "label": "Menyeberang ke Pulau Pahawang"},
      {"time": "11:00", "label": "Check-in homestay/tenda"},
      {"time": "12:00", "label": "Makan siang"},
      {"time": "14:00", "label": "Snorkeling spot 1 & 2"},
      {"time": "17:00", "label": "Free time & sunset"},
      {"time": "19:00", "label": "Makan malam & api unggun"}
    ]
  },
  {
    "day": 2,
    "title": "Island Hopping & Pulang",
    "activities": [
      {"time": "07:00", "label": "Sarapan"},
      {"time": "08:00", "label": "Island hopping ke Pulau Kelagian"},
      {"time": "10:00", "label": "Snorkeling spot 3"},
      {"time": "12:00", "label": "Makan siang di pulau"},
      {"time": "14:00", "label": "Kembali ke dermaga"},
      {"time": "16:00", "label": "Perjalanan pulang ke Bandar Lampung"},
      {"time": "18:00", "label": "Sampai di meeting point"}
    ]
  }
]
```

**Kiluan Package (2D1N):**
- Day 1: Keberangkatan & Dolphin Watching (10 activities)
- Day 2: Pulang (4 activities)

**Other Packages:**
- Basic 1-day itinerary jika belum ada data

---

### **2. Ops Broadcasts (5 samples)**

1. **SOP Change** - "Penting: Update SOP Keamanan"
   - Type: `sop_change`
   - Urgent: ✅ Yes
   - Expires: 7 days

2. **General Announcement** - "Info: Libur Nasional"
   - Type: `general_announcement`
   - Urgent: ❌ No
   - Expires: 5 days

3. **Weather Info** - "Peringatan Cuaca: Hujan Deras"
   - Type: `weather_info`
   - Urgent: ✅ Yes
   - Expires: 1 day

4. **General Announcement** - "Reminder: Checklist Pre-Trip"
   - Type: `general_announcement`
   - Urgent: ❌ No
   - No expiry

5. **Dock Info** - "Info Dermaga: Perubahan Lokasi"
   - Type: `dock_info`
   - Urgent: ❌ No
   - Expires: 3 days

---

### **3. Reviews**

- ✅ Update existing reviews dengan `is_published = true`
- ✅ Guide ratings: 4-5 stars
- ✅ Review text lengkap dan realistis

---

## ✅ **VERIFICATION QUERIES**

### **Check Package Itinerary:**
```sql
SELECT 
  id,
  name,
  slug,
  jsonb_array_length(itinerary) as days_count
FROM packages
WHERE itinerary IS NOT NULL
LIMIT 5;
```

### **Check Ops Broadcasts:**
```sql
SELECT 
  id,
  broadcast_type,
  title,
  is_active,
  is_urgent,
  expires_at,
  created_at
FROM ops_broadcasts
WHERE is_active = true
ORDER BY created_at DESC;
```

### **Check Reviews:**
```sql
SELECT 
  id,
  booking_id,
  guide_rating,
  overall_rating,
  is_published,
  reviewer_name,
  LEFT(review_text, 50) as review_preview
FROM reviews
WHERE is_published = true
ORDER BY created_at DESC;
```

---

## 🎯 **EXPECTED RESULTS**

Setelah migration dijalankan:

1. ✅ **Itinerary API** akan return data dari JSONB
2. ✅ **Broadcasts API** akan return 5 active broadcasts
3. ✅ **Ratings API** akan return reviews dengan ratings

---

## 📝 **NEXT STEPS**

1. **Jalankan migration** via Supabase Dashboard
2. **Verify data** dengan queries di atas
3. **Test API endpoints** di browser
4. **Check Guide App** - semua fitur seharusnya sudah ada datanya

---

## 🎉 **CONCLUSION**

**Status:** ✅ **READY TO EXECUTE**

Migration file sudah siap. Jalankan via Supabase Dashboard untuk menambahkan sample data lengkap!
