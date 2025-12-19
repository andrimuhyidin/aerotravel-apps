# Rekomendasi Nama ID Card Guide

**Date**: 2025-01-20  
**Context**: ID Card untuk Tour Guide dengan QR Code verification

---

## 🎯 Top 5 Rekomendasi

### 1. **AeroTravel Guide License** ⭐ (RECOMMENDED)

**Format Card Number:** `ATGL-YYYYMMDD-XXXX`  
**Singkatan:** ATGL

**Pros:**
- ✅ Profesional dan kredibel (menggunakan kata "License")
- ✅ Branding jelas (AeroTravel)
- ✅ Mudah dipahami publik (License = lisensi resmi)
- ✅ Internasional (bisa digunakan untuk ekspansi)
- ✅ Pendek dan mudah diingat

**Cons:**
- ⚠️ Sedikit lebih panjang (tapi masih acceptable)

**Contoh Display:**
```
┌─────────────────────────────────┐
│  AEROTRAVEL GUIDE LICENSE        │
│  ATGL-20250120-1234             │
└─────────────────────────────────┘
```

**Rating:** ⭐⭐⭐⭐⭐ (5/5)

---

### 2. **Certified Tour Guide Card**

**Format Card Number:** `CTGC-YYYYMMDD-XXXX`  
**Singkatan:** CTGC

**Pros:**
- ✅ Sangat profesional (Certified = bersertifikat)
- ✅ Jelas menunjukkan kredibilitas
- ✅ Industry standard terminology
- ✅ Mudah dipahami

**Cons:**
- ⚠️ Tidak ada branding AeroTravel
- ⚠️ Sedikit generic

**Contoh Display:**
```
┌─────────────────────────────────┐
│  CERTIFIED TOUR GUIDE CARD      │
│  CTGC-20250120-1234             │
└─────────────────────────────────┘
```

**Rating:** ⭐⭐⭐⭐ (4/5)

---

### 3. **AeroTravel Guide Credential**

**Format Card Number:** `ATGC-YYYYMMDD-XXXX`  
**Singkatan:** ATGC

**Pros:**
- ✅ Profesional (Credential = kredensial resmi)
- ✅ Branding AeroTravel jelas
- ✅ Modern dan sophisticated
- ✅ Pendek

**Cons:**
- ⚠️ "Credential" mungkin kurang familiar untuk umum (tapi tetap profesional)

**Contoh Display:**
```
┌─────────────────────────────────┐
│  AEROTRAVEL GUIDE CREDENTIAL    │
│  ATGC-20250120-1234             │
└─────────────────────────────────┘
```

**Rating:** ⭐⭐⭐⭐ (4.5/5)

---

### 4. **Professional Guide ID**

**Format Card Number:** `PGID-YYYYMMDD-XXXX`  
**Singkatan:** PGID

**Pros:**
- ✅ Jelas (Professional Guide ID)
- ✅ Mudah dipahami
- ✅ Pendek

**Cons:**
- ⚠️ Tidak ada branding AeroTravel
- ⚠️ Generic (bisa dipakai siapa saja)

**Contoh Display:**
```
┌─────────────────────────────────┐
│  PROFESSIONAL GUIDE ID           │
│  PGID-20250120-1234             │
└─────────────────────────────────┘
```

**Rating:** ⭐⭐⭐ (3/5)

---

### 5. **AeroTravel Guide Badge**

**Format Card Number:** `ATGB-YYYYMMDD-XXXX`  
**Singkatan:** ATGB

**Pros:**
- ✅ Branding jelas
- ✅ Friendly dan approachable (Badge = lencana)
- ✅ Pendek

**Cons:**
- ⚠️ "Badge" terdengar kurang formal (tapi bisa jadi lebih friendly)
- ⚠️ Mungkin kurang kredibel untuk verifikasi resmi

**Contoh Display:**
```
┌─────────────────────────────────┐
│  AEROTRAVEL GUIDE BADGE         │
│  ATGB-20250120-1234             │
└─────────────────────────────────┘
```

**Rating:** ⭐⭐⭐ (3.5/5)

---

## 🏆 Rekomendasi Final

### **Pilihan Utama: AeroTravel Guide License (ATGL)**

**Alasan:**
1. **Profesional & Kredibel**: Kata "License" menunjukkan otoritas resmi
2. **Branding Kuat**: AeroTravel jelas terlihat
3. **Mudah Dipahami**: License = lisensi, familiar untuk publik
4. **Internasional**: Bisa digunakan untuk ekspansi ke luar negeri
5. **Format Pendek**: ATGL mudah diingat dan diucapkan

**Implementasi:**
- **Card Number Format:** `ATGL-YYYYMMDD-XXXX`
  - Contoh: `ATGL-20250120-0001`
- **Display Name:** "AeroTravel Guide License"
- **Short Name:** "Guide License" atau "ATGL"
- **Indonesian Translation:** "Lisensi Guide AeroTravel" (untuk UI)

---

## 📋 Alternatif (Jika ingin lebih formal/Indonesia)

### **Opsi Indonesia: Surat Izin Guide AeroTravel**

**Format Card Number:** `SIGA-YYYYMMDD-XXXX`  
**Singkatan:** SIGA

**Pros:**
- ✅ Formal dan resmi (Surat Izin = dokumen resmi)
- ✅ Branding AeroTravel
- ✅ Sesuai dengan konteks Indonesia

**Cons:**
- ⚠️ Hanya cocok untuk market Indonesia
- ⚠️ Kurang internasional

**Rating:** ⭐⭐⭐⭐ (4/5) - **Hanya jika fokus Indonesia saja**

---

## 🎨 Design Recommendations

### Card Header Text:
```
┌─────────────────────────────────┐
│  [Logo]  AEROTRAVEL             │
│          GUIDE LICENSE           │
│                                  │
│  Card No: ATGL-20250120-0001    │
└─────────────────────────────────┘
```

### Public Verification Page:
- **Title:** "AeroTravel Guide License Verification"
- **Subtitle:** "Verified Professional Tour Guide"
- **Badge:** "Licensed Guide" dengan checkmark

### QR Code Text (saat scan):
- **English:** "AeroTravel Guide License - Verified"
- **Indonesian:** "Lisensi Guide AeroTravel - Terverifikasi"

---

## 📝 Database Schema Update

```sql
-- Update card_number format
card_number TEXT NOT NULL UNIQUE, 
-- Format: ATGL-YYYYMMDD-XXXX (AeroTravel Guide License)

-- Example: ATGL-20250120-0001
```

---

## ✅ Decision Matrix

| Criteria | ATGL | CTGC | ATGC | PGID | ATGB |
|----------|------|------|------|------|------|
| Professional | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Branding | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Clarity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| International | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Length | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **TOTAL** | **24/25** | **21/25** | **22/25** | **19/25** | **20/25** |

---

## 🚀 Next Steps

1. ✅ **Approve nama:** AeroTravel Guide License (ATGL)
2. ✅ **Update plan document** dengan nama baru
3. ✅ **Update database schema** dengan format `ATGL-YYYYMMDD-XXXX`
4. ✅ **Design mockup** dengan branding AeroTravel
5. ✅ **Implementasi** sesuai plan

---

## 💡 Additional Notes

- **Short Name untuk UI:** Bisa pakai "Guide License" atau "ATGL" untuk space terbatas
- **Indonesian UI:** "Lisensi Guide" atau "Lisensi Guide AeroTravel"
- **Public Page:** "AeroTravel Guide License Verification"
- **Email Subject:** "Your AeroTravel Guide License" atau "ATGL Issued"

---

**Status:** ✅ Ready for Approval
