# Analisa Reorganisasi Menu Guide App

## 🔍 Masalah yang Ditemukan

### 1. Redundansi Section
- **Development** dan **Pembelajaran** terpisah padahal konsepnya sama
- **Performance** di Development padahal lebih cocok di **Insight Pribadi**
- **Insight Pribadi** di Operasional padahal lebih cocok sebagai section sendiri

### 2. Struktur Menu Saat Ini

#### Section: Akun
- Edit Profil
- Rating & Ulasan

#### Section: Operasional
- Insight Pribadi ⚠️ (seharusnya section sendiri atau gabung dengan Performance)
- Laporan Insiden

#### Section: Development
- Onboarding
- Assessments
- Skills
- Performance ⚠️ (seharusnya masuk Insight Pribadi)

#### Section: Pembelajaran
- Learning Hub ⚠️ (seharusnya gabung dengan Development)

#### Section: Pengaturan
- Preferences
- Settings
- Dokumen
- Kebijakan Privasi
- Bantuan

## ✅ Solusi yang Diusulkan

### 1. Reorganisasi Section

#### Section: Akun (tetap)
- Edit Profil
- Rating & Ulasan

#### Section: Operasional (tetap)
- Laporan Insiden

#### Section: Pembelajaran & Development (GABUNGAN)
- Onboarding
- Assessments
- Skills
- Learning Hub

#### Section: Insight Pribadi (BARU - gabung Performance)
- Insight Pribadi (dari Operasional)
- Performance Metrics (dari Development)

#### Section: Pengaturan (tetap)
- Preferences
- Settings
- Dokumen
- Kebijakan Privasi
- Bantuan

### 2. UI Enhancement: Collapse/Accordion

Menu profile akan menggunakan accordion untuk:
- Section dengan banyak item (Pembelajaran & Development, Pengaturan)
- Section dengan sedikit item tetap expanded (Akun, Operasional)

## 📋 Action Items

1. ✅ Buat migration untuk reorganisasi menu items
2. ✅ Integrasikan Performance ke Insight Pribadi
3. ✅ Implementasi accordion component untuk menu
4. ✅ Update profile-client.tsx dengan accordion
5. ✅ Test dan verifikasi
