# Catalog & Product Browsing - Popularity Migration Guide

## Migration File

**File:** `supabase/migrations/20250125000013_095-package-popularity-view.sql`

## Description

Creates a database view `package_popularity` that aggregates booking statistics per package, including:
- Booking count
- Total revenue
- Total commission
- Last booking date
- Popularity score (calculated metric)

## How to Run

### Method 1: Supabase Dashboard (RECOMMENDED)

1. **Open Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new
   ```

2. **Copy Migration SQL:**
   ```bash
   cat supabase/migrations/20250125000013_095-package-popularity-view.sql
   ```

3. **Paste in SQL Editor** and click **Run**

4. **Verify:**
   ```sql
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public' 
     AND table_name = 'package_popularity';
   ```

### Method 2: psql Command

```bash
# Make sure DATABASE_URL is set in .env.local
psql "$DATABASE_URL" -f supabase/migrations/20250125000013_095-package-popularity-view.sql
```

### Method 3: Using Script

```bash
node scripts/run-catalog-popularity-migration.mjs
```

## After Migration

1. **Update TypeScript Types:**
   ```bash
   npm run update-types
   ```
   (Requires Supabase CLI: `npm install -g supabase`)

2. **Verify View Works:**
   ```sql
   SELECT package_id, booking_count, total_revenue, popularity_score 
   FROM package_popularity 
   LIMIT 5;
   ```

## View Structure

The `package_popularity` view provides:

- `package_id` - UUID of the package
- `booking_count` - Total number of bookings
- `total_revenue` - Sum of booking amounts (paid/confirmed/completed only)
- `total_commission` - Sum of commission (revenue - NTA)
- `last_booking_date` - Most recent booking date
- `popularity_score` - Calculated score based on bookings, revenue, and recency

## Usage in Code

The view is automatically queried by:
- `app/api/partner/packages/route.ts` - Package list API
- `app/api/partner/packages/[id]/route.ts` - Package detail API

Popularity data is included in API responses and displayed in the UI.

## Troubleshooting

### Error: "relation package_popularity does not exist"
- Migration hasn't been run yet
- Run the migration using one of the methods above

### Error: "invalid input value for enum booking_status"
- The migration has been fixed to use only valid enum values
- Make sure you're using the latest migration file

### View returns empty results
- This is normal if there are no bookings yet
- The view will populate as bookings are created

