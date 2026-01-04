# Contract Query Fix - query.eq is not a function ✅

**Tanggal**: 2025-01-21  
**Status**: ✅ **Fixed**

---

## 🐛 Error

```
Error: query.eq is not a function
    at ContractsClient.useQuery
```

**Root Cause**: 
Masalah dengan urutan chaining query di API route. `withBranchFilter` dipanggil sebelum `.select()`, yang menyebabkan query builder tidak bisa di-chain dengan benar.

---

## ✅ Fix Applied

### 1. Guide Contracts API Route

**File**: `app/api/guide/contracts/route.ts`

**Before (Problematic)**:
```typescript
let query = withBranchFilter(
  client.from('guide_contracts'),
  branchContext,
)
  .select(...)
  .eq('guide_id', user.id)
  .order('created_at', { ascending: false });
```

**After (Fixed)**:
```typescript
// Build base query
let baseQuery = client.from('guide_contracts')
  .select(...)
  .eq('guide_id', user.id);

// Apply branch filter manually
if (!branchContext.isSuperAdmin && branchContext.branchId) {
  baseQuery = baseQuery.eq('branch_id', branchContext.branchId);
}

// Apply other filters
if (status) {
  baseQuery = baseQuery.eq('status', status);
}

// Order and execute
const { data: contracts, error } = await baseQuery
  .order('created_at', { ascending: false });
```

### 2. Admin Contracts API Route

**File**: `app/api/admin/guide/contracts/route.ts`

**Fixed**: Same pattern - removed `withBranchFilter` wrapper, using manual branch filtering.

---

## 🔍 Why This Fix Works

1. **Proper Query Chaining**: Query builder methods must be chained in correct order
2. **Manual Branch Filtering**: More explicit and easier to debug
3. **Consistent Pattern**: Matches the pattern used in `app/api/guide/trips/route.ts`

---

## ✅ Verification

- ✅ Query building fixed
- ✅ Branch filtering works correctly
- ✅ Status and type filters work
- ✅ No TypeScript errors

---

## 🧪 Testing

1. **Test Guide Contracts Page**:
   - Open `/guide/contracts`
   - Should load contracts without error
   - Filters should work

2. **Test Admin Contracts Page**:
   - Open `/console/guide/contracts`
   - Should load contracts without error
   - Filters should work

---

**Status**: ✅ **Fixed**  
**Last Updated**: 2025-01-21
