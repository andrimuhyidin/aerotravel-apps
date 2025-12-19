# Guide Contracts - UI/UX Audit & Journey Completeness

**Tanggal:** 2025-01-22  
**Status:** 🔍 **AUDIT LENGKAP**

## ✅ Yang Sudah Lengkap

### 1. **List Contracts Page** (`/guide/contracts`)
- ✅ Header dengan title dan description
- ✅ Filter dropdown untuk status (Semua, Pending, Active, Expired, dll)
- ✅ Card view untuk setiap kontrak dengan:
  - Nomor kontrak & tipe
  - Status badge dengan warna dan icon
  - Tanggal mulai & berakhir
  - Fee amount
  - Action buttons (Tandatangani, Download PDF, Lihat Detail)
- ✅ Empty state (jika belum ada kontrak)
- ✅ Loading state (saat fetch data)
- ✅ Error state (dengan retry button)
- ✅ Responsive design (mobile-first)

### 2. **Detail Contract Page** (`/guide/contracts/[id]`)
- ✅ Header dengan back button
- ✅ Contract information card:
  - Nomor kontrak
  - Tipe kontrak
  - Judul & deskripsi
  - Periode (start date - end date)
  - Fee amount & payment terms
  - Terms & conditions
  - Status badge
- ✅ Signature status section:
  - Guide signature status
  - Company signature status
  - Visual indicators (checkmark jika sudah signed)
- ✅ Action buttons:
  - Tandatangani Kontrak (jika pending_signature)
  - Tolak Kontrak (jika pending_signature)
  - Ajukan Resign (jika active)
  - Download PDF (jika sudah signed)
- ✅ Loading state
- ✅ Error state dengan retry

### 3. **Sign Contract Dialog**
- ✅ Dialog dengan form signature
- ✅ 3 metode signature:
  - Draw (canvas untuk gambar signature)
  - Upload (upload file gambar)
  - Type (ketik nama)
- ✅ Preview signature
- ✅ Validation
- ✅ Loading state saat submit
- ✅ Toast notification (success/error)

### 4. **Reject Contract Dialog**
- ✅ Dialog konfirmasi
- ✅ Textarea untuk alasan penolakan
- ✅ Validation
- ✅ Loading state
- ✅ Toast notification

### 5. **Resign Dialog**
- ✅ Dialog form untuk resign
- ✅ Textarea untuk alasan (max 500 chars)
- ✅ Date picker untuk tanggal efektif (min = today)
- ✅ Validation (alasan min 10 chars, tanggal wajib)
- ✅ Loading state
- ✅ Toast notification
- ✅ Pending resignation badge (jika ada pending)

### 6. **User Feedback**
- ✅ Toast notifications untuk semua actions
- ✅ Success messages
- ✅ Error messages dengan detail
- ✅ Loading indicators

### 7. **Navigation**
- ✅ Back button di detail page
- ✅ Link ke detail dari list
- ✅ Menu item di profile (sudah ditambahkan)

---

## ❌ Yang Masih Kurang

### 1. **View Sanctions (Sanksi) - BELUM ADA UI**
**Status:** ❌ **TIDAK ADA**

**Masalah:**
- API endpoint sudah ada: `GET /api/guide/contracts/[id]/sanctions`
- Tapi UI untuk menampilkan sanksi **BELUM DIIMPLEMENTASIKAN** di detail page

**Yang Perlu Ditambahkan:**
- Section "Sanksi" di detail contract page
- List sanksi yang diterima guide
- Card untuk setiap sanksi dengan:
  - Tipe sanksi (warning, suspension, fine, demotion, termination)
  - Severity badge (low, medium, high, critical)
  - Tanggal pelanggaran
  - Deskripsi sanksi
  - Status (active, resolved)
  - Fine amount (jika type = fine)
  - Suspension dates (jika type = suspension)
- Empty state jika belum ada sanksi

**Prioritas:** 🔴 **HIGH** - Guide perlu tahu sanksi yang diterima

### 2. **Withdraw Resignation - BELUM ADA UI**
**Status:** ❌ **TIDAK ADA**

**Masalah:**
- API endpoint sudah ada: `POST /api/guide/contracts/[id]/resign/withdraw`
- Tapi UI untuk withdraw resignation **BELUM DIIMPLEMENTASIKAN**

**Yang Perlu Ditambahkan:**
- Button "Tarik Kembali" di pending resignation badge
- Confirmation dialog
- Toast notification

**Prioritas:** 🟡 **MEDIUM** - Bisa ditambahkan nanti

### 3. **View Resignation History - BELUM ADA UI**
**Status:** ❌ **TIDAK ADA**

**Masalah:**
- API endpoint sudah ada: `GET /api/guide/contracts/[id]/resignations`
- Tapi UI untuk menampilkan history resignations **BELUM DIIMPLEMENTASIKAN**

**Yang Perlu Ditambahkan:**
- Section "Riwayat Pengajuan Resign" di detail page
- List semua resignation requests (pending, approved, rejected, withdrawn)
- Status badge untuk setiap request
- Notes/reason dari admin (jika approved/rejected)

**Prioritas:** 🟡 **MEDIUM** - Bisa ditambahkan nanti

### 4. **Better Visual Feedback**
**Status:** ⚠️ **BISA DITINGKATKAN**

**Yang Bisa Ditambahkan:**
- Skeleton loaders (bukan hanya spinner)
- Pull-to-refresh untuk list contracts
- Optimistic updates untuk mutations
- Better error messages dengan actionable steps
- Confirmation dialogs untuk actions penting (reject, resign)

**Prioritas:** 🟢 **LOW** - Nice to have

### 5. **Offline Support**
**Status:** ⚠️ **BELUM ADA**

**Yang Perlu Ditambahkan:**
- Offline indicator
- Queue mutations untuk offline
- Sync status
- Retry failed requests

**Prioritas:** 🟡 **MEDIUM** - Sesuai dengan offline-first architecture

### 6. **Accessibility Improvements**
**Status:** ⚠️ **BISA DITINGKATKAN**

**Yang Bisa Ditambahkan:**
- Better ARIA labels
- Keyboard navigation untuk dialogs
- Focus management
- Screen reader announcements

**Prioritas:** 🟢 **LOW** - Nice to have

---

## 📊 Journey Completeness Score

### Core Journey: **85% Complete**

| Journey Step | Status | Notes |
|-------------|--------|-------|
| 1. Access menu | ✅ | Menu item sudah ditambahkan |
| 2. View list contracts | ✅ | Lengkap dengan filter |
| 3. View contract detail | ✅ | Lengkap |
| 4. Sign contract | ✅ | Lengkap dengan 3 metode |
| 5. Reject contract | ✅ | Lengkap |
| 6. View sanctions | ❌ | **BELUM ADA UI** |
| 7. Submit resignation | ✅ | Lengkap |
| 8. Withdraw resignation | ❌ | **BELUM ADA UI** |
| 9. View resignation history | ❌ | **BELUM ADA UI** |
| 10. Download PDF | ✅ | Lengkap |

### Missing Critical Features:
1. **View Sanctions** - Guide tidak bisa lihat sanksi yang diterima
2. **Withdraw Resignation** - Guide tidak bisa tarik kembali pengajuan

---

## 🎯 Rekomendasi Prioritas

### **Priority 1: HIGH (Harus Ditambahkan)**
1. ✅ **View Sanctions UI** - Tambahkan section untuk menampilkan sanksi di detail page
   - Fetch dari API: `GET /api/guide/contracts/[id]/sanctions`
   - Display dengan card layout
   - Show all relevant information

### **Priority 2: MEDIUM (Sebaiknya Ditambahkan)**
2. ⚠️ **Withdraw Resignation UI** - Button untuk tarik kembali pengajuan
3. ⚠️ **View Resignation History** - Section untuk riwayat pengajuan

### **Priority 3: LOW (Nice to Have)**
4. 💡 **Better Visual Feedback** - Skeleton loaders, pull-to-refresh
5. 💡 **Offline Support** - Offline indicator, queue mutations
6. 💡 **Accessibility** - Better ARIA, keyboard nav

---

## 📝 Action Items

### Immediate (Harus Dilakukan Sekarang):
- [ ] **Tambahkan UI untuk View Sanctions** di detail contract page
  - File: `app/[locale]/(mobile)/guide/contracts/[id]/contract-detail-client.tsx`
  - Fetch dari: `GET /api/guide/contracts/[id]/sanctions`
  - Display dengan card layout

### Short Term (1-2 Sprint):
- [ ] Tambahkan UI untuk Withdraw Resignation
- [ ] Tambahkan UI untuk View Resignation History
- [ ] Improve error messages

### Long Term (Backlog):
- [ ] Add offline support
- [ ] Improve accessibility
- [ ] Add skeleton loaders
- [ ] Add pull-to-refresh

---

## ✅ Summary

**Status Overall:** 🟡 **85% Complete**

**Core Features:** ✅ Lengkap (sign, reject, resign, download PDF)

**Missing Critical:** ❌ View Sanctions (HIGH PRIORITY)

**Missing Nice-to-Have:** ⚠️ Withdraw Resignation, History, Offline Support

**Rekomendasi:** **Tambahkan UI untuk View Sanctions segera** karena guide perlu tahu sanksi yang diterima.
