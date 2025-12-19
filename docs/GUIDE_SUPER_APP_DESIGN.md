# Guide App - Super App Design & Navigation Structure

**Tanggal:** 2025-01-23  
**Status:** ✅ **IMPLEMENTASI SELESAI**

---

## 📋 Overview

Transformasi Guide App menjadi **"Super App"** dengan struktur navigasi yang lebih logis, dashboard sebagai Mission Control, dan profile page yang menampilkan career data secara komprehensif.

---

## 🎯 Navigation Structure (Super App)

### Bottom Navigation (5 Items - Tetap Mobile-First)

1. **Home** (`/guide`) - Mission Control Dashboard
2. **Trip** (`/guide/trips`) - Trip Management
3. **Absensi** (`/guide/attendance`) - Check-in/out & Attendance
4. **Manifest** (`/guide/manifest`) - Manifest & Passenger List
5. **Profil** (`/guide/profile`) - Profile & Career Overview

**Rationale:**
- Labels menggunakan nama fitur langsung (tidak perlu istilah lain)
- Tetap 5 items (optimal untuk thumb reach)
- Mengikuti hierarchy: Home → Operations → Profile

---

## 🏠 Home/Dashboard: Mission Control

### Layout Structure

```
┌─────────────────────────────────────┐
│  Header: Greeting + Status          │
├─────────────────────────────────────┤
│  Active Trip Card (if exists)       │
├─────────────────────────────────────┤
│  Quick Stats (3 cards horizontal)   │
│  - Earnings (This Month)            │
│  - Rating                            │
│  - Trips Completed                  │
├─────────────────────────────────────┤
│  Super App Menu Grid (Categorized)  │
│  - Operasional (Absensi, Manifest, Trips) │
│  - Finansial (Wallet, Earnings)     │
│  - Pengembangan (Training, Certs)   │
│  - Dukungan (SOS, Notifications)    │
├─────────────────────────────────────┤
├─────────────────────────────────────┤
│  Career Overview Section            │
│  - Level & Progress Bar             │
│  - Badges Preview                   │
│  - Certifications Status            │
├─────────────────────────────────────┤
│  Weather Widget                     │
├─────────────────────────────────────┤
│  Challenges Widget                  │
├─────────────────────────────────────┤
│  Upcoming Trips (3 items)           │
└─────────────────────────────────────┘
```

### Key Enhancements

1. **Super App Menu Grid** ⭐ NEW
   - Menu items dikelompokkan dalam kategori yang jelas
   - Setiap kategori memiliki card sendiri dengan warna khas
   - Grid layout 2x4 (mobile) atau 4x4 (desktop)
   - Kategori: Operasional, Finansial, Pengembangan, Dukungan (TIDAK termasuk Profile/Settings - ada di Profile page)
   - Auto-populate dengan menu items dari database
   - Essential items ditambahkan otomatis (Attendance, Manifest, Trips, Wallet, dll)

2. **Career Overview Card**
   - Level dengan progress bar ke level berikutnya
   - Badges preview (clickable ke leaderboard)
   - Certifications status (valid/invalid count)
   - Quick link ke Profile untuk detail

3. **Enhanced Stats**
   - Earnings this month dengan growth indicator
   - Rating dengan trend
   - Trips completed dengan comparison

4. **Quick Actions**
   - Tetap contextual (time-based, trip-based)
   - Visual hierarchy yang lebih jelas
   - Grouped by priority

---

## 📱 Super App Menu Grid

### Fitur

Menu grid yang menampilkan semua fitur aplikasi dalam kategori yang terorganisir, seperti super app pada umumnya (Gojek, Grab, dll).

### Kategori Menu

1. **Operasional** (Blue)
   - Absensi (Check-in/out)
   - Manifest (Daftar tamu)
   - Jadwal Trip
   - Status & Ketersediaan

2. **Finansial** (Emerald/Green)
   - Dompet (Wallet)
   - Pendapatan & Transaksi

3. **Pengembangan** (Purple)
   - Pelatihan (Training)
   - Sertifikasi (Certifications)
   - Learning Hub (FAQ & SOP)

4. **Dukungan** (Amber/Yellow)
   - SOS (Emergency button)
   - Notifikasi

**Note:** Menu seperti Edit Profile, Settings, Preferences, Documents, ID Card, dll **TIDAK** ditampilkan di Super App Menu karena seharusnya ada di Profile page sesuai best practices super app (Gojek, Grab, dll).

### UI Features

- **Card per Kategori:** Setiap kategori memiliki card sendiri dengan warna gradient
- **Icon Header:** Setiap kategori memiliki icon di header
- **Grid Layout:** 2 kolom (mobile), 4 kolom (desktop)
- **Hover Effects:** Smooth transitions dan hover states
- **Touch Optimized:** Active scale untuk feedback tactile
- **Auto-populate:** Menu items dari database + essential items
- **"Show More":** Link ke Profile page jika ada lebih dari 8 items per kategori

---

## 👤 Profile Page: Career & Personal Hub

### Layout Structure

```
┌─────────────────────────────────────┐
│  Profile Header                     │
│  - Avatar + Name                    │
│  - Role badge                       │
│  - Contact info                     │
├─────────────────────────────────────┤
│  Career Overview Section            │
│  - Level & Progress                 │
│  - Total Earnings (All-time)        │
│  - Career Stats (3 cards)           │
│    • Total Trips                    │
│    • Average Rating                 │
│    • Years Experience               │
├─────────────────────────────────────┤
│  Earnings Summary                   │
│  - Current Balance (Wallet card)    │
│  - This Month Earnings              │
│  - Growth Trend                     │
│  - Quick link ke Wallet             │
├─────────────────────────────────────┤
│  Certifications Section             │
│  - Status (Valid/Invalid count)     │
│  - Active Certifications List       │
│  - Quick link ke Certifications     │
├─────────────────────────────────────┤
│  Badges & Achievements              │
│  - Badges Grid                      │
│  - Level Progress                   │
├─────────────────────────────────────┤
│  Menu Sections (Accordion)          │
│  - Akun                             │
│  - Operasional                      │
│  - Dukungan                         │
│  - Pengaturan                       │
└─────────────────────────────────────┘
```

### Key Features

1. **Career Overview**
   - Level dengan visual progress bar
   - Total earnings (all-time)
   - Career milestones

2. **Earnings Summary**
   - Current wallet balance (prominent)
   - Monthly earnings dengan comparison
   - Growth indicators

3. **Certifications**
   - Status summary (valid/invalid)
   - List certifications dengan expiry dates
   - Quick access ke certifications page

4. **Badges & Achievements**
   - Visual badges grid
   - Clickable ke leaderboard

---

## 🎨 Design Principles

### Visual Hierarchy

1. **Mission Control (Dashboard)**
   - Status & Active Trip: Top priority
   - Quick Stats: Immediate visibility
   - Quick Actions: Easy access
   - Career Overview: Secondary but visible

2. **Profile**
   - Personal Info: Top
   - Career Data: Prominent
   - Menu Items: Secondary

### Color Scheme

- **Primary:** Emerald (green) - Operations, positive actions
- **Secondary:** Blue - Information, stats
- **Accent:** Amber - Ratings, achievements
- **Warning:** Red - Alerts, penalties
- **Neutral:** Slate - Text, backgrounds

### Typography

- **Headings:** Bold, clear hierarchy
- **Body:** Readable, comfortable sizing
- **Labels:** Medium weight, concise

---

## 📱 Responsive Considerations

- **Mobile-First:** All designs optimized for mobile
- **Touch Targets:** Minimum 44px height
- **Scrollable Sections:** Long content in scrollable containers
- **Progressive Disclosure:** Accordion untuk menu sections

---

## 🔄 User Flows

### Flow 1: Check Career Status

```
Home → Career Overview Card → Profile → Certifications
```

### Flow 2: Check Earnings

```
Home → Earnings Stat → Profile → Wallet
```

### Flow 3: Access Operations

```
Home → Quick Actions → Manifest/Attendance
```

---

## ✅ Implementation Checklist

- [x] Design dokumentasi
- [x] Update Dashboard dengan Career Overview
- [x] Update Profile dengan Career Data Section (Earnings Summary)
- [x] Bottom Navigation labels (Trip, Absensi, Manifest - menggunakan nama fitur langsung)
- [x] Create Career Overview Widget (compact & detailed variants)
- [x] Integrate Earnings Summary Card ke Profile
- [x] Create Super App Menu Grid component dengan kategori
- [x] Integrate Super App Menu Grid ke Dashboard (Home page)
- [ ] Test user flows (manual testing required)
- [ ] Verify responsive design (manual testing required)

---

## 📁 Files Created/Modified

### New Files
- `app/[locale]/(mobile)/guide/widgets/career-overview-widget.tsx` - Career Overview Widget component
- `app/[locale]/(mobile)/guide/widgets/super-app-menu-grid.tsx` - Super App Menu Grid dengan kategori

### Modified Files
- `components/layout/guide-bottom-navigation.tsx` - Updated navigation labels (Jadwal, Aktivitas, Operasi)
- `app/[locale]/(mobile)/guide/guide-dashboard-client.tsx` - Added Super App Menu Grid & Career Overview section
- `app/[locale]/(mobile)/guide/profile/profile-client.tsx` - Added Career Overview & Earnings Summary sections

---

**Status:** ✅ **IMPLEMENTASI SELESAI**
