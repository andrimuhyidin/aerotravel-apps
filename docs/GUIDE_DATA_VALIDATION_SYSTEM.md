# Guide Apps Data Validation System

**Tanggal:** 2025-01-30  
**Status:** ✅ Implemented & Tested

---

## Overview

Sistem validasi data komprehensif untuk memastikan semua data Guide Apps bekerja dengan baik, benar, dan valid. Sistem ini mencakup validasi data integrity, business rules, relationships, data quality, dan business logic.

---

## Architecture

### Database Functions

**Location:** `supabase/migrations/20250130000001_073-comprehensive-data-validation-functions.sql`

#### Core Validation Functions

1. **`validate_trip_data_integrity(trip_id UUID)`**
   - Validasi data integrity untuk trip tertentu
   - Check foreign keys, required fields, business rules
   - Return: Array of validation issues

2. **`validate_guide_data_integrity(guide_id UUID)`**
   - Validasi data integrity untuk guide tertentu
   - Check profile, wallet, contracts
   - Return: Array of validation issues

3. **`validate_payment_integrity(wallet_id UUID)`**
   - Validasi wallet dan payment transactions
   - Check balance consistency, transaction references
   - Return: Array of validation issues

#### Batch Validation Functions

4. **`validate_all_trips_integrity()`**
   - Validasi semua trips dalam sistem
   - Return: Trips dengan issues (id, code, issues_count, critical_count, warnings_count, issues)

5. **`validate_all_guides_integrity()`**
   - Validasi semua guides dalam sistem
   - Return: Guides dengan issues (id, name, issues_count, critical_count, warnings_count, issues)

### Monitoring & Logging

**Location:** `supabase/migrations/20250130000002_074-validation-monitoring-cron.sql`

6. **`run_daily_validation_check()`**
   - Menjalankan validasi harian untuk semua trips dan guides
   - Menyimpan hasil ke `validation_logs` table
   - Return: Log ID

7. **`get_validation_summary(p_hours INTEGER)`**
   - Get summary validasi untuk N jam terakhir
   - Return: total_runs, last_run_at, total_criticals, total_warnings, needs_attention

### Fix Functions (Optional)

**Location:** `supabase/migrations/20250130000003_075-data-fix-functions.sql`

8. **`fix_orphaned_trip_guides()`**
   - Remove invalid trip_guides assignments

9. **`fix_missing_wallets()`**
   - Create missing wallets untuk guides

10. **`fix_balance_mismatches()`**
    - Recalculate wallet balances

11. **`fix_date_inconsistencies()`**
    - Update transaction dates to match check_out_at

12. **`fix_negative_balances()`**
    - Reset negative balances to 0

13. **`check_missing_payments_count()`**
    - Count trips missing payment transactions

---

## API Endpoints

### Admin Validation API

**Location:** `app/api/admin/guide/data-validation/route.ts`

**Endpoint:** `GET /api/admin/guide/data-validation`

**Query Parameters:**
- `path` (optional): `trips` | `guides` | `payments` | `contracts` | (empty for all)

**Response:**
```typescript
{
  status: 'ok' | 'issues_found',
  summary: {
    totalChecks: number,
    passed: number,
    failed: number,
    warnings: number,
    criticals: number
  },
  results: {
    dataIntegrity: Issue[],
    businessRules: Issue[],
    relationships: Issue[],
    dataQuality: Issue[],
    businessLogic: Issue[]
  },
  issues: Issue[]
}
```

**Authorization:** Requires `super_admin`, `ops_admin`, or `finance_manager` role

### Cron Job API

**Location:** `app/api/cron/guide-data-validation/route.ts`

**Endpoint:** `GET /api/cron/guide-data-validation`

**Headers:**
- `Authorization: Bearer <CRON_SECRET>`

**Response:**
```typescript
{
  success: boolean,
  logId: string,
  status: string,
  summary: {
    totalChecks: number,
    passed: number,
    failed: number,
    warnings: number,
    criticals: number
  },
  needsAttention: boolean,
  runAt: string
}
```

---

## CLI Scripts

### Validate All Data

**Command:** `pnpm validate:guide-data [options]`

**Options:**
- `--all` - Validate all categories (default)
- `--trips` - Validate trips only
- `--guides` - Validate guides only
- `--payments` - Validate payments only
- `--contracts` - Validate contracts only
- `--json` - Output as JSON

**Example:**
```bash
# Validate all
pnpm validate:guide-data --all

# Validate trips only
pnpm validate:guide-data --trips

# Output as JSON
pnpm validate:guide-data --all --json
```

### Validate Specific Guide

**Command:** `pnpm validate:guide <guide-id>`

**Example:**
```bash
pnpm validate:guide 093249c7-4719-4b97-894b-7cd6f2a84372
```

### Test Functions

**Command:** `node scripts/validation/test-validation-functions.mjs`

Tests all validation functions to ensure they work correctly.

---

## Validation Categories

### 1. Data Integrity Checks

- Foreign key validity
- Required fields populated
- Unique constraints satisfied
- Check constraints satisfied

### 2. Business Rules Validations

- Trip lifecycle rules (start, completion, status transitions)
- Payment processing rules (completed trips must have payments)
- Guide assignment rules (no overlapping assignments)
- Contract rules (no overlapping contracts)

### 3. Relationship Validations

- Trip ↔ Guide relationships
- Trip ↔ Booking relationships
- Guide ↔ Wallet relationships
- Contract ↔ Trip relationships

### 4. Data Quality Checks

- No orphaned records
- No inconsistent data
- No missing required data

### 5. Business Logic Validations

- Date consistency (check_in < check_out, etc.)
- Amount validations (positive amounts, balance >= 0)
- Status consistency (trip status matches guide status)

---

## Validation Severity Levels

- **critical**: Data integrity issues, missing required data, invalid relationships
- **warning**: Data quality issues, inconsistencies that don't break functionality
- **info**: Informational messages, recommendations

---

## Usage Examples

### Manual Validation via CLI

```bash
# Check all data
pnpm validate:guide-data --all

# Check specific guide
pnpm validate:guide <guide-id>

# Test all functions
node scripts/validation/test-validation-functions.mjs
```

### Programmatic Validation via API

```typescript
// Get validation results
const response = await fetch('/api/admin/guide/data-validation?path=trips');
const data = await response.json();

console.log('Issues found:', data.issues.length);
console.log('Critical issues:', data.summary.criticals);
```

### Automated Monitoring

The system includes a cron job function that can be scheduled to run daily:

```sql
-- Enable cron job (uncomment in migration file)
SELECT cron.schedule(
  'daily-validation-check',
  '0 2 * * *',  -- Daily at 02:00 AM
  $$SELECT run_daily_validation_check();$$
);
```

Or via Vercel Cron:
```json
{
  "crons": [{
    "path": "/api/cron/guide-data-validation",
    "schedule": "0 2 * * *"
  }]
}
```

---

## Fixing Issues

### Auto-Fix Functions

⚠️ **Warning:** Fix functions modify data. Review and approve before execution.

```sql
-- Fix missing wallets
SELECT * FROM fix_missing_wallets();

-- Fix balance mismatches
SELECT * FROM fix_balance_mismatches();

-- Fix date inconsistencies
SELECT * FROM fix_date_inconsistencies();

-- Check missing payments count
SELECT check_missing_payments_count();
```

### Manual Fixes

For critical issues, manual review and fixes are recommended:
1. Review validation results
2. Investigate root cause
3. Apply appropriate fix
4. Re-run validation to verify

---

## Monitoring

### Validation Logs

All automated validation runs are logged in `validation_logs` table:

```sql
-- Get latest validation results
SELECT * FROM validation_logs
ORDER BY run_at DESC
LIMIT 10;

-- Get summary for last 24 hours
SELECT * FROM get_validation_summary(24);
```

### Alerting

The cron job API endpoint checks for critical issues and can be extended to send alerts:
- Email notifications
- Slack notifications
- Dashboard alerts

---

## Testing

### Test All Functions

```bash
node scripts/validation/test-validation-functions.mjs
```

Expected output: All 8 tests should pass ✅

### Test Scripts

```bash
# Test validation scripts
pnpm validate:guide-data --all
pnpm validate:guide-data --trips
pnpm validate:guide-data --guides
pnpm validate:guide-data --payments
pnpm validate:guide <guide-id>
```

---

## Troubleshooting

### Common Issues

1. **Function not found error**
   - Ensure migrations are applied: `node scripts/apply-validation-migrations.mjs`
   - Check database connection

2. **No issues found but data seems incorrect**
   - Check validation rules in functions
   - Review severity levels (some issues may be warnings, not critical)

3. **Script errors**
   - Ensure `.env.local` has correct `DATABASE_URL` and Supabase credentials
   - Check Node.js version (>=20.19.0)

---

## Related Documentation

- [Guide Data Integration Fix](./GUIDE_DATA_INTEGRATION_FIX.md) - Previous data consistency fixes
- [Guide Apps Deep Analysis](./GUIDE_APPS_DEEP_ANALYSIS.md) - System architecture

---

## Status

✅ **All functions implemented and tested**  
✅ **All migrations applied successfully**  
✅ **All scripts working correctly**  
✅ **API endpoints ready for use**  
✅ **No errors or issues**

System is **production-ready** 🚀

