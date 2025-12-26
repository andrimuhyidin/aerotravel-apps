# 🚀 READY TO DEPLOY - Migration & Seeding Guide

**Status:** ✅ **ALL FILES GENERATED**  
**Date:** December 25, 2025

---

## 📦 **Files Generated**

### 1. Combined Migration File
**File:** `supabase/migrations/COMBINED_MIGRATION.sql`  
**Size:** 27.30 KB  
**Lines:** 749  
**Contains:**
- ✅ Package Reviews System (tables, views, triggers)
- ✅ Analytics & Feedback System (tables, functions, RLS)

### 2. Sample Data Seed
**File:** `supabase/migrations/SAMPLE_DATA_SEED.sql`  
**Contains:**
- ✅ 3 A/B Test Experiments (ready to run)
- ✅ 6 Feature Flags (all enabled)
- ✅ ~25 Sample Reviews (with ratings)
- ✅ ~50 Analytics Events (for testing)
- ✅ ~30 Performance Metrics (for charts)

---

## 🎯 **EXECUTION STEPS**

### Step 1: Open Supabase SQL Editor

**URL:** https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new

1. Login ke Supabase Dashboard
2. Pilih project: `mjzukilsgkdqmcusjdut`
3. Navigate ke: **SQL Editor** → **New Query**

---

### Step 2: Run Main Migrations

1. **Open file:** `supabase/migrations/COMBINED_MIGRATION.sql`
2. **Copy ALL content** (Ctrl+A, Ctrl+C)
3. **Paste** ke SQL Editor
4. **Click "Run"** (atau Ctrl+Enter)
5. **Wait** untuk eksekusi (~10-15 detik)
6. **Verify** - Harus muncul pesan sukses hijau ✅

**Expected Output:**
```
✓ CREATE TABLE package_reviews
✓ CREATE TABLE review_helpful_votes
✓ CREATE MATERIALIZED VIEW package_rating_stats
✓ CREATE TABLE feature_analytics_events
✓ CREATE TABLE ab_test_experiments
✓ CREATE TABLE ab_test_assignments
✓ CREATE TABLE performance_metrics
✓ CREATE TABLE user_feedback
✓ CREATE TABLE feature_flags
✓ CREATE FUNCTION get_ab_test_variant
✓ RLS policies created
```

---

### Step 3: Seed Sample Data (Optional but Recommended)

1. **Open file:** `supabase/migrations/SAMPLE_DATA_SEED.sql`
2. **Copy ALL content**
3. **Paste** ke SQL Editor (new query)
4. **Click "Run"**
5. **Wait** untuk seeding (~5-10 detik)
6. **Check output** - Harus muncul summary

**Expected Output:**
```
NOTICE: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTICE: ✅ Sample Data Seeded Successfully!
NOTICE: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTICE:
NOTICE: 📊 Records Created:
NOTICE:    A/B Experiments: 3
NOTICE:    Feature Flags: 6
NOTICE:    Package Reviews: 25
NOTICE:    Analytics Events: 50
NOTICE:    Performance Metrics: 30
NOTICE:
NOTICE: 🎉 Database is ready for testing!
```

---

### Step 4: Verify Tables Created

Run this query untuk verify semua tables berhasil dibuat:

```sql
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'package_reviews',
    'review_helpful_votes',
    'feature_analytics_events',
    'ab_test_experiments',
    'ab_test_assignments',
    'performance_metrics',
    'user_feedback',
    'feature_flags'
  )
ORDER BY tablename;
```

**Expected:** 8 rows returned ✅

---

### Step 5: Verify Materialized Views

```sql
SELECT 
  schemaname,
  matviewname
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname IN (
    'package_rating_stats',
    'feature_usage_stats'
  );
```

**Expected:** 2 rows returned ✅

---

### Step 6: Verify Functions

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_ab_test_variant';
```

**Expected:** 1 row (FUNCTION) ✅

---

### Step 7: Test Data Queries

#### Check Reviews
```sql
SELECT 
  COUNT(*) as total_reviews,
  AVG(overall_rating) as avg_rating
FROM package_reviews
WHERE status = 'approved';
```

#### Check A/B Experiments
```sql
SELECT 
  experiment_name,
  status,
  variants
FROM ab_test_experiments;
```

#### Check Feature Flags
```sql
SELECT 
  flag_name,
  is_enabled,
  rollout_percentage
FROM feature_flags;
```

---

## 🧪 **Testing the Features**

### Test 1: Analytics Tracking

1. Visit: http://localhost:3000/id/partner/packages/[any-package-id]
2. Open Browser DevTools → Console
3. Look for logs like:
   ```
   [Analytics] Page view tracked
   [Analytics] Feature usage tracked: booking_widget
   ```

4. Verify in database:
```sql
SELECT 
  event_name,
  event_category,
  feature_name,
  created_at
FROM feature_analytics_events
ORDER BY created_at DESC
LIMIT 10;
```

---

### Test 2: Feedback Widget

1. Click floating "Feedback" button (bottom-right)
2. Fill form dan submit
3. Verify in database:
```sql
SELECT 
  feedback_type,
  title,
  status,
  created_at
FROM user_feedback
ORDER BY created_at DESC
LIMIT 5;
```

---

### Test 3: A/B Testing

Test dari browser console:
```javascript
// In browser console
const { getABTestingService } = await import('/lib/analytics/ab-testing');
const service = getABTestingService();
const variant = await service.getVariant('package_card_layout');
console.log('My variant:', variant);
```

Verify in database:
```sql
SELECT 
  e.experiment_name,
  a.variant_key,
  COUNT(*) as assignments
FROM ab_test_assignments a
JOIN ab_test_experiments e ON e.id = a.experiment_id
GROUP BY e.experiment_name, a.variant_key;
```

---

### Test 4: Performance Monitoring

1. Reload page: http://localhost:3000/id/partner/packages
2. Wait 10 seconds
3. Check database:
```sql
SELECT 
  page_type,
  lcp,
  fid,
  cls,
  page_load_time,
  created_at
FROM performance_metrics
ORDER BY created_at DESC
LIMIT 10;
```

---

### Test 5: Package Reviews

Check if reviews appear on package detail page:
```sql
SELECT 
  p.name as package_name,
  prs.total_reviews,
  prs.average_rating,
  prs.verified_reviews_count
FROM package_rating_stats prs
JOIN packages p ON p.id = prs.package_id
WHERE prs.total_reviews > 0
ORDER BY prs.average_rating DESC
LIMIT 5;
```

---

### Test 6: Availability API

Test API endpoint:
```bash
curl "http://localhost:3000/api/partner/packages/[package-id]/availability?date=2025-03-15&adult=2"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "packageId": "...",
    "available": true,
    "remainingSlots": 15,
    "maxCapacity": 20,
    "priceInfo": { ... }
  }
}
```

---

## 📊 **Analytics Dashboard Queries**

### Most Used Features (Last 7 Days)
```sql
SELECT 
  feature_name,
  COUNT(*) as uses,
  COUNT(DISTINCT user_id) as unique_users
FROM feature_analytics_events
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND feature_name IS NOT NULL
GROUP BY feature_name
ORDER BY uses DESC
LIMIT 10;
```

### Performance Summary (Last 24 Hours)
```sql
SELECT 
  page_type,
  ROUND(AVG(lcp)::NUMERIC, 2) as avg_lcp,
  ROUND(AVG(fid)::NUMERIC, 2) as avg_fid,
  ROUND(AVG(cls)::NUMERIC, 3) as avg_cls,
  COUNT(*) as samples
FROM performance_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY page_type;
```

### A/B Test Conversion Rates
```sql
SELECT 
  e.experiment_name,
  a.variant_key,
  COUNT(DISTINCT a.user_id) as users,
  COUNT(CASE WHEN ae.event_name = 'ab_test_conversion' THEN 1 END) as conversions,
  ROUND(
    COUNT(CASE WHEN ae.event_name = 'ab_test_conversion' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT a.user_id), 0) * 100, 
    2
  ) as conversion_rate_percent
FROM ab_test_assignments a
JOIN ab_test_experiments e ON e.id = a.experiment_id
LEFT JOIN feature_analytics_events ae ON 
  ae.user_id = a.user_id AND
  ae.properties->>'experimentKey' = e.experiment_key AND
  ae.properties->>'variant' = a.variant_key
GROUP BY e.experiment_name, a.variant_key
ORDER BY e.experiment_name, a.variant_key;
```

### Top Rated Packages
```sql
SELECT 
  p.name,
  prs.total_reviews,
  prs.average_rating,
  prs.rating_5_count,
  prs.rating_4_count,
  prs.verified_reviews_count
FROM package_rating_stats prs
JOIN packages p ON p.id = prs.package_id
WHERE prs.total_reviews >= 3
ORDER BY prs.average_rating DESC, prs.total_reviews DESC
LIMIT 10;
```

---

## 🔧 **Troubleshooting**

### Error: "relation already exists"
**Solution:** Tables sudah ada. Aman untuk skip atau gunakan `DROP TABLE IF EXISTS` sebelum `CREATE TABLE`.

### Error: "permission denied"
**Solution:** Pastikan menggunakan service_role_key, bukan anon_key.

### Error: "function does not exist"
**Solution:** Jalankan migration lengkap, pastikan semua CREATE FUNCTION statements dieksekusi.

### Data tidak muncul di UI
**Solution:**
1. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'package_reviews';`
2. Verify user role: `SELECT role FROM users WHERE id = auth.uid();`
3. Check browser console for errors

---

## 🎉 **Success Criteria**

✅ All 10 tables created  
✅ 2 materialized views created  
✅ 4 database functions created  
✅ RLS policies active  
✅ Sample data seeded (25+ reviews, 3 experiments, 6 feature flags)  
✅ Analytics tracking working  
✅ Feedback button visible  
✅ Performance monitoring active  
✅ API endpoint responding  

---

## 📞 **Next Steps After Migration**

1. ✅ **Test all features** (use testing guide above)
2. ✅ **Monitor analytics** (check dashboard queries)
3. ✅ **Create admin panel** (optional - untuk view analytics)
4. ✅ **Set up alerts** (optional - untuk feedback & performance issues)
5. ✅ **Document workflows** (untuk tim)

---

## 🚀 **READY TO EXECUTE!**

Semua files sudah generated dan siap untuk dieksekusi:

1. **COMBINED_MIGRATION.sql** - Main migrations
2. **SAMPLE_DATA_SEED.sql** - Sample data

**Estimated Time:** 5-10 minutes total  
**Risk Level:** LOW (all migrations use `IF NOT EXISTS`)  
**Rollback:** Not needed (idempotent migrations)

---

**🎯 Start with Step 1 above!**

