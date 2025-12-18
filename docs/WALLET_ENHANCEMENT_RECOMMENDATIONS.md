# Rekomendasi Enhancement Fitur Dompet/Pemasukan Guide Apps

## 📊 Executive Summary

Fitur dompet saat ini sudah memiliki foundation yang solid (balance, transactions, withdraw request). Untuk membuat fitur ini **benar-benar maksimal** dan menjadi competitive advantage, berikut rekomendasi enhancement yang dikelompokkan berdasarkan **priority** dan **impact**.

---

## 🎯 **TIER 1: HIGH IMPACT - QUICK WINS** (Implementasi 1-2 minggu)

### 1. **Earnings Breakdown & Analytics Dashboard**
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** Medium

**Fitur:**
- **Breakdown per Trip**: Detail pemasukan per trip dengan breakdown:
  - Base fee (`trip_guides.fee_amount`)
  - Bonus (jika ada rating tinggi)
  - Deductions (penalty dari `salary_deductions`)
  - Net earning per trip
- **Periodic Summary**: 
  - Pemasukan hari ini, minggu ini, bulan ini
  - Perbandingan dengan periode sebelumnya (growth %)
- **Visual Charts**: 
  - Line chart trend pemasukan 6 bulan terakhir
  - Bar chart pemasukan per bulan
  - Pie chart breakdown: Base Fee vs Bonus vs Deductions

**UI Components:**
```tsx
// Earnings Breakdown Card
- Today: Rp 500,000 (+15% vs yesterday)
- This Week: Rp 3,500,000 (+8% vs last week)
- This Month: Rp 12,000,000 (+12% vs last month)

// Trip Earnings List
- Trip TRP-2025-12-001 | Dec 15, 2025
  Base: Rp 500,000 | Bonus: Rp 50,000 | Penalty: -Rp 25,000
  Net: Rp 525,000 ✅
```

**API Endpoint:**
- `GET /api/guide/wallet/analytics` - Summary & charts data
- `GET /api/guide/wallet/breakdown?period=monthly` - Detailed breakdown

---

### 2. **Pending Earnings & Forecast**
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** Medium

**Fitur:**
- **Pending Earnings**: Menampilkan estimasi pemasukan yang belum masuk ke wallet
  - Trip yang sudah selesai tapi belum di-approve finance
  - Salary payment yang statusnya `ready` tapi belum `paid`
- **Forecast**: Estimasi pemasukan bulan depan berdasarkan:
  - Trip yang sudah dijadwalkan (`trips.trip_date` di bulan depan)
  - Rata-rata fee per trip guide
  - Historical pattern

**UI Components:**
```tsx
// Pending Earnings Card
Pending: Rp 2,500,000
- Trip TRP-001: Rp 500,000 (Waiting approval)
- Salary Period Dec 1-15: Rp 2,000,000 (Ready to pay)

// Forecast Card
Next Month Forecast: Rp 8,000,000
Based on 12 scheduled trips × avg Rp 650,000
```

**API Endpoint:**
- `GET /api/guide/wallet/pending` - Pending earnings
- `GET /api/guide/wallet/forecast` - Next month forecast

---

### 3. **Enhanced Transaction History**
**Impact:** ⭐⭐⭐⭐ | **Effort:** Low

**Fitur:**
- **Filter & Search**: 
  - Filter by type (earning, withdraw, adjustment)
  - Filter by date range
  - Search by trip code/reference
- **Grouping**: Group transactions by date (Today, Yesterday, This Week, etc.)
- **Trip Link**: Klik transaction → detail trip (jika `reference_type = 'trip'`)
- **Export**: Download CSV/PDF laporan transaksi

**UI Components:**
```tsx
// Filter Bar
[All] [Earnings] [Withdrawals] [Adjustments]
Date: [This Month ▼] [Export CSV]

// Grouped Transactions
Today (Dec 18, 2025)
  → Earning from TRP-001: +Rp 500,000
  → Withdraw Request: -Rp 1,000,000 (Pending)

Yesterday (Dec 17, 2025)
  → Earning from TRP-002: +Rp 450,000
```

**API Endpoint:**
- `GET /api/guide/wallet/transactions?type=earning&from=2025-12-01&to=2025-12-31`
- `GET /api/guide/wallet/transactions/export?format=csv`

---

### 4. **Smart Withdraw with Quick Actions**
**Impact:** ⭐⭐⭐⭐ | **Effort:** Low

**Fitur:**
- **Quick Amount Buttons**: 
  - "Tarik Semua" (withdraw all)
  - "Tarik 50%" (withdraw 50%)
  - "Tarik 1 Juta" (preset amount)
- **Minimum Balance Alert**: Warning jika saldo akan < minimum threshold
- **Withdraw History**: Status tracking withdraw request
  - Pending → Approved → Processing → Completed
- **Auto-Withdraw Schedule**: Set jadwal tarik otomatis (bulanan)

**UI Components:**
```tsx
// Quick Actions
[Rp 1,000,000] [Rp 2,500,000] [Rp 5,000,000] [50%] [All]

// Withdraw Status Tracker
Dec 15, 2025 - Rp 2,000,000
Status: ✅ Approved → Processing → Completed (Dec 17)
```

**API Endpoint:**
- `POST /api/guide/wallet/withdraw` (enhanced dengan quick actions)
- `GET /api/guide/wallet/withdraw/history` - Withdraw requests history

---

## 🚀 **TIER 2: MEDIUM IMPACT - STRATEGIC FEATURES** (Implementasi 2-4 minggu)

### 5. **Performance-Based Earnings & Bonuses**
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** High

**Fitur:**
- **Rating Bonus**: Bonus berdasarkan rating dari tamu
  - Rating 5⭐: +10% dari base fee
  - Rating 4⭐: +5% dari base fee
  - Rating 3⭐: Base fee (no bonus)
  - Rating <3⭐: -10% penalty
- **On-Time Bonus**: Bonus jika check-in tepat waktu (tidak `is_late`)
- **Documentation Bonus**: Bonus jika upload dokumentasi lengkap
- **Guest Count Bonus**: Bonus jika jumlah tamu melebihi target
- **Loyalty Bonus**: Bonus untuk guide yang sudah X trip berturut-turut

**Calculation Logic:**
```typescript
// Base fee dari trip_guides.fee_amount
// Rating bonus dari reviews.guide_rating
// On-time bonus: +Rp 50,000 jika !is_late
// Documentation bonus: +Rp 100,000 jika documentation_uploaded = true
// Guest count bonus: +Rp 10,000 per pax di atas target

Total Earning = Base Fee 
  + Rating Bonus 
  + On-Time Bonus 
  + Documentation Bonus 
  + Guest Count Bonus
  - Penalties
```

**UI Components:**
```tsx
// Trip Earnings Detail
Base Fee: Rp 500,000
+ Rating Bonus (5⭐): +Rp 50,000
+ On-Time Bonus: +Rp 50,000
+ Documentation Bonus: +Rp 100,000
- Late Penalty: -Rp 25,000
─────────────────────────
Total: Rp 675,000 ✅
```

**API Endpoint:**
- `GET /api/guide/wallet/performance-bonuses` - Bonus breakdown
- `POST /api/guide/wallet/calculate-bonus` - Calculate bonus for trip

---

### 6. **Savings Goals & Milestones**
**Impact:** ⭐⭐⭐⭐ | **Effort:** Medium

**Fitur:**
- **Savings Goals**: Set target tabungan (contoh: Rp 10,000,000 untuk liburan)
- **Progress Tracking**: Progress bar menuju goal
- **Milestones**: Badge/achievement saat mencapai milestone
  - "First Million" - Saldo mencapai Rp 1,000,000
  - "Five Million Club" - Saldo mencapai Rp 5,000,000
  - "Ten Million Master" - Saldo mencapai Rp 10,000,000
- **Auto-Save**: Otomatis set aside X% dari setiap earning ke "savings"

**UI Components:**
```tsx
// Savings Goal Card
Target: Rp 10,000,000 (Liburan ke Bali)
Current: Rp 7,500,000
Progress: ████████░░ 75%

// Milestones
🏆 First Million - Dec 10, 2025
🏆 Five Million Club - Dec 15, 2025
🎯 Next: Ten Million Master (Rp 2,500,000 to go)
```

**API Endpoint:**
- `POST /api/guide/wallet/goals` - Create/update savings goal
- `GET /api/guide/wallet/milestones` - Milestones & achievements

---

### 7. **Financial Insights & Recommendations**
**Impact:** ⭐⭐⭐⭐ | **Effort:** High

**Fitur:**
- **Spending Analysis**: Analisis pengeluaran (jika ada expense tracking)
- **Earning Trends**: 
  - Trend naik/turun
  - Seasonal patterns (musim liburan lebih tinggi)
  - Best performing months
- **Comparison** (Anonymized):
  - "Anda di atas 75% guide lain di branch ini"
  - "Rata-rata pemasukan guide: Rp 8,000,000/bulan"
- **Recommendations**:
  - "Coba ambil lebih banyak trip di weekend untuk bonus"
  - "Rating Anda tinggi, pertahankan untuk bonus lebih besar"
  - "Dokumentasi lengkap = +Rp 100,000 per trip"

**UI Components:**
```tsx
// Insights Card
📈 Earning Trend: +15% vs last month
📊 Performance: Top 25% of guides
💡 Tip: Upload dokumentasi lengkap untuk bonus Rp 100k/trip

// Comparison (Anonymized)
Your Monthly Average: Rp 8,500,000
Branch Average: Rp 7,200,000
You're 18% above average! 🎉
```

**API Endpoint:**
- `GET /api/guide/wallet/insights` - Financial insights
- `GET /api/guide/wallet/comparison` - Anonymized comparison

---

### 8. **Real-Time Notifications & Alerts**
**Impact:** ⭐⭐⭐⭐ | **Effort:** Medium

**Fitur:**
- **Push Notifications** (via Service Worker):
  - "Pemasukan baru: +Rp 500,000 dari Trip TRP-001"
  - "Withdraw request Anda telah disetujui"
  - "Saldo Anda mencapai Rp 5,000,000! 🎉"
  - "Peringatan: Saldo Anda di bawah minimum"
- **In-App Notifications**: Badge count di wallet icon
- **Email Notifications** (optional): Weekly summary email

**Implementation:**
- Integrate dengan existing notification system
- Use Server-Sent Events (SSE) untuk real-time updates
- Service Worker untuk push notifications

**UI Components:**
```tsx
// Notification Badge
🔔 Wallet (3)
  → New earning: +Rp 500,000
  → Withdraw approved: Rp 2,000,000
  → Milestone: First Million! 🏆
```

**API Endpoint:**
- `GET /api/guide/realtime` (already exists, enhance untuk wallet events)
- `POST /api/guide/wallet/notifications/preferences` - Notification settings

---

## 🎨 **TIER 3: NICE TO HAVE - ADVANCED FEATURES** (Implementasi 4-8 minggu)

### 9. **Tax Calculation & Reporting**
**Impact:** ⭐⭐⭐ | **Effort:** High

**Fitur:**
- **Tax Estimation**: Estimasi PPh 21 berdasarkan pemasukan
- **Annual Summary**: Ringkasan tahunan untuk SPT
- **Export Tax Report**: Download laporan untuk keperluan pajak
- **Tax Withholding**: Auto-deduct tax jika diperlukan

**UI Components:**
```tsx
// Tax Summary
Total Earnings 2025: Rp 96,000,000
Estimated Tax (PPh 21): Rp 4,800,000 (5%)
Net After Tax: Rp 91,200,000

[Download Tax Report PDF]
```

---

### 10. **Investment & Savings Suggestions**
**Impact:** ⭐⭐⭐ | **Effort:** High

**Fitur:**
- **Savings Calculator**: Hitung berapa lama untuk mencapai goal
- **Investment Suggestions**: Rekomendasi investasi sederhana
  - Deposito
  - Reksadana
  - Emas
- **ROI Calculator**: Hitung return jika investasi

**UI Components:**
```tsx
// Savings Calculator
Current: Rp 5,000,000
Monthly Save: Rp 2,000,000
Target: Rp 20,000,000
Time to Goal: 7.5 months

// Investment Suggestions
💡 Consider: Deposito 6% p.a.
  Current: Rp 5,000,000
  After 1 year: Rp 5,300,000 (+Rp 300,000)
```

---

### 11. **Split Earnings (Multi-Guide Trips)**
**Impact:** ⭐⭐⭐ | **Effort:** Medium

**Fitur:**
- **Split Calculation**: Jika ada multiple guides per trip
  - Lead guide: 60%
  - Assistant guide: 30%
  - Driver: 10%
- **Split History**: Riwayat split earnings

**UI Components:**
```tsx
// Trip Earnings Split
Trip TRP-001 (Total: Rp 1,000,000)
  You (Lead): Rp 600,000 (60%)
  Assistant: Rp 300,000 (30%)
  Driver: Rp 100,000 (10%)
```

---

### 12. **Gamification & Achievements**
**Impact:** ⭐⭐⭐ | **Effort:** Medium

**Fitur:**
- **Achievement Badges**:
  - "First Trip" - Complete first trip
  - "Hundred Trip" - Complete 100 trips
  - "Millionaire" - Earn Rp 1,000,000 in a month
  - "Perfect Month" - No penalties in a month
- **Leaderboard** (Anonymized): Ranking berdasarkan earnings
- **Streaks**: Consecutive days/trips dengan bonus

**UI Components:**
```tsx
// Achievements
🏆 First Trip - Dec 1, 2025
🏆 Millionaire - Dec 15, 2025
🎯 Next: Perfect Month (0 penalties this month)

// Leaderboard (Anonymized)
#1: Guide*** (Rp 12,000,000)
#2: Guide*** (Rp 10,500,000)
#3: You (Rp 8,500,000) ⬆️
```

---

## 📋 **IMPLEMENTATION ROADMAP**

### **Phase 1: Foundation Enhancement (Weeks 1-2)**
1. ✅ Earnings Breakdown & Analytics Dashboard
2. ✅ Enhanced Transaction History (Filter, Search, Export)
3. ✅ Smart Withdraw with Quick Actions

### **Phase 2: Intelligence Layer (Weeks 3-4)**
4. ✅ Pending Earnings & Forecast
5. ✅ Real-Time Notifications & Alerts
6. ✅ Performance-Based Earnings & Bonuses

### **Phase 3: Engagement Features (Weeks 5-6)**
7. ✅ Savings Goals & Milestones
8. ✅ Financial Insights & Recommendations
9. ✅ Gamification & Achievements

### **Phase 4: Advanced Features (Weeks 7-8)**
10. ✅ Tax Calculation & Reporting
11. ✅ Investment & Savings Suggestions
12. ✅ Split Earnings (Multi-Guide Trips)

---

## 🎯 **SUCCESS METRICS**

Setelah implementasi, track metrics berikut:

1. **Engagement**:
   - Daily Active Users (DAU) di wallet page
   - Average session time di wallet page
   - Number of withdraw requests per month

2. **Financial Health**:
   - Average balance per guide
   - Withdraw frequency
   - Savings goals completion rate

3. **User Satisfaction**:
   - Wallet feature NPS score
   - User feedback/ratings
   - Feature adoption rate

---

## 💡 **ADDITIONAL RECOMMENDATIONS**

### **UX Enhancements:**
- **Dark Mode**: Support dark mode untuk wallet page
- **Accessibility**: Screen reader support, keyboard navigation
- **Mobile Optimization**: Swipe actions, pull-to-refresh
- **Offline Support**: Cache balance & recent transactions untuk offline viewing

### **Security Enhancements:**
- **2FA for Withdraw**: Two-factor authentication untuk withdraw > certain amount
- **Withdraw Limits**: Daily/monthly withdraw limits
- **Transaction Verification**: Email/SMS verification untuk large transactions

### **Integration Opportunities:**
- **Bank Integration**: Direct bank transfer (jika ada API banking)
- **E-Wallet Integration**: Transfer ke GoPay/OVO/DANA
- **QR Code Payment**: Generate QR untuk payment verification

---

## 📝 **NOTES**

- Semua enhancement harus **mobile-first** (karena Guide App adalah mobile app)
- Prioritaskan **offline support** untuk critical features
- Gunakan **caching strategy** untuk analytics data (tidak perlu real-time)
- **Privacy**: Anonymized comparison data (tidak expose guide identity)
- **Performance**: Lazy load charts, pagination untuk transaction history

---

**Last Updated:** December 18, 2025
**Status:** Recommendations Ready for Review

