# Analisis Journey Absensi/Check-in Guide

## 🎯 User Journey Lengkap (Expected)

### 1. **Pre-Check-in (Persiapan)**

- [ ] Guide melihat schedule trip hari ini
- [ ] Guide melihat meeting point & waktu keberangkatan
- [ ] Guide melihat jarak ke meeting point
- [ ] Guide menerima notifikasi reminder check-in
- [ ] Guide melihat status ID Card/License validity

### 2. **Check-in Process**

- [x] GPS Location tracking
- [x] Distance calculation ke meeting point
- [x] Geofence validation (radius check)
- [x] Time window validation (2 jam sebelum - 1 jam setelah)
- [x] Photo selfie capture
- [x] Mood/happiness rating (1-5)
- [x] Notes/description
- [ ] **ID Card verification** (verify guide sudah punya ID aktif)
- [ ] **License validity check** (SIM Kapal, First Aid, ALIN)
- [ ] **KTP/Identity photo capture** (untuk verifikasi identitas)
- [x] Late penalty calculation
- [x] Offline sync support

### 3. **During Trip**

- [ ] Live GPS tracking
- [ ] Panic/SOS button accessible
- [ ] Communication with dispatch
- [ ] Trip task checklist updates
- [ ] Passenger count confirmation

### 4. **Check-out Process**

- [x] GPS location tracking
- [x] Photo selfie capture
- [x] Notes/description
- [ ] **Trip summary display** (durasi, jarak tempuh)
- [ ] **Passenger count confirmation** (berapa PAX yang selesai)
- [ ] **Incident reporting prompt** (ada masalah selama trip?)
- [ ] **Equipment return checklist**
- [ ] **Fuel/logistics handover**
- [x] Offline sync support

### 5. **Post-Check-out**

- [x] Attendance history view
- [x] Stats display (today, week, streak)
- [ ] **Earnings calculation display** (base pay + incentives)
- [ ] **Rating/feedback request** (guide bisa rate trip/customer)
- [ ] **Next trip preview** (kalau ada trip selanjutnya)

---

## ❌ Yang Hilang/Kurang

### 🔴 **CRITICAL - Missing Features**

#### 1. **ID Card & License Verification (Pre-Check-in)**

**Masalah:** Guide bisa check-in tanpa verifikasi dokumen valid
**Harus ada:**

- Check apakah guide punya ID Card aktif
- Check validitas sertifikasi (SIM Kapal, First Aid, ALIN)
- Block check-in kalau ada dokumen expired
- Warning kalau dokumen akan expired dalam 7 hari

**Impact:** Risk compliance & legal issues

#### 2. **KTP/Identity Photo Capture**

**Masalah:** Hanya ada selfie, tidak ada KTP verification
**Harus ada:**

- Capture foto KTP saat check-in
- OCR/AI verification untuk match foto dengan KTP
- Store data retention sesuai setting (30 hari default)

**Impact:** Risk keamanan & fraud prevention

#### 3. **Trip Summary at Check-out**

**Masalah:** Check-out langsung selesai, tidak ada summary
**Harus ada:**

- Durasi trip (berapa lama)
- Jarak tempuh GPS (total km)
- Jumlah PAX (konfirmasi dengan yang check-in)
- Status trip (normal/ada insiden)

**Impact:** Data tidak lengkap untuk reporting

#### 4. **Equipment & Logistics Handover**

**Masalah:** Tidak ada tracking handover peralatan
**Harus ada:**

- Checklist peralatan (life jacket, radio, dll)
- Fuel/BBM confirmation
- Boat/asset return status

**Impact:** Asset management tidak terkontrol

---

### 🟡 **IMPORTANT - Missing UX Enhancements**

#### 5. **Notifikasi Reminder Check-in**

**Masalah:** Guide harus ingat sendiri untuk check-in
**Harus ada:**

- Push notification 30 menit sebelum departure
- Warning kalau sudah waktunya tapi belum check-in
- Late check-in alert

**Impact:** Guide sering telat/lupa check-in

#### 6. **Live Tracking During Trip**

**Masalah:** Setelah check-in, tidak ada tracking
**Harus ada:**

- Background GPS tracking selama trip
- Breadcrumb trail untuk dispatch monitoring
- Integration dengan live map untuk admin

**Impact:** Safety & monitoring issue

#### 7. **Earnings Preview**

**Masalah:** Guide tidak tahu berapa yang akan diterima
**Harus ada:**

- Base pay calculation
- Bonus/incentive breakdown
- Deduction (kalau ada penalty)
- Total earnings preview

**Impact:** Guide tidak termotivasi, tidak transparan

#### 8. **Next Trip Preview**

**Masalah:** Setelah check-out, guide tidak tahu trip selanjutnya
**Harus ada:**

- "Next Trip" card kalau ada trip di hari yang sama
- Quick navigation ke trip berikutnya
- Time left until next departure

**Impact:** UX flow terputus

---

### 🟢 **NICE TO HAVE - Future Enhancements**

#### 9. **Weather Alert Integration**

- Warning cuaca buruk saat akan check-in
- Suggest delay/reschedule

#### 10. **Passenger Manifest Preview**

- Guide bisa lihat list passenger yang akan join
- Notes khusus per passenger (special needs, dll)

#### 11. **Trip Rating & Feedback**

- Guide bisa rate customer behavior
- Guide bisa report issue/suggestion
- Mutual rating system

#### 12. **Photo Analysis AI**

- AI verify kalau photo selfie valid (tidak blur, wajah jelas)
- Sentiment analysis dari happiness rating
- Auto-flag suspicious photos

---

## 📊 Priority Matrix

| Feature                        | Priority     | Effort | Impact | Status     |
| ------------------------------ | ------------ | ------ | ------ | ---------- |
| ID Card Verification           | 🔴 Critical  | Medium | High   | ❌ Missing |
| License Validity Check         | 🔴 Critical  | Medium | High   | ❌ Missing |
| KTP Photo Capture              | 🔴 Critical  | High   | High   | ❌ Missing |
| Trip Summary (Check-out)       | 🔴 Critical  | Low    | High   | ❌ Missing |
| Equipment Checklist            | 🟡 Important | Medium | Medium | ❌ Missing |
| Check-in Reminder Notification | 🟡 Important | Medium | High   | ❌ Missing |
| Live GPS Tracking              | 🟡 Important | High   | High   | ❌ Missing |
| Earnings Preview               | 🟡 Important | Low    | Medium | ❌ Missing |
| Next Trip Preview              | 🟡 Important | Low    | Low    | ❌ Missing |
| Incident Report Prompt         | 🟡 Important | Low    | Medium | ❌ Missing |

---

## 🎯 Recommended Implementation Order

### Phase 1: Critical Fixes (1-2 weeks)

1. ✅ ID Card & License Verification (pre-check-in)
2. ✅ Trip Summary at Check-out
3. ✅ Incident Report Prompt

### Phase 2: UX Enhancements (2-3 weeks)

4. ✅ Check-in Reminder Notifications
5. ✅ Earnings Preview
6. ✅ Next Trip Preview
7. ✅ Equipment Checklist

### Phase 3: Advanced Features (3-4 weeks)

8. ✅ KTP Photo Capture & OCR
9. ✅ Live GPS Tracking During Trip
10. ✅ Photo Analysis AI

---

## 📝 Notes

- Current implementation: **60% complete**
- Critical features missing: **4** items
- UX enhancements needed: **5** items
- Security/compliance gaps: **2** items (ID/License verification, KTP capture)

**Recommendation:** Prioritize Phase 1 immediately untuk compliance & legal risk mitigation.
