# Guide Apps Data Integration & Correlation Fix

**Tanggal:** 2025-01-29  
**Status:** ✅ Implemented

---

## Overview

Implementasi perbaikan untuk mengatasi inkonsistensi data antara completed trips, earnings, dan analytics di Guide Apps. Masalah utama yang diperbaiki:

1. Payment processing tidak guaranteed (async call bisa gagal)
2. Date field inconsistency (analytics pakai `created_at` transaction, trips pakai `check_out_at`)
3. Tidak ada automatic backfill untuk missing payments
4. Tidak ada consistency checks untuk monitoring

---

## Architecture Changes

### Before Fix

```
trips → trip_guides (check_out_at) → processTripPayment() [ASYNC, bisa gagal]
  → guide_wallet_transactions (created_at) → guide_wallets (balance)
  → Analytics/Stats [inconsistent date fields]
```

### After Fix

```
trips → trip_guides (check_out_at) → DB TRIGGER [GUARANTEED]
  → guide_wallet_transactions (created_at = check_out_at) → guide_wallets (balance)
  → Analytics/Stats [consistent menggunakan check_out_at]
  → Cron Job [backfill missing payments]
  → Consistency Check API [monitoring]
```

---

## Database Trigger: Auto-Process Payment

**File:** `supabase/migrations/20250129000001_070-auto-process-trip-payment-trigger.sql`

### Overview

Database trigger yang otomatis membuat wallet transaction saat `check_out_at` di-set untuk pertama kali. Ini memastikan semua completed trips mendapat payment transaction.

### Key Features

- **Trigger:** `AFTER UPDATE` pada `trip_guides`
- **Condition:** `OLD.check_out_at IS NULL AND NEW.check_out_at IS NOT NULL`
- **Duplicate Check:** Cek apakah payment sudah ada sebelum membuat baru
- **Date Consistency:** Menggunakan `check_out_at` sebagai `created_at` transaction
- **Master Contract Linking:** Otomatis link payment ke master contract jika ada
- **Error Handling:** Graceful error handling dengan logging

### Function: `auto_process_trip_payment()`

```sql
CREATE OR REPLACE FUNCTION auto_process_trip_payment()
RETURNS TRIGGER AS $$
  -- Validates fee_amount
  -- Checks for existing payment
  -- Gets or creates wallet
  -- Creates transaction with check_out_at as created_at
  -- Links to master contract (optional)
  -- Updates contract_trips status (optional)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Usage

Trigger otomatis aktif setelah migration. Tidak perlu manual intervention. Setiap kali `check_out_at` di-set pada `trip_guides`, trigger akan:

1. Validasi `fee_amount` > 0
2. Cek apakah payment sudah ada (prevent duplicates)
3. Get or create wallet untuk guide
4. Create transaction dengan `created_at = check_out_at`
5. Link ke master contract (jika ada)
6. Update `contract_trips` status (jika ada)

---

## Cron Job: Backfill Missing Payments

**File:** `supabase/migrations/20250129000002_071-backfill-missing-payments-cron.sql`

### Overview

Database function dan cron job untuk memproses payment yang terlewat dari trips yang sudah completed tapi belum ada transaction. Ini diperlukan untuk memperbaiki historical data sebelum trigger aktif.

### Function: `process_missing_trip_payments()`

- **Batch Processing:** Limit 100 trips per run
- **Time Window:** Hanya proses trips completed > 1 hour ago (avoid race conditions)
- **Date Consistency:** Menggunakan `check_out_at` sebagai `created_at`
- **Error Handling:** Continue processing even if individual trip fails

### Cron Schedule

```sql
-- Schedule every hour
SELECT cron.schedule(
  'backfill-missing-trip-payments',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT process_missing_trip_payments();$$
);
```

**Note:** Cron schedule di-comment di migration file. Uncomment dan enable setelah migration berjalan.

---

## Balance Consistency Check Functions

**File:** `supabase/migrations/20250129000003_072-wallet-balance-consistency-check.sql`

### Functions

1. **`check_wallet_balance_consistency()`**
   - Check semua wallets untuk balance inconsistencies
   - Compare calculated balance dengan actual balance
   - Return wallets dengan mismatches

2. **`fix_wallet_balance(wallet_id UUID)`**
   - Fix balance untuk specific wallet
   - Recalculate dari transactions
   - Update wallet balance

3. **`fix_all_wallet_balances()`**
   - Fix all wallets dengan inconsistencies
   - Batch processing

---

## Consistency Check API Endpoint

**File:** `app/api/admin/guide/data-consistency/route.ts`

### Endpoint

- **GET** `/api/admin/guide/data-consistency` - Check dan return inconsistencies

### Checks Performed

1. **Completed trips without payment**
   - Trips dengan `check_out_at` tapi belum ada transaction
   - Critical issue

2. **Payments without completed trip**
   - Transactions yang reference trip tanpa `check_out_at`
   - Orphan payments

3. **Balance mismatches**
   - Wallet balance != calculated balance dari transactions
   - Critical issue

4. **Date inconsistencies**
   - Transaction `created_at` berbeda > 24 jam dari `check_out_at`
   - Minor issue (data quality)

### Response Format

```json
{
  "status": "ok" | "issues_found",
  "checks": {
    "missingPayments": {
      "count": 0,
      "trips": []
    },
    "orphanPayments": {
      "count": 0,
      "transactions": []
    },
    "balanceMismatches": {
      "count": 0,
      "wallets": []
    },
    "dateInconsistencies": {
      "count": 0,
      "items": []
    }
  },
  "summary": {
    "totalIssues": 0,
    "criticalIssues": 0
  }
}
```

---

## Date Field Consistency Rules

### Rule: Always Use `check_out_at` for Analytics

**Before Fix:**
- Analytics queries menggunakan `transaction.created_at`
- Trip queries menggunakan `trip_guides.check_in_at` atau `check_out_at`
- Inconsistent jika payment diproses di bulan berbeda dari check-out

**After Fix:**
- Semua analytics queries filter berdasarkan `check_out_at` dari `trip_guides`
- Transaction `created_at` = `check_out_at` (dijamin oleh trigger)
- Konsisten across semua queries

### Updated Files

1. **`app/api/guide/wallet/analytics/route.ts`**
   - Today, yesterday, week, month earnings: Filter by `check_out_at`
   - Trends: Filter by `check_out_at`
   - Breakdown: Use `check_out_at` (instead of `check_in_at`)

2. **`app/api/guide/insights/monthly/route.ts`**
   - Total trips: Use `check_out_at`
   - Total income: Filter transactions by trip IDs dengan `check_out_at` in month

3. **`app/api/guide/wallet/tax/route.ts`**
   - Yearly earnings: Filter by `check_out_at`
   - Monthly breakdown: Filter by `check_out_at`

4. **`app/api/guide/wallet/insights/route.ts`**
   - User monthly average: Filter by `check_out_at`
   - Branch average: Filter by `check_out_at`

### Query Pattern

**Old Pattern (Inconsistent):**
```typescript
const { data: earnings } = await client
  .from('guide_wallet_transactions')
  .select('amount')
  .eq('wallet_id', walletId)
  .eq('transaction_type', 'earning')
  .gte('created_at', monthStart.toISOString())
  .lte('created_at', monthEnd.toISOString());
```

**New Pattern (Consistent):**
```typescript
// First, get trip IDs with check_out_at in month
const { data: monthTrips } = await client
  .from('trip_guides')
  .select('trip_id')
  .eq('guide_id', user.id)
  .not('check_out_at', 'is', null)
  .gte('check_out_at', monthStart.toISOString())
  .lte('check_out_at', monthEnd.toISOString());

const monthTripIds = monthTrips?.map((t) => t.trip_id) || [];

// Then, get transactions for those trips
const { data: earnings } = monthTripIds.length > 0
  ? await client
      .from('guide_wallet_transactions')
      .select('amount')
      .eq('wallet_id', walletId)
      .eq('transaction_type', 'earning')
      .eq('reference_type', 'trip')
      .in('reference_id', monthTripIds)
  : { data: [] };
```

---

## Code Updates

### Updated Payment Processing Code

**File:** `lib/guide/contract-payment.ts`

- Added comments bahwa trigger akan handle automatic processing
- Function tetap ada untuk backward compatibility dan manual processing
- Duplicate check tetap ada (trigger juga check, tapi safe untuk manual calls)

**File:** `app/api/guide/trips/[id]/tasks/[taskId]/route.ts`

- Added comments bahwa trigger sudah handle automatic processing
- Async call tetap ada sebagai fallback
- Updated logging untuk indicate bahwa trigger should have processed payment

---

## Migration Order

1. **Phase 1:** Deploy trigger (`20250129000001_070-auto-process-trip-payment-trigger.sql`)
   - Ini akan handle semua trips baru
   - Prevent masalah baru

2. **Phase 5:** Deploy balance check functions (`20250129000003_072-wallet-balance-consistency-check.sql`)
   - Support untuk consistency check API

3. **Phase 2:** Deploy backfill cron job (`20250129000002_071-backfill-missing-payments-cron.sql`)
   - Fix trips lama
   - Enable cron schedule setelah migration

4. **Phase 4:** Deploy consistency check API (`app/api/admin/guide/data-consistency/route.ts`)
   - Monitoring tool

5. **Phase 3:** Update analytics queries (files updated)
   - Fix date consistency

6. **Phase 6:** Update existing code (files updated)
   - Documentation and cleanup

---

## Testing

### Test Trigger

```sql
-- Test trigger dengan update check_out_at
UPDATE trip_guides
SET check_out_at = NOW()
WHERE trip_id = 'some-trip-id'
  AND guide_id = 'some-guide-id'
  AND check_out_at IS NULL;

-- Check if transaction created
SELECT * FROM guide_wallet_transactions
WHERE reference_type = 'trip'
  AND reference_id = 'some-trip-id'
  AND transaction_type = 'earning';
```

### Test Cron Job

```sql
-- Run function manually
SELECT * FROM process_missing_trip_payments();

-- Check results
SELECT * FROM guide_wallet_transactions
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND transaction_type = 'earning';
```

### Test Consistency Check API

```bash
# As admin user
curl -X GET "http://localhost:3000/api/admin/guide/data-consistency" \
  -H "Authorization: Bearer <admin-token>"
```

### Test Analytics Queries

- Test dengan trips yang check-out di akhir bulan (e.g., 31 Jan)
- Pastikan payment (yang dibuat 1 Feb) tidak muncul di analytics Januari
- Pastikan payment muncul di analytics Februari

---

## Monitoring

### Regular Checks

1. **Weekly:** Run consistency check API
2. **Monthly:** Review missing payments count
3. **Quarterly:** Review balance mismatches

### Alerts

Set up alerts untuk:
- Missing payments count > 10
- Balance mismatches count > 5
- Date inconsistencies count > 50

---

## Rollback Plan

Jika ada issues dengan trigger:

```sql
-- Disable trigger
DROP TRIGGER IF EXISTS trigger_auto_process_trip_payment ON trip_guides;

-- Re-enable jika diperlukan
-- (Trigger akan dibuat ulang saat migration di-rollback)
```

---

## Success Criteria

✅ Semua trips dengan `check_out_at` otomatis mendapat payment transaction  
✅ Analytics queries konsisten menggunakan `check_out_at`  
✅ Tidak ada completed trips tanpa payment transaction  
✅ Balance calculations akurat dan konsisten  
✅ Consistency check API berfungsi untuk monitoring  

---

## Related Documentation

- [Guide Apps Comprehensive Analysis](GUIDE_APPS_COMPREHENSIVE_ANALYSIS.md)
- [Wallet Complete](WALLET_COMPLETE.md)
- [Guide Contracts Implementation](GUIDE_CONTRACTS_IMPLEMENTATION_COMPLETE.md)

