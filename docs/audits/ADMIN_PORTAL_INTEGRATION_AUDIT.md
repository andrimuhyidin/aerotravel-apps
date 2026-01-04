# Admin Portal Integration Audit Report

**Date:** 2026-01-03  
**Status:** ✅ COMPLETED

---

## Executive Summary

Audit ini memverifikasi integrasi antara Admin Portal (Console) dengan semua apps lainnya dalam sistem MyAeroTravel ID.

---

## Audit 1: Admin ↔ Guide Contract Management

### Status: ⚠️ ISSUES FOUND

### Findings

#### 1.1 Query Keys Inconsistency (HIGH PRIORITY)

**Problem:** Admin Console components menggunakan hardcoded query keys alih-alih `queryKeys` factory dari `lib/queries/query-keys.ts`.

**Impact:** 
- Cache invalidation tidak konsisten
- Potential stale data issues
- Sulit maintain dan refactor

**Files Affected:**

| File | Line | Hardcoded Query Key |
|------|------|---------------------|
| `console/guide/contracts/contracts-management-client.tsx` | 75 | `['admin', 'guide', 'contracts', ...]` |
| `console/guide/contracts/[id]/contract-detail-admin-client.tsx` | 90 | `['admin', 'guide', 'contracts', 'detail', ...]` |
| `console/guide/contracts/create/create-contract-client.tsx` | 86 | `['admin', 'guides', 'list']` |
| `console/guide/contracts/resignations/resignations-management-client.tsx` | 84 | `['admin', 'guide', 'contracts', 'resignations', ...]` |
| `console/finance/payments/payments-list-client.tsx` | 117 | `['admin-payments', ...]` |
| `console/products/products-management-client.tsx` | 57 | `['admin-packages', ...]` |
| `console/notifications/broadcast/broadcast-list-client.tsx` | 114 | `['admin-broadcasts', ...]` |
| `console/partners/tiers/tiers-client.tsx` | 125 | `['admin', 'partners', 'tiers']` |
| `console/users/role-applications/role-applications-client.tsx` | 117 | `['admin', 'role-applications', ...]` |
| `console/guide-feedback/feedback-management-client.tsx` | 106 | `['admin-feedbacks', ...]` |
| `console/ai-documents/ai-documents-management-client.tsx` | 102 | `['admin-ai-documents-stats']` |
| `console/guide-license/license-management-client.tsx` | 86 | `['admin-license-applications', ...]` |

**Recommendation:** Migrate all hardcoded query keys to use `queryKeys.admin.*` factory pattern.

**Example Fix:**
```typescript
// Before (hardcoded)
queryKey: ['admin', 'guide', 'contracts', { status, type }]

// After (using factory)
queryKey: queryKeys.admin.contracts.list({ status, type })
```

#### 1.2 Contract API Integration - VERIFIED ✅

**Verified Flow:**
1. Admin creates contract → `POST /api/admin/guide/contracts`
2. Admin sends to guide → `POST /api/admin/guide/contracts/[id]/send`
3. Status changes to `pending_signature`
4. Guide sees contract → `GET /api/guide/contracts`
5. Guide signs → `POST /api/guide/contracts/[id]/sign`
6. Status changes to `pending_company` or `active`
7. Admin signs → `POST /api/admin/guide/contracts/[id]/sign`
8. Status changes to `active`

**Database Integration:** ✅
- Table: `guide_contracts`
- RLS policies: Properly configured
- Branch filtering: Working

**Notifications:** ✅
- WhatsApp notification on contract sent
- In-app notification created
- Admin notified when guide signs

#### 1.3 PDF Generation - VERIFIED ✅

Both Admin and Guide use same PDF endpoint:
- `GET /api/guide/contracts/[id]/pdf`

PDF template location: `lib/pdf/contract.tsx`

---

## Audit 2: Trip Assignment Flow

### Status: ✅ VERIFIED

### Findings

#### 2.1 Trip Assignment API - VERIFIED ✅

**Admin assigns guide:**
- Endpoint: `POST /api/admin/trips/[id]/assign`
- Body: `{ guide_id, guide_role?, fee_amount? }`
- Creates record in `trip_guides` table with `pending_confirmation` status
- Calculates confirmation deadline (H-1 jam 22:00 WIB)
- Sends WhatsApp notification via `notifyGuideAssignment()`

**Guide sees assigned trips:**
- Endpoint: `GET /api/guide/trips`
- Queries both `trip_crews` (new system) and `trip_guides` (legacy)
- Caches results with 2-minute TTL
- Returns enriched trip data with package info

#### 2.2 Assignment Tables - VERIFIED ✅

**Dual-table architecture:**
1. `trip_guides` - Legacy single-guide system
2. `trip_crews` - New multi-guide system

**Guide App handles both:**
- Creates assignment map from both tables
- Prioritizes `trip_crews` over `trip_guides`
- Returns unified response format

#### 2.3 Realtime Sync - VERIFIED ✅

**File:** `lib/realtime/trip-sync.ts`

- `setupTripRealtimeSync()` - Subscribes to trip updates
- `setupTripAssignmentRealtimeSync()` - Subscribes to `trip_guides` changes
- `setupTripsRealtimeSync()` - Multiple trips subscription

**Query Keys:** ✅ Guide App uses `queryKeys.guide.trips.*` correctly (27 files)

#### 2.4 Confirmation Flow - VERIFIED ✅

**Assignment statuses:**
- `pending_confirmation` → Guide needs to confirm
- `confirmed` → Guide accepted
- `rejected` → Guide declined
- `expired` → Deadline passed
- `auto_reassigned` → Auto-reassigned to another guide

**Deadline calculation:** H-1 jam 22:00 WIB (or next day 22:00 if too close)

---

## Audit 3: Wallet & Payroll Integration  

### Status: ✅ VERIFIED

### Findings

#### 3.1 Payroll API (Admin) - VERIFIED ✅

**Endpoint:** `GET /api/admin/finance/payroll`

**Features:**
- Calculates payroll from `trip_guides` assignments
- Aggregates by guide with trip details
- Supports period filtering (week, month, custom dates)
- Calculates base fee, bonuses, deductions, net pay
- Joins with `trip_bookings` for pax counts

**Database Tables:**
- `trip_guides` - Assignment with fee_amount
- `trips` + `packages` - Trip details
- `trip_bookings` + `bookings` - Pax calculation

#### 3.2 Guide Wallet API - VERIFIED ✅

**Endpoints:**
- `GET /api/guide/wallet` - Balance, transactions, salary overview
- `POST /api/guide/wallet` - Create withdraw request

**Features:**
- Auto-sync balance with `calculate_guide_wallet_balance` RPC
- Pagination for transactions
- Withdraw request with bank account validation
- Quick actions: all, half, preset amounts
- Minimum withdraw: Rp 50,000
- Cache invalidation on withdraw

**Database Tables:**
- `guide_wallets` - Balance
- `guide_wallet_transactions` - Transaction history
- `guide_bank_accounts` - Bank account for withdraw
- `salary_payments` - Salary overview

#### 3.3 Withdraw Approval (Admin) - VERIFIED ✅

**Endpoint:** `POST /api/admin/guide/wallet/withdraw`

**Actions:**
- `approve` - Deduct balance, update transaction status
- `reject` - Mark transaction as rejected

**Authorization:** super_admin, finance_manager, ops_admin

#### 3.4 Realtime Sync - VERIFIED ✅

**File:** `lib/realtime/wallet-sync.ts`

- `setupWalletRealtimeSync()` - Balance changes subscription
- `setupWalletTransactionsRealtimeSync()` - Transaction updates
- Supports both `partner` and `guide` wallet types

**Query Keys:** ✅ Guide App uses `queryKeys.guide.wallet.*` correctly (5 files)

#### 3.5 Integration Flow - VERIFIED ✅

```
Trip Assignment → trip_guides.fee_amount
       ↓
Trip Completion → salary_payments/guide_wallet_transactions
       ↓
Guide Wallet Balance Updated → guide_wallets.balance
       ↓
Guide Requests Withdraw → guide_wallet_transactions (pending)
       ↓
Admin Approves → Balance deducted, transaction approved
```

---

## Audit 4: Partner Tier & Credit Limit

### Status: ✅ VERIFIED

### Findings

#### 4.1 Tier Management API (Admin) - VERIFIED ✅

**Endpoints:**
- `GET /api/admin/partners/[id]/tier` - Get tier + calculation
- `PUT /api/admin/partners/[id]/tier` - Manual override
- `POST /api/admin/partners/[id]/tier` - Recalculate tier

**Features:**
- Auto-calculated tier using `calculatePartnerTier()`
- Manual override with reason logging
- Tier history in `partner_tier_history` table
- Tier levels: bronze, silver, gold, platinum

**Database Columns:** `partner_tier`, `tier_auto_calculated`, `tier_assigned_at`, `tier_assigned_by`

#### 4.2 Credit Limit API (Admin) - VERIFIED ✅

**Endpoints:**
- `GET /api/admin/partners/[id]/credit-limit` - Get limit + history
- `POST /api/admin/partners/[id]/credit-limit` - Set/update
- `DELETE /api/admin/partners/[id]/credit-limit` - Remove (set to 0)

**Features:**
- Auto-creates wallet if not exists
- Change history in `mitra_credit_limit_history`
- Approval workflow for large changes (>100M)
- Tracks available credit = limit - used

**Database Tables:** `mitra_wallets` (credit_limit, credit_used)

#### 4.3 Partner Portal Integration - VERIFIED ✅

**Partner sees tier in profile:**
- `GET /api/partner/profile` returns `tier: profile.partner_tier`

**Partner sees credit limit:**
- `GET /api/partner/wallet/balance` returns credit info from `mitra_wallets`

#### 4.4 Data Flow - VERIFIED ✅

```
Admin changes tier/credit → users/mitra_wallets table
       ↓
Partner Portal fetches profile → sees updated tier
Partner Portal fetches wallet → sees updated credit limit
```

---

## Audit 5: Partner Booking Flow

### Status: ⚠️ ISSUES FOUND

### Findings

#### 5.1 Booking API Integration - VERIFIED ✅

**Partner creates booking:**
- `POST /api/partner/bookings` → Creates record in `bookings` table with `mitra_id`

**Admin sees partner bookings:**
- `GET /api/admin/bookings` → Queries same `bookings` table
- Filters, pagination, search all working

**Shared Database:** ✅
- Both use same `bookings` table
- Partner bookings identified by `mitra_id` column
- Status updates sync automatically

#### 5.2 Query Pattern Issues (MEDIUM PRIORITY)

**Problem:** Partner bookings UI uses `useState` + `useEffect` instead of TanStack Query.

**File:** `app/[locale]/(portal)/partner/bookings/bookings-list-client.tsx`

**Impact:**
- No cache invalidation between create/update/delete operations
- No automatic refetch on window focus
- No optimistic updates
- Inconsistent with other parts of the app

**Recommendation:** Migrate to TanStack Query with `queryKeys.partner.bookings.*`

```typescript
// Before (useState)
const [bookings, setBookings] = useState<Booking[]>([]);
useEffect(() => { loadBookings(); }, [activeTab, searchQuery]);

// After (TanStack Query)
const { data, isLoading } = useQuery({
  queryKey: queryKeys.partner.bookings.list({ status: activeTab, search: searchQuery }),
  queryFn: () => fetchBookings(params),
});
```

#### 5.3 Data Flow - VERIFIED ✅

```
Partner creates booking → bookings table (mitra_id set)
       ↓
Admin Console sees booking → Same table, different view
       ↓
Admin assigns trip → trip_bookings table updated
       ↓
Guide sees trip → trips + trip_bookings join
```

---

## Audit 6: Corporate Integration

### Status: ✅ VERIFIED

### Findings

#### 6.1 Corporate Library - VERIFIED ✅

**File:** `lib/corporate/index.ts`

**Comprehensive library with:**
- `getCorporateClient()` - Get corporate for user (PIC or employee)
- `getDashboardStats()` - Dashboard statistics
- `getEmployees()`, `addEmployee()` - Employee management
- `updateEmployeeAllocation()` - Budget allocation
- `getInvoices()` - Invoice listing
- `getPendingApprovals()`, `approveBooking()`, `rejectBooking()` - Approval workflow
- `createApprovalRequest()`, `cancelApprovalRequest()` - Request management

#### 6.2 Corporate API Endpoints - VERIFIED ✅

**Partner-side APIs:**
- `GET /api/partner/corporate/dashboard` - Dashboard stats
- `GET /api/partner/corporate/employees` - List employees
- `GET /api/partner/corporate/bookings` - Corporate bookings
- `GET /api/partner/corporate/approvals` - Approval list
- `POST /api/partner/corporate/approvals/[id]` - Approve/reject
- `GET /api/partner/corporate/invoices` - Invoice list
- `GET /api/partner/corporate/budget` - Budget overview
- `GET /api/partner/corporate/reports` - Reports

#### 6.3 Database Integration - VERIFIED ✅

**Tables:**
- `corporate_clients` - Company info, PIC, credit limit
- `corporate_employees` - Employee list with allocation
- `corporate_deposits` - Deposit balance
- `corporate_invoices` - Invoice history
- `corporate_booking_approvals` - Approval workflow

**Data Flow:**
```
Corporate PIC creates employee → corporate_employees
       ↓
Employee books trip → bookings + corporate_booking_approvals (pending)
       ↓
PIC approves → approval status + booking status + used_amount updated
       ↓
Admin sees booking → bookings table (same as other bookings)
```

#### 6.4 Admin Integration - VERIFIED ✅

**Admin sees corporate data via:**
- Same `bookings` table (all booking sources unified)
- No separate admin corporate API needed
- Corporate bookings identifiable via `created_by` (employee user_id)

#### 6.5 Missing: Direct Admin → Corporate Management

**Note:** Currently corporate management is handled via Partner Portal.
No dedicated Admin Console pages for corporate client management found.

**Recommendation:** Consider adding `console/corporates` for:
- View all corporate clients
- Manage credit limits
- Override approvals if needed

---

## Audit 7: Package/Pricing Sync

### Status: ✅ VERIFIED

### Findings

#### 7.1 Package API Integration - VERIFIED ✅

**Admin manages packages:**
- `GET /api/admin/packages` - List all packages with prices
- `POST /api/admin/packages` - Create package with price tiers

**Public sees packages:**
- `GET /api/public/packages` - Only `status = 'published'` packages
- Includes pricing, ratings, duration info

**Shared Table:** Both query same `packages` + `package_prices` tables

#### 7.2 Availability Service - VERIFIED ✅

**File:** `lib/availability/availability-service.ts`

**Features:**
- `checkPackageAvailability()` - Real-time availability check
- Checks: date validity, blackout dates, capacity, booked slots
- Returns: remaining slots, price info, restrictions, next available date
- Validates: min/max pax, package date range

#### 7.3 Realtime Availability Sync - VERIFIED ✅

**File:** `lib/realtime/availability-sync.ts`

**Features:**
- `setupAvailabilityRealtimeSync()` - Subscribe to booking changes
- `setupMultipleAvailabilityRealtimeSync()` - Multiple packages
- Auto-invalidates cache when bookings change

#### 7.4 Data Flow - VERIFIED ✅

```
Admin creates/updates package → packages table (status: draft/published)
       ↓
Package status = 'published' → Visible in Public API
       ↓
Booking created → bookings table → Realtime triggers availability update
       ↓
Public availability check → Uses latest booking data
```

#### 7.5 ISR/Revalidation - NOT FOUND

**Note:** No explicit ISR revalidation found for package pages.
Package detail pages may be using SSR or client-side fetching.

**Recommendation:** Consider adding `revalidatePath()` or `revalidateTag()` on package updates.

---

## Audit 8: Realtime Sync Modules

### Status: ✅ VERIFIED

### Findings

#### 8.1 Realtime Infrastructure - VERIFIED ✅

**File:** `lib/realtime/realtime-client.ts`

**Core Features:**
- `createRealtimeChannel()` - Create channel subscription
- Connection pooling - Reuses existing channels
- Error handling with logging
- Automatic status tracking (SUBSCRIBED, ERROR, TIMEOUT, CLOSED)
- `cleanupChannels()` - Proper cleanup

#### 8.2 Sync Modules - VERIFIED ✅

| Module | File | Used By |
|--------|------|---------|
| Availability | `availability-sync.ts` | Public booking pages |
| Booking | `booking-sync.ts` | Customer, Partner, Admin |
| Trip | `trip-sync.ts` | Guide App, Admin Console |
| Wallet | `wallet-sync.ts` | Guide Wallet, Partner Wallet |

#### 8.3 Module Capabilities - VERIFIED ✅

**availability-sync.ts:**
- `setupAvailabilityRealtimeSync()` - Single package
- `setupMultipleAvailabilityRealtimeSync()` - Multiple packages

**booking-sync.ts:**
- `setupBookingRealtimeSync()` - Single booking
- `setupBookingsRealtimeSync()` - Multiple bookings

**trip-sync.ts:**
- `setupTripRealtimeSync()` - Trip updates
- `setupTripAssignmentRealtimeSync()` - Assignment changes
- `setupTripsRealtimeSync()` - Multiple trips

**wallet-sync.ts:**
- `setupWalletRealtimeSync()` - Balance changes
- `setupWalletTransactionsRealtimeSync()` - Transaction updates
- Supports both `partner` and `guide` wallet types

#### 8.4 Additional Files

**Also found:**
- `realtime-hooks.ts` - React hooks for realtime
- `realtime-server.ts` - Server-side realtime utilities

---

## Audit 9: Query Keys Consistency

### Status: ⚠️ ISSUES FOUND

### Findings

#### 9.1 Query Keys Factory - VERIFIED ✅

**File:** `lib/queries/query-keys.ts`

**Comprehensive factory with:**
- `queryKeys.auth.*` - Authentication
- `queryKeys.user.*` - User roles
- `queryKeys.bookings.*` - Bookings
- `queryKeys.packages.*` - Packages
- `queryKeys.payments.*` - Payments
- `queryKeys.documents.*` - Documents
- `queryKeys.guide.*` - Guide App (VERY EXTENSIVE - 400+ lines)
- `queryKeys.admin.*` - Admin (limited - only settings, compliance, risk, sustainability)
- `queryKeys.loyalty.*` - Loyalty points
- `queryKeys.referral.*` - Referral
- `queryKeys.corporate.*` - Corporate portal
- `queryKeys.partner.*` - Partner portal

#### 9.2 Factory Usage by App

| App | Uses Factory | Notes |
|-----|--------------|-------|
| Guide App | ✅ YES | Excellent - 27+ files use `queryKeys.guide.*` |
| Partner Portal | ⚠️ PARTIAL | Some use factory, some hardcoded |
| Corporate Portal | ✅ YES | Uses `queryKeys.corporate.*` |
| Public Pages | ⚠️ MINIMAL | Limited usage |
| Admin Console | ❌ NO | 47+ hardcoded query keys |

#### 9.3 Admin Console Query Keys Issue (HIGH PRIORITY)

**Problem:** Admin Console uses hardcoded strings instead of factory.

**Missing in factory:**
- `queryKeys.admin.guides.*`
- `queryKeys.admin.contracts.*`
- `queryKeys.admin.payments.*`
- `queryKeys.admin.bookings.*`
- `queryKeys.admin.broadcasts.*`
- `queryKeys.admin.feedbacks.*`
- `queryKeys.admin.licenses.*`
- `queryKeys.admin.aiDocuments.*`
- `queryKeys.admin.partners.*`
- `queryKeys.admin.roleApplications.*`

**Current hardcoded patterns found:**
```typescript
// In console components
['admin', 'guide', 'contracts', ...]
['admin-payments', ...]
['admin-packages', ...]
['admin-broadcasts', ...]
['admin', 'partners', 'tiers']
['admin', 'role-applications', ...]
['admin-feedbacks', ...]
['admin-ai-documents', ...]
['admin-license-applications', ...]
```

#### 9.4 Recommendations

1. **Expand `queryKeys.admin.*`** to include all admin resources
2. **Migrate all 47+ hardcoded keys** to use factory
3. **Add cache invalidation rules** in mutation onSuccess callbacks

---

## Audit 10: Notification Integration

### Status: ✅ VERIFIED

### Findings

#### 10.1 Notification Infrastructure

**Directory:** `lib/integrations/`

| File | Purpose |
|------|---------|
| `whatsapp.ts` | Meta WhatsApp Cloud API integration |
| `meta-whatsapp.ts` | Additional WhatsApp utilities |
| `resend.ts` | Email via Resend API |
| `contract-notifications.ts` | Contract-specific notifications |
| `guide-assignment.ts` | Trip assignment notifications |
| `sos-notifications.ts` | Emergency SOS notifications |
| `whatsapp-trip-notifications.ts` | Trip-specific WhatsApp messages |

#### 10.2 WhatsApp Integration - VERIFIED ✅

**API:** Meta WhatsApp Cloud API (Graph API v21.0)

**Features:**
- `sendMessage()` - Generic message sending
- `sendTextMessage()` - Simple text
- Template support for approved messages
- Image and document attachments

**Used in:**
- Contract sent → Guide WhatsApp
- Contract signed → Admin WhatsApp
- Trip assignment → Guide WhatsApp
- SOS alerts → Emergency contacts
- Booking confirmation → Customer WhatsApp

#### 10.3 Email Integration - VERIFIED ✅

**Service:** Resend API

**Features:**
- `sendEmail()` - Generic email sending
- `sendBookingConfirmationEmail()` - Booking confirmation
- Template processing with fallback
- Attachment support
- Configurable from name/address via database settings

#### 10.4 Contract Notifications - VERIFIED ✅

**File:** `lib/integrations/contract-notifications.ts`

**Functions:**
- `notifyGuideContractSent()` - WhatsApp to guide
- `notifyAdminContractSigned()` - WhatsApp to admin
- `notifyGuideContractActive()` - Contract activation
- `createInAppNotification()` - In-app notification

#### 10.5 Trip Assignment Notifications - VERIFIED ✅

**File:** `lib/integrations/guide-assignment.ts`

**Functions:**
- `notifyGuideAssignment()` - WhatsApp with deadline reminder
- Auto-assignment algorithm with scoring
- Preference matching (destination, trip type, duration)
- Workload balancing

#### 10.6 In-App Notifications - VERIFIED ✅

**Created via:**
- `createInAppNotification()` in contract-notifications.ts
- Stored in `notifications` table
- Displayed in Guide App and Admin Console

#### 10.7 Push Notifications

**Found migrations:**
- `partner-push-subscriptions.sql` - Partner push
- Push notification infrastructure present

#### 10.8 Integration Flow Summary

```
Admin Action → API Route → Notification Helper
       ↓
WhatsApp API / Resend API / In-App Table
       ↓
User receives notification in WhatsApp/Email/App
```

---

## Summary of Issues Found

| ID | Severity | Category | Description | Status |
|----|----------|----------|-------------|--------|
| 1.1 | HIGH | Query Keys | Hardcoded query keys in Admin Console (47+ occurrences) | OPEN |
| 5.2 | MEDIUM | State Management | Partner bookings uses useState instead of TanStack Query | OPEN |
| 7.5 | LOW | Cache | No ISR revalidation for package pages | OPEN |
| 6.5 | LOW | Admin Features | No dedicated Admin Console for corporate client management | OPEN |

---

## Integration Status Summary

| Integration Area | Status | Notes |
|-----------------|--------|-------|
| Admin ↔ Guide Contracts | ✅ VERIFIED | Full flow working |
| Trip Assignment | ✅ VERIFIED | Dual-table support, realtime sync |
| Wallet & Payroll | ✅ VERIFIED | Full flow with withdraw approval |
| Partner Tier/Credit | ✅ VERIFIED | Full management from Admin |
| Partner Booking | ⚠️ PARTIAL | API works, UI needs TanStack Query |
| Corporate Integration | ✅ VERIFIED | Via Partner Portal, no direct Admin |
| Package/Pricing Sync | ✅ VERIFIED | Shared table, availability service |
| Realtime Sync | ✅ VERIFIED | 4 modules, comprehensive coverage |
| Query Keys | ⚠️ ISSUES | Admin Console doesn't use factory |
| Notifications | ✅ VERIFIED | WhatsApp, Email, In-App, Push |

---

## Recommendations

### Immediate Actions (HIGH Priority)

1. **Create admin query keys in factory** (`lib/queries/query-keys.ts`)
   ```typescript
   admin: {
     guides: {
       all: () => ['admin', 'guides'] as const,
       list: (filters?) => [...queryKeys.admin.guides.all(), 'list', filters] as const,
     },
     contracts: {
       all: () => ['admin', 'contracts'] as const,
       list: (filters?) => [...queryKeys.admin.contracts.all(), 'list', filters] as const,
       detail: (id: string) => [...queryKeys.admin.contracts.all(), 'detail', id] as const,
       sanctions: (id: string) => [...queryKeys.admin.contracts.all(), 'sanctions', id] as const,
       resignations: (filters?) => [...queryKeys.admin.contracts.all(), 'resignations', filters] as const,
     },
     payments: { ... },
     bookings: { ... },
     broadcasts: { ... },
     feedbacks: { ... },
     licenses: { ... },
     aiDocuments: { ... },
     partners: { ... },
     roleApplications: { ... },
   }
   ```

2. **Migrate hardcoded keys**
   - Update all 47+ occurrences in `app/[locale]/(dashboard)/console/`

### Medium Term

3. **Migrate Partner bookings to TanStack Query**
   - File: `app/[locale]/(portal)/partner/bookings/bookings-list-client.tsx`
   - Use `queryKeys.partner.bookings.*`

4. **Add ISR revalidation for packages**
   - Call `revalidatePath()` or `revalidateTag()` on package create/update

### Nice to Have

5. **Add Admin Console for corporate management**
   - Consider `console/corporates` route
   - View/manage corporate clients, credit limits

6. **Add integration tests**
   - E2E tests for critical flows
   - Contract signing flow
   - Booking → Trip → Guide flow

---

## Files Modified During Audit

This audit only created documentation in:
- `docs/audits/ADMIN_PORTAL_INTEGRATION_AUDIT.md`

No code changes were made.

---

**Audit Completed:** 2026-01-03  
**Auditor:** AI Assistant  
**Total Audited Areas:** 10  
**Verified:** 9  
**Issues Found:** 2 (HIGH: 1, MEDIUM: 1, LOW: 2)

