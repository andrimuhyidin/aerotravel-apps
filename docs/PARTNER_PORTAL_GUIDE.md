# Partner Portal User Guide

**Version:** 1.0  
**Last Updated:** 2025-01-31

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Package Browsing](#package-browsing)
5. [Creating Bookings](#creating-bookings)
6. [Wallet Management](#wallet-management)
7. [Invoice Management](#invoice-management)
8. [Whitelabel Settings](#whitelabel-settings)
9. [Commission Reports](#commission-reports)
10. [FAQ](#faq)

---

## Overview

Partner Portal adalah platform B2B yang memungkinkan travel agents (mitra) untuk:
- Browse paket wisata dengan harga NTA (Net Travel Agent)
- Membuat booking untuk customer dengan mudah
- Mengelola wallet dan deposit
- Generate invoice dengan branding sendiri (whitelabel)
- Melacak komisi dan kinerja

---

## Getting Started

### 1. Onboarding Flow

Setelah login pertama kali, Anda akan diarahkan ke halaman onboarding yang memandu Anda melalui:
1. **Welcome** - Pengenalan fitur
2. **Setup Whitelabel** (Opsional) - Kustomisasi branding invoice
3. **Top-up Wallet** - Isi saldo untuk booking
4. **First Booking** - Pelajari cara membuat booking

### 2. Navigation

- **Dashboard** (`/partner/dashboard`) - Ringkasan aktivitas
- **Paket** (`/partner/packages`) - Browse paket wisata
- **Booking** (`/partner/bookings`) - Kelola booking
- **Wallet** (`/partner/wallet`) - Kelola saldo
- **Reports** (`/partner/reports`) - Laporan komisi
- **Whitelabel** (`/partner/whitelabel`) - Settings branding

---

## Dashboard

Dashboard menampilkan:
- **Saldo Wallet** - Saldo saat ini dan credit limit
- **Booking Bulan Ini** - Total booking di bulan berjalan
- **Komisi Bulan Ini** - Total komisi yang diperoleh
- **Trip Mendatang** - Jumlah trip yang akan datang
- **Quick Actions** - Shortcut ke fitur utama
- **Recent Transactions** - Transaksi wallet terakhir
- **Recent Bookings** - Booking terakhir

---

## Package Browsing

### Cara Browse Paket

1. Navigasi ke **Paket** dari menu
2. Gunakan search bar untuk mencari paket
3. Filter berdasarkan destinasi
4. Lihat informasi:
   - **Harga NTA** - Harga yang akan Anda bayar
   - **Publish Price** - Harga yang ditampilkan ke customer
   - **Margin** - Komisi potensial Anda

### Informasi Paket

Setiap paket menampilkan:
- Nama paket dan destinasi
- Durasi (hari & malam)
- Harga NTA (highlighted)
- Margin potensial
- Ketersediaan tanggal

---

## Creating Bookings

### Booking Wizard (5 Steps)

#### Step 1: Paket & Tanggal
- Pilih paket (atau dari halaman paket)
- Pilih tanggal trip (hanya tanggal tersedia yang ditampilkan)

#### Step 2: Data Customer
- Nama customer (wajib)
- Nomor telepon (wajib)
- Email (opsional)

#### Step 3: Jumlah Peserta
- Dewasa (minimal 1)
- Anak (50% dari harga dewasa)
- Bayi (gratis)
- Harga NTA akan terhitung otomatis

#### Step 4: Metode Pembayaran
- **Wallet** - Debit langsung dari saldo wallet
- **External** - Customer membayar langsung (Midtrans)

#### Step 5: Review & Konfirmasi
- Review semua detail
- Konfirmasi dan buat booking

### Setelah Booking Dibuat

- Booking code akan ter-generate otomatis
- Invoice dapat di-download
- Email konfirmasi dikirim ke Anda
- Booking muncul di daftar booking

---

## Wallet Management

### Top-up Wallet

1. Navigasi ke **Wallet**
2. Klik **Top-up Wallet**
3. Masukkan jumlah (minimal Rp 100.000)
4. Pilih metode pembayaran (Xendit):
   - QRIS
   - Virtual Account
   - E-Wallet
   - Retail Outlet
5. Selesaikan pembayaran
6. Saldo akan otomatis ter-update setelah pembayaran berhasil

### Transaction History

Lihat semua transaksi wallet:
- Top-up
- Booking debit
- Refund
- Adjustment

Filter berdasarkan:
- Tipe transaksi
- Tanggal
- Search

Export ke CSV untuk rekonsiliasi.

---

## Invoice Management

### Download Invoice

1. Buka detail booking
2. Klik **Unduh Invoice**
3. Invoice PDF akan di-download dengan branding Anda (jika whitelabel sudah di-setup)

### Invoice Content

Invoice berisi:
- Informasi perusahaan (dari whitelabel settings)
- Customer info
- Detail booking
- Harga NTA (bukan publish price)
- Payment status

---

## Whitelabel Settings

### Setup Branding

1. Navigasi ke **Whitelabel Settings**
2. Upload **Logo Perusahaan**
3. Isi **Informasi Perusahaan**:
   - Nama perusahaan
   - Alamat
   - Telepon
   - Email
4. (Opsional) Set **Warna Branding**:
   - Primary color
   - Secondary color
5. (Opsional) Tambahkan **Footer Text**
6. Klik **Simpan**

### Preview

Invoice akan menggunakan branding Anda:
- Logo perusahaan di header
- Informasi perusahaan
- Warna sesuai brand
- Footer text custom

---

## Commission Reports

### Melihat Laporan Komisi

1. Navigasi ke **Reports**
2. Pilih periode (dari tanggal - sampai tanggal)
3. Pilih pengelompokan:
   - Harian
   - Bulanan
   - Tahunan
4. Klik **Refresh**

### Report Content

- **Summary Cards**:
  - Total booking
  - Total revenue
  - Total komisi
- **Komisi per Periode**: Breakdown komisi berdasarkan periode
- **Detail Booking**: Tabel detail setiap booking dengan komisi

### Export

Klik **Export CSV** untuk download laporan dalam format CSV.

---

## FAQ

### Q: Apa itu harga NTA?
**A:** NTA (Net Travel Agent) adalah harga khusus untuk travel agents, lebih murah dari harga publish. Selisihnya adalah komisi Anda.

### Q: Berapa minimum top-up wallet?
**A:** Minimum top-up adalah Rp 100.000.

### Q: Bagaimana cara menghitung komisi?
**A:** Komisi = Publish Price - NTA Price. Semua komisi tercatat otomatis di sistem.

### Q: Apakah whitelabel wajib?
**A:** Tidak wajib. Jika tidak di-setup, invoice akan menggunakan default branding AeroTravel.

### Q: Bagaimana jika saldo wallet tidak mencukupi?
**A:** Anda dapat:
1. Top-up wallet terlebih dahulu
2. Atau pilih metode pembayaran External (customer bayar langsung)

### Q: Kapan komisi dibayarkan?
**A:** Komisi sudah termasuk dalam harga NTA. Anda mendapatkan margin langsung saat customer membayar.

### Q: Bagaimana cara cancel booking?
**A:** Hubungi admin operasional untuk cancel booking. Fitur cancel otomatis akan datang.

---

## Support

Jika ada pertanyaan atau masalah:
- Email: partners@aerotravel.co.id
- WhatsApp: +62 xxx xxxx xxxx
- Lihat dokumentasi lengkap di: `/docs/API.md`

---

**Last Updated:** 2025-01-31

