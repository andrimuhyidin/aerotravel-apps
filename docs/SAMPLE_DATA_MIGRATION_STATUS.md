# Sample Data Migration Status

## Status: ⚠️ Schema Mismatches Detected

Migration files telah dibuat, namun ada beberapa schema mismatch yang perlu diperbaiki sebelum bisa dijalankan.

## Migration Files Created

1. ✅ `032-comprehensive-guide-sample-data.sql` - Part 1-3 (Foundation, Config, Profile)
2. ✅ `033-guide-sample-data-part4-onboarding-training.sql` - Onboarding & Training
3. ✅ `034-guide-sample-data-part5-contracts.sql` - Contracts
4. ✅ `035-guide-sample-data-part6-trips-bookings.sql` - Trips & Bookings
5. ✅ `036-guide-sample-data-part7-trip-execution.sql` - Trip Execution
6. ✅ `037-guide-sample-data-part8-posttrip.sql` - Post-Trip Data

## Known Schema Mismatches

### 1. `guide_bank_accounts` - Missing `branch_id`
- **File**: `032-comprehensive-guide-sample-data.sql`
- **Fix**: Remove `branch_id` from INSERT statements

### 2. Query returned more than one row
- **File**: `033-guide-sample-data-part4-onboarding-training.sql`
- **Fix**: Use `LIMIT 1` in SELECT INTO queries

### 3. `guide_contract_sanctions` - Missing `reason` column
- **File**: `034-guide-sample-data-part5-contracts.sql`
- **Fix**: Check schema, use correct column name (might be `description` or `notes`)

### 4. `trip_guides` - Missing `status` column
- **File**: `035-guide-sample-data-part6-trips-bookings.sql`
- **Fix**: Check schema, might need to use different column or remove

### 5. `booking_passengers` - Missing `boarding_status`
- **File**: `036-guide-sample-data-part7-trip-execution.sql`
- **Fix**: Check schema, might be different column name or table structure

### 6. Enum `guide_wallet_transaction_type` - Missing `bonus`
- **File**: `037-guide-sample-data-part8-posttrip.sql`
- **Known values**: `earning`, `withdraw_request`, `withdraw_approved`, `withdraw_rejected`, `adjustment`
- **Fix**: Use `adjustment` instead of `bonus` or add comment field

## Recommended Approach

1. **Check actual database schema** first:
   ```sql
   \d guide_bank_accounts
   \d guide_contract_sanctions
   \d trip_guides
   \d booking_passengers
   ```

2. **Fix each migration file** based on actual schema

3. **Test incrementally** - Run one file at a time and fix errors

4. **Use conditional inserts** - Wrap problematic inserts in try-catch or IF EXISTS checks

## Next Steps

1. Run `\d table_name` in psql for each problematic table
2. Update migration files based on actual schema
3. Re-run migration script
4. Verify sample data after successful migration

