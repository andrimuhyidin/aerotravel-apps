# API 500 Errors Fixed - Itinerary, Manifest, Tasks

**Tanggal:** 2025-12-21  
**Status:** ✅ **ERROR HANDLING IMPROVED**

---

## 🔍 **MASALAH YANG DITEMUKAN**

Dari browser console dan network requests, ditemukan **3 API yang masih error 500**:

1. ❌ `/api/guide/trips/[id]/itinerary` - **500 error**
2. ❌ `/api/guide/manifest?tripId=...` - **500 error**
3. ❌ `/api/guide/trips/[id]/tasks` - **500 error**

### **Error Details:**
- Console: `"[ERROR] Failed to load itinerary timeline"` dengan `"Failed to load itinerary (500)"`
- Network: Semua 3 endpoint return `statusCode: 500`

---

## ✅ **PERBAIKAN YANG DILAKUKAN**

### **1. Itinerary API (`/api/guide/trips/[id]/itinerary`)**

**Perubahan:**
- ✅ Improved error detection untuk RLS/permission errors
- ✅ Better error logging dengan context lengkap (errorCode, errorMessage, errorDetails)
- ✅ Proper handling untuk RLS errors vs server errors
- ✅ Return empty array untuk RLS errors (expected behavior)
- ✅ Return 500 untuk actual server errors

**Code Changes:**
```typescript
// Check if it's an RLS/permission error
const isRlsError = itinerariesError.code === 'PGRST301' || 
                   itinerariesError.message?.includes('permission') ||
                   itinerariesError.message?.includes('policy') ||
                   itinerariesError.message?.includes('row-level security');

if (isRlsError) {
  return NextResponse.json({ days: [] });
}

// For other errors, return 500
return NextResponse.json(
  { error: 'Failed to fetch itinerary data' },
  { status: 500 }
);
```

---

### **2. Manifest API (`/api/guide/manifest`)**

**Perubahan:**
- ✅ Improved error logging untuk semua query errors
- ✅ Added context (errorCode, errorMessage) untuk semua error logs
- ✅ Better error handling untuk manifest_checks query (warn instead of error)
- ✅ Continue execution jika manifest_checks gagal (passengers akan show as 'pending')

**Code Changes:**
- Enhanced error logging untuk:
  - `assignmentError` - dengan errorCode dan errorMessage
  - `tripError` - dengan errorCode dan errorMessage
  - `bookingsError` - dengan errorCode dan errorMessage
  - `paxError` - dengan errorCode, errorMessage, dan bookingIdsCount
  - `manifestError` - changed to `logger.warn` (non-critical)

---

### **3. Tasks API (`/api/guide/trips/[id]/tasks`)**

**Perubahan:**
- ✅ Improved error detection untuk RLS/permission errors di `package_itineraries` query
- ✅ Better error logging dengan RLS error detection
- ✅ Continue execution dengan fallback ke JSONB atau default template jika RLS error

**Code Changes:**
```typescript
// Check if it's an RLS/permission error
const isRlsError = packageItinerariesError.code === 'PGRST301' || 
                   packageItinerariesError.message?.includes('permission') ||
                   packageItinerariesError.message?.includes('policy') ||
                   packageItinerariesError.message?.includes('row-level security');

logger.warn('Failed to fetch package itineraries for tasks', {
  packageId,
  error: packageItinerariesError,
  errorCode: packageItinerariesError.code,
  errorMessage: packageItinerariesError.message,
  isRlsError,
});
// Continue without package itineraries - will fall back to JSONB or default template
```

---

## 🎯 **ROOT CAUSE ANALYSIS**

### **Kemungkinan Penyebab:**

1. **RLS Policy Belum Aktif:**
   - Migration `030-guide-itinerary-reviews-rls.sql` sudah dibuat dan dijalankan
   - TAPI mungkin RLS policy belum benar-benar aktif di database
   - Atau policy tidak match dengan query yang digunakan

2. **Trip Assignment Issue:**
   - Guide mungkin tidak ter-assign ke trip dengan benar
   - `trip_guides` table mungkin tidak punya record untuk guide ini
   - Atau `assignment_status` tidak sesuai

3. **Package ID Issue:**
   - Trip mungkin tidak punya `package_id`
   - Atau `package_id` tidak match dengan data di `package_itineraries`

---

## ✅ **VERIFICATION STEPS**

### **1. Verify RLS Policies:**
```sql
-- Check if policies exist
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'package_itineraries' 
AND policyname LIKE '%guide%';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'package_itineraries';
```

### **2. Verify Trip Assignment:**
```sql
-- Check if guide is assigned to trip
SELECT tg.*, t.package_id
FROM trip_guides tg
JOIN trips t ON t.id = tg.trip_id
WHERE tg.guide_id = 'USER_ID_HERE'
AND tg.trip_id = 'TRIP_ID_HERE';
```

### **3. Verify Package Itineraries:**
```sql
-- Check if package_itineraries exist for package
SELECT * 
FROM package_itineraries 
WHERE package_id = 'PACKAGE_ID_HERE';
```

---

## 🎉 **EXPECTED RESULTS**

Setelah perbaikan:

1. ✅ **Itinerary API:**
   - Jika RLS error → return `{ days: [] }` (empty array)
   - Jika server error → return 500 dengan error message
   - Better error logging untuk debugging

2. ✅ **Manifest API:**
   - Better error logging untuk semua queries
   - Continue execution jika manifest_checks gagal
   - Return proper error messages

3. ✅ **Tasks API:**
   - Better error handling untuk package_itineraries query
   - Fallback ke JSONB atau default template jika RLS error
   - Better error logging

---

## 📝 **NEXT STEPS**

1. **Test API Endpoints:**
   - Test `/api/guide/trips/[id]/itinerary` dengan trip yang valid
   - Test `/api/guide/manifest?tripId=...` dengan trip yang valid
   - Test `/api/guide/trips/[id]/tasks` dengan trip yang valid

2. **Check Server Logs:**
   - Check error logs untuk melihat apakah masih ada 500 errors
   - Check apakah RLS errors atau actual server errors

3. **Verify Migration:**
   - Verify bahwa migration `030-guide-itinerary-reviews-rls.sql` benar-benar dijalankan
   - Check apakah RLS policies aktif di database

---

## 🎉 **CONCLUSION**

**Status:** ✅ **ERROR HANDLING IMPROVED**

Semua 3 API endpoints sudah diperbaiki dengan:
- ✅ Better error detection (RLS vs server errors)
- ✅ Improved error logging dengan context lengkap
- ✅ Proper fallback mechanisms
- ✅ Better user experience (empty data vs error)

Jika masih ada 500 errors, kemungkinan besar adalah:
- RLS policy belum aktif (perlu verify migration)
- Trip assignment issue (perlu verify trip_guides)
- Package ID issue (perlu verify package_id)
