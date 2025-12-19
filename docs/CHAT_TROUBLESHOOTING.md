# Chat Troubleshooting Guide

**Issue:** Chat Ops atau Chat Trip tidak berfungsi - pesan tidak terkirim

---

## 🔍 Diagnosis

### **Check 1: Assignment Status**
Pesan tidak terkirim jika guide belum di-assign ke trip.

**Cek di database:**
```sql
SELECT * FROM trip_guides 
WHERE trip_id = 'trip-id' 
AND guide_id = 'guide-id';
```

**Solusi:**
- Pastikan guide sudah di-assign ke trip via admin panel
- Atau assign via API: `POST /api/admin/trips/[id]/assign`

---

### **Check 2: Table Exists**
Pastikan table `trip_chat_messages` sudah ada.

**Cek:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'trip_chat_messages'
);
```

**Solusi:**
- Run migration: `20251218000000_019-guide-ops-communication.sql`
- Atau create table manually jika migration belum run

---

### **Check 3: RLS Policies**
RLS policy mungkin blocking access.

**Cek policies:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'trip_chat_messages';
```

**Solusi:**
- Pastikan policy `trip_chat_messages_guide_access` dan `trip_chat_messages_guide_insert` ada
- Check apakah policy condition sesuai dengan user role

---

### **Check 4: API Errors**
Cek browser console atau network tab untuk error details.

**Common Errors:**
- `403 Forbidden` → Guide tidak di-assign ke trip
- `500 Internal Server Error` → Database error atau table tidak ada
- `401 Unauthorized` → User tidak authenticated

---

## 🛠️ Fixes Applied

### **1. Better Error Handling**
- ✅ Added error display di UI dengan toast notifications
- ✅ Better error messages dari API
- ✅ Logging untuk debugging

### **2. Assignment Check**
- ✅ Check assignment dengan better error messages
- ✅ Log warning jika guide tidak assigned

### **3. Error Display**
- ✅ Toast notifications untuk user feedback
- ✅ Error state di UI untuk fetch errors
- ✅ Loading states untuk better UX

---

## 🧪 Testing

### **Test Chat Ops:**
1. Pastikan guide di-assign ke trip
2. Buka `/guide/trips/[trip-code]/chat`
3. Ketik pesan dan kirim
4. Check browser console untuk errors
5. Check network tab untuk API response

### **Test AI Chat:**
1. Pastikan guide di-assign ke trip
2. Buka trip detail page
3. Klik floating AI chat button
4. Tanya sesuatu
5. Check untuk error messages

---

## 📝 Common Issues & Solutions

### **Issue: "Anda tidak di-assign ke trip ini"**
**Solution:** Assign guide ke trip via admin panel atau API

### **Issue: "Fitur chat belum tersedia"**
**Solution:** Run migration `019-guide-ops-communication.sql`

### **Issue: "Failed to send message" (500 error)**
**Solution:** 
- Check database connection
- Check RLS policies
- Check server logs untuk detail error

### **Issue: Pesan terkirim tapi tidak muncul**
**Solution:**
- Check query key untuk cache invalidation
- Check refetch interval (should be 5 seconds)
- Check network tab untuk GET request

---

## 🔧 Debug Commands

### **Check Assignment:**
```sql
SELECT tg.*, u.full_name 
FROM trip_guides tg
JOIN users u ON u.id = tg.guide_id
WHERE tg.trip_id = 'trip-id';
```

### **Check Messages:**
```sql
SELECT * FROM trip_chat_messages 
WHERE trip_id = 'trip-id'
ORDER BY created_at DESC
LIMIT 10;
```

### **Check RLS:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'trip_chat_messages';
```

---

**Last Updated:** 2025-01-22
