# Cross-App Integration Assessment
**Date:** 2025-02-02  
**Status:** In Progress

## Executive Summary

Assessment menyeluruh untuk cross-app data integration menunjukkan beberapa area yang masih perlu implementasi dan improvement. Assessment ini mencakup:
- Unified Notifications Integration
- Real-time Hooks Usage
- Event Emissions Coverage
- Sample Data untuk Testing

---

## 1. Unified Notifications Integration

### ✅ Yang Sudah Ada
- **Guide App**: Sudah menggunakan unified notifications API (`/api/guide/notifications`)
- **Unified Notifications API**: `/api/notifications` sudah tersedia
- **Event Handlers**: Sudah create notifications untuk events

### ❌ Yang Masih Kurang
- **Partner App**: Masih menggunakan API lama (`/api/partner/notifications`) 
  - File: `app/[locale]/(portal)/partner/notifications/notifications-client.tsx`
  - Perlu migrate ke `/api/notifications?app=partner`
- **Customer App**: Belum ada notifications page
- **Admin App**: Belum ada notifications page
- **Corporate App**: Belum ada notifications page

### 📋 Action Items
1. Update Partner notifications client untuk menggunakan unified API
2. Buat notifications page untuk Customer, Admin, Corporate apps
3. Test unified notifications di semua apps

---

## 2. Real-time Hooks Usage

### ✅ Yang Sudah Ada
- **Hooks tersedia**: 
  - `useBookingRealtime` / `useBookingRealtimeUpdate`
  - `useAvailabilityRealtime`
  - `useTripRealtime`
  - `useWalletRealtime`
- **Booking Detail**: Sudah menggunakan `useBookingRealtimeUpdate`

### ❌ Yang Masih Kurang
- **Package Detail**: Belum menggunakan `useAvailabilityRealtime`
  - File: `app/[locale]/(portal)/partner/packages/[id]/package-detail-client.tsx`
  - Masih manual fetch, belum real-time
- **Trip Detail**: Belum menggunakan `useTripRealtime`
  - Guide app trip detail belum real-time
  - Admin trip detail belum real-time
- **Wallet Pages**: Belum menggunakan `useWalletRealtime`
  - Partner wallet belum real-time
  - Guide wallet belum real-time
- **Booking List**: Belum real-time untuk multiple bookings

### 📋 Action Items
1. Integrate `useAvailabilityRealtime` di package detail
2. Integrate `useTripRealtime` di trip detail (guide & admin)
3. Integrate `useWalletRealtime` di wallet pages
4. Buat hook untuk real-time booking list updates

---

## 3. Event Emissions Coverage

### ✅ Yang Sudah Ada
- **Booking Created**: ✅ Emit di `POST /api/partner/bookings`
- **Booking Cancelled**: ✅ Emit di `POST /api/partner/bookings/[id]/cancel`
- **Payment Received**: ✅ Emit di webhook Midtrans
- **Booking Status Changed**: ✅ Emit di webhook Midtrans (setelah payment)

### ❌ Yang Masih Kurang

#### Booking Events
- **Booking Updated**: ❌ Belum emit di `PUT /api/partner/bookings/[id]`
  - File: `app/api/partner/bookings/[id]/route.ts`
  - Perlu emit `booking.updated` event

#### Trip Events
- **Trip Assigned**: ❌ Belum emit di:
  - `POST /api/guide/crew/trip/[tripId]` (guide assignment)
  - `POST /api/admin/guide/crew/trip/[tripId]/assign` (admin assignment)
  - `POST /api/admin/trips/[id]/assign` (trip assignment)
- **Trip Status Changed**: ❌ Belum emit di:
  - `POST /api/guide/trips/[id]/start` (trip started)
  - `POST /api/guide/trips/[id]/confirm` (trip confirmed)
  - Trip status updates lainnya
- **Trip Assignment Confirmed/Rejected**: ❌ Belum emit di:
  - `POST /api/guide/trips/[id]/confirm` (guide confirms/rejects)

#### Wallet Events
- **Wallet Balance Changed**: ❌ Belum emit di:
  - `lib/partner/wallet.ts` - `creditWallet`, `debitWalletForBooking`
  - `lib/guide/contract-payment.ts` - `processTripPayment`
  - `app/api/admin/guide/contracts/[id]/sign/route.ts` - contract signing
  - `app/api/admin/guide/wallet/withdraw/route.ts` - withdrawals

#### Package Events
- **Package Availability Changed**: ❌ Belum emit secara eksplisit
  - Sudah ada cache invalidation, tapi belum emit event

### 📋 Action Items
1. Add event emissions untuk booking updates
2. Add event emissions untuk trip assignments & status changes
3. Add event emissions untuk wallet transactions
4. Add event emissions untuk package availability changes

---

## 4. Sample Data

### Current Status
- **Bookings**: 17 bookings existing
- **Packages**: Ada packages (tapi perlu cek status)
- **Trips**: Ada trips (tapi perlu cek status)
- **Partner Customers**: 0 customers (perlu sample data)
- **Unified Notifications**: 0 notifications (perlu sample untuk testing)

### 📋 Action Items
1. Buat sample data untuk:
   - Partner customers (minimal 10-20 customers)
   - Unified notifications (untuk testing UI)
   - App events (untuk testing event bus)
   - Sample bookings dengan berbagai status
   - Sample trips dengan berbagai status
2. Buat migration script untuk sample data

---

## 5. Missing Integrations

### Customer App
- ❌ Belum ada notifications page
- ❌ Belum ada real-time booking updates
- ❌ Belum ada unified customer profile view

### Admin App
- ❌ Belum ada notifications page
- ❌ Belum ada real-time dashboard updates
- ❌ Belum ada unified analytics

### Corporate App
- ❌ Belum ada notifications page
- ❌ Belum ada real-time employee booking updates

---

## Priority Matrix

### High Priority (P0)
1. ✅ Event handlers initialization (DONE)
2. ✅ Booking creation/cancel events (DONE)
3. ✅ Payment events (DONE)
4. 🔄 **Update Partner notifications ke unified API**
5. 🔄 **Add trip assignment events**
6. 🔄 **Add wallet transaction events**

### Medium Priority (P1)
7. Integrate real-time hooks di package detail
8. Integrate real-time hooks di trip detail
9. Integrate real-time hooks di wallet pages
10. Add booking update events

### Low Priority (P2)
11. Create sample data untuk testing
12. Create notifications pages untuk Customer/Admin/Corporate
13. Add package availability change events

---

## Implementation Plan

### Phase 1: Critical Events (P0)
- [ ] Update Partner notifications ke unified API
- [ ] Add trip.assigned events
- [ ] Add trip.status_changed events
- [ ] Add wallet.balance_changed events

### Phase 2: Real-time Integration (P1)
- [ ] Integrate useAvailabilityRealtime di package detail
- [ ] Integrate useTripRealtime di trip detail
- [ ] Integrate useWalletRealtime di wallet pages
- [ ] Add booking.updated events

### Phase 3: Sample Data & Testing (P2)
- [ ] Create sample data migration
- [ ] Test semua integrations
- [ ] Create notifications pages untuk apps lain

---

## Notes

- Unified notifications sudah terintegrasi di Guide app, bisa jadi reference
- Real-time hooks sudah tersedia, tinggal integrate di components
- Event handlers sudah ter-initialize, tinggal add event emissions di API endpoints
- Sample data penting untuk testing UI dan integrations

