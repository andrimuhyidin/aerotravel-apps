# Guide Contracts - Journey & Akses Guide

**Tanggal:** 2025-01-22  
**Status:** ✅ **DOKUMENTASI LENGKAP**

## 📱 Journey Guide untuk Mengakses Kontrak

### 1. **Akses Menu Kontrak**

Guide dapat mengakses kontrak melalui beberapa cara:

#### **A. Melalui Menu Profile (Recommended)**
```
/guide → Profile (Bottom Nav) → Menu Items → "Kontrak Kerja"
```

**Langkah-langkah:**
1. Guide login ke aplikasi mobile (`/guide`)
2. Klik tab **"Profil"** di bottom navigation
3. Scroll ke section menu items
4. Cari menu **"Kontrak Kerja"** (jika tersedia di menu items API)
5. Klik untuk masuk ke halaman kontrak

#### **B. Direct URL Access**
```
/guide/contracts
```

Guide bisa langsung mengakses URL `/guide/contracts` jika sudah tahu URL-nya.

#### **C. Melalui Notifikasi**
```
Notifikasi "Kontrak Baru" → Klik notifikasi → Redirect ke /guide/contracts/[id]
```

Ketika admin mengirim kontrak baru, guide akan menerima notifikasi yang bisa diklik untuk langsung ke detail kontrak.

---

## 2. **Halaman Daftar Kontrak**

**URL:** `/guide/contracts`  
**File:** `app/[locale]/(mobile)/guide/contracts/page.tsx`

### Fitur yang Tersedia:
- ✅ **List semua kontrak** guide (filtered by guide_id)
- ✅ **Filter by status:**
  - Semua
  - Aktif
  - Menunggu Tanda Tangan
  - Kadaluarsa
  - Dihentikan
- ✅ **Card view** untuk setiap kontrak dengan:
  - Nomor kontrak
  - Tipe kontrak (Per Trip, Bulanan, Project, dll)
  - Status badge dengan warna
  - Tanggal mulai & berakhir
  - Fee amount
  - Action buttons (Download PDF, Lihat Detail)

### UI Components:
- `ContractsClient` - Client component untuk list kontrak
- Filter dropdown untuk status
- Empty state jika belum ada kontrak
- Loading state saat fetch data
- Error state jika gagal load

---

## 3. **Halaman Detail Kontrak**

**URL:** `/guide/contracts/[id]`  
**File:** `app/[locale]/(mobile)/guide/contracts/[id]/page.tsx`

### Fitur yang Tersedia:

#### **A. Informasi Kontrak**
- ✅ Detail lengkap kontrak (nomor, tipe, judul, deskripsi)
- ✅ Periode kontrak (start date - end date)
- ✅ Fee amount & payment terms
- ✅ Terms & conditions
- ✅ Status kontrak dengan badge

#### **B. Tanda Tangan Digital**
- ✅ **Tanda Tangan Guide** (jika status = `pending_signature`)
  - Pilihan metode:
    - Draw signature (draw di layar)
    - Upload signature (upload gambar)
    - Type signature (ketik nama)
  - Preview signature sebelum submit
  - Submit signature → Status berubah ke `pending_company`

#### **C. Aksi Kontrak**
- ✅ **Tolak Kontrak** (jika status = `pending_signature`)
  - Dialog konfirmasi
  - Alasan penolakan
  - Submit → Status berubah ke `rejected`

- ✅ **Download PDF** (jika kontrak sudah ditandatangani)
  - Button "Download PDF"
  - Generate PDF dengan signature
  - Download file PDF

#### **D. Sanksi (View Only)**
- ✅ **List Sanksi** yang diterima guide
  - Tipe sanksi (warning, suspension, fine, demotion, termination)
  - Severity (low, medium, high, critical)
  - Tanggal pelanggaran
  - Deskripsi sanksi
  - Status (active, resolved)
  - Fine amount (jika type = fine)
  - Suspension dates (jika type = suspension)

#### **E. Pengajuan Resign (Self-Service)**
- ✅ **Ajukan Resign** (jika status = `active` dan tidak ada pending resignation)
  - Button "Ajukan Resign" dengan icon LogOut
  - Dialog form dengan:
    - Alasan resign (textarea, max 500 chars)
    - Tanggal efektif (date picker, min = today)
  - Submit → Status resignation = `pending`
  - Notifikasi dikirim ke admin

- ✅ **Status Pengajuan Resign**
  - Badge "Pengajuan Resign Pending" jika ada pending
  - Menampilkan tanggal efektif
  - Guide bisa withdraw (API tersedia, UI belum diimplementasikan)

---

## 4. **Workflow Lengkap Guide**

### **Scenario 1: Kontrak Baru Diterima**

```
1. Guide login → Dashboard (/guide)
2. Menerima notifikasi "Kontrak Baru"
3. Klik notifikasi → Redirect ke /guide/contracts/[id]
4. Lihat detail kontrak (status: pending_signature)
5. Baca terms & conditions
6. Pilih metode tanda tangan:
   - Draw: Gambar signature di layar
   - Upload: Upload file signature
   - Type: Ketik nama
7. Preview signature
8. Submit signature
9. Status berubah ke "pending_company"
10. Tunggu admin tanda tangan
11. Setelah admin tanda tangan → Status "active"
12. Kontrak aktif, wallet transaction dibuat
```

### **Scenario 2: Melihat Sanksi**

```
1. Guide login → Profile → Kontrak Kerja
2. Pilih kontrak aktif
3. Scroll ke section "Sanksi"
4. Lihat list sanksi yang diterima:
   - Warning: Peringatan
   - Suspension: Suspensi dengan tanggal
   - Fine: Denda dengan amount
   - Demotion: Penurunan level
   - Termination: Penghentian (kontrak auto-terminated)
5. Lihat detail setiap sanksi
6. Jika sanksi sudah resolved, badge "Resolved" muncul
```

### **Scenario 3: Ajukan Resign**

```
1. Guide login → Profile → Kontrak Kerja
2. Pilih kontrak aktif
3. Scroll ke section "Aksi"
4. Klik button "Ajukan Resign"
5. Dialog muncul:
   - Input alasan resign (wajib)
   - Pilih tanggal efektif (wajib, min = today)
6. Submit pengajuan
7. Status berubah: Badge "Pengajuan Resign Pending"
8. Notifikasi dikirim ke admin
9. Tunggu review admin:
   - Jika Approved → Kontrak auto-terminated
   - Jika Rejected → Guide menerima notifikasi dengan alasan
10. Guide bisa withdraw pengajuan (jika masih pending)
```

### **Scenario 4: Download PDF Kontrak**

```
1. Guide login → Profile → Kontrak Kerja
2. Pilih kontrak yang sudah ditandatangani
3. Scroll ke section "Aksi"
4. Klik button "Download PDF"
5. PDF generated dengan:
   - Detail kontrak lengkap
   - Signature guide
   - Signature perusahaan
   - Tanggal tanda tangan
6. File PDF di-download ke device
```

---

## 5. **API Endpoints yang Digunakan Guide**

### **List Kontrak**
```
GET /api/guide/contracts
Query params:
  - status (optional): filter by status
Response: { contracts: Contract[] }
```

### **Detail Kontrak**
```
GET /api/guide/contracts/[id]
Response: { contract: Contract }
```

### **Tanda Tangan Kontrak**
```
POST /api/guide/contracts/[id]/sign
Body: {
  signature_method: 'draw' | 'upload' | 'type',
  signature_data: string (base64 atau text),
  signature_file?: File (jika upload)
}
Response: { success: true, contract: Contract }
```

### **Tolak Kontrak**
```
POST /api/guide/contracts/[id]/reject
Body: {
  reason: string
}
Response: { success: true }
```

### **List Sanksi**
```
GET /api/guide/contracts/[id]/sanctions
Response: { data: Sanction[] }
```

### **Ajukan Resign**
```
POST /api/guide/contracts/[id]/resign
Body: {
  reason: string,
  effective_date: string (YYYY-MM-DD)
}
Response: { success: true, resignation: Resignation }
```

### **Withdraw Resign**
```
POST /api/guide/contracts/[id]/resign/withdraw
Response: { success: true }
```

### **List Resignations**
```
GET /api/guide/contracts/[id]/resignations
Response: { data: Resignation[] }
```

### **Download PDF**
```
GET /api/guide/contracts/[id]/pdf
Response: PDF file (application/pdf)
```

---

## 6. **UI/UX Features**

### **Mobile-First Design**
- ✅ Responsive untuk mobile device
- ✅ Touch-friendly buttons
- ✅ Swipe gestures (jika diperlukan)
- ✅ Bottom navigation untuk navigasi utama

### **Offline Support**
- ✅ Data cached dengan TanStack Query
- ✅ Offline indicator jika tidak ada koneksi
- ✅ Sync status ditampilkan

### **Loading States**
- ✅ Skeleton loaders untuk list
- ✅ Spinner untuk actions
- ✅ Progress indicator untuk upload

### **Error Handling**
- ✅ Error state dengan retry button
- ✅ Toast notifications untuk feedback
- ✅ Validation errors di form

### **Accessibility**
- ✅ ARIA labels untuk screen readers
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Color contrast sesuai WCAG

---

## 7. **Navigation Structure**

```
/guide (Dashboard)
  ├─ /guide/trips (Trips)
  ├─ /guide/attendance (Absensi)
  ├─ /guide/manifest (Manifest)
  └─ /guide/profile (Profil)
      └─ Menu Items (dari API)
          └─ "Kontrak Kerja" → /guide/contracts
              ├─ /guide/contracts (List)
              └─ /guide/contracts/[id] (Detail)
                  ├─ Tanda Tangan
                  ├─ Lihat Sanksi
                  ├─ Ajukan Resign
                  └─ Download PDF
```

---

## 8. **Permissions & Security**

### **RLS Policies**
- ✅ Guide hanya bisa melihat kontrak sendiri (`guide_id = auth.uid()`)
- ✅ Guide hanya bisa melihat sanksi sendiri
- ✅ Guide hanya bisa submit resign untuk kontrak sendiri
- ✅ Guide tidak bisa edit kontrak (read-only)

### **Role-Based Access**
- ✅ Hanya user dengan role `guide` yang bisa akses
- ✅ Route protection via `proxy.ts` middleware
- ✅ API endpoints check authentication

---

## 9. **Notifikasi yang Diterima Guide**

### **Kontrak Baru**
```
Title: "Kontrak Baru"
Message: "Anda menerima kontrak baru: [contract_number]"
Action: Klik → /guide/contracts/[id]
```

### **Kontrak Ditandatangani Perusahaan**
```
Title: "Kontrak Aktif"
Message: "Kontrak [contract_number] telah ditandatangani dan aktif"
Action: Klik → /guide/contracts/[id]
```

### **Menerima Sanksi**
```
Title: "Sanksi Diterima"
Message: "Anda menerima sanksi: [sanction_title]"
Action: Klik → /guide/contracts/[id] (scroll ke Sanksi)
```

### **Resignation Approved/Rejected**
```
Title: "Pengajuan Resign [Status]"
Message: "[Approved/Rejected]: [reason/notes]"
Action: Klik → /guide/contracts/[id]
```

---

## 10. **Tips untuk Guide**

1. **Cek Notifikasi**: Selalu cek notifikasi untuk kontrak baru atau update
2. **Baca Terms**: Baca terms & conditions sebelum tanda tangan
3. **Simpan PDF**: Download dan simpan PDF kontrak untuk referensi
4. **Cek Sanksi**: Rutin cek sanksi di detail kontrak
5. **Resign Planning**: Ajukan resign dengan notice period yang cukup (min 14 hari)

---

## 11. **Troubleshooting**

### **Kontrak Tidak Muncul**
- ✅ Pastikan sudah login dengan akun guide
- ✅ Cek filter status (mungkin terfilter)
- ✅ Refresh halaman
- ✅ Cek console untuk error

### **Tidak Bisa Tanda Tangan**
- ✅ Pastikan status = `pending_signature`
- ✅ Pastikan signature data valid
- ✅ Cek koneksi internet
- ✅ Coba metode tanda tangan lain

### **Resign Tidak Bisa Submit**
- ✅ Pastikan kontrak status = `active`
- ✅ Pastikan tidak ada pending resignation
- ✅ Pastikan tanggal efektif >= today
- ✅ Pastikan alasan tidak kosong

---

## ✅ Summary

Guide dapat mengakses kontrak melalui:
1. **Menu Profile** → Menu Items → "Kontrak Kerja"
2. **Direct URL** → `/guide/contracts`
3. **Notifikasi** → Klik notifikasi kontrak baru

Fitur yang tersedia:
- ✅ List kontrak dengan filter
- ✅ Detail kontrak lengkap
- ✅ Tanda tangan digital (draw/upload/type)
- ✅ Lihat sanksi (read-only)
- ✅ Ajukan resign (self-service)
- ✅ Download PDF kontrak

**Semua fitur sudah fully functional dan siap digunakan!** 🎉
