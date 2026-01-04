# List Error yang Perlu Diperbaiki

**Tanggal:** 2025-12-21  
**Status:** 🔴 **PENDING FIXES**

---

## 🔴 **TYPESCRIPT ERRORS (6 errors)**

### 1. **app/api/admin/trips/reassign-expired/route.ts**
**Error:** `Parameter 'c' implicitly has an 'any' type.`
- **Line:** 250
- **Issue:** Parameter tidak memiliki type annotation
- **Priority:** High
- **Fix:** Tambahkan type annotation untuk parameter `c`

---

### 2. **app/api/guide/quick-actions/route.ts**
**Error:** Type mismatch pada `reduce` function
- **Line:** 66, 74
- **Issue:** 
  - Type incompatibility antara `QuickAction[]` dan database row type
  - Property `description` type mismatch (`string | null` vs `string | undefined`)
  - Property `length` tidak ada pada type yang dihasilkan
- **Priority:** High
- **Fix:** 
  - Fix type mapping dari database row ke `QuickAction`
  - Handle `null` to `undefined` conversion untuk optional fields

---

### 3. **app/error.tsx**
**Error:** Sentry type casting issue
- **Line:** 31
- **Issue:** Type conversion dari `Window` ke `{ Sentry: ... }` tidak aman
- **Priority:** Medium
- **Fix:** Gunakan `unknown` sebagai intermediate type atau proper type guard

---

### 4. **app/global-error.tsx**
**Error:** Sentry type casting issue
- **Line:** 29
- **Issue:** Type conversion dari `Window` ke `{ Sentry: ... }` tidak aman
- **Priority:** Medium
- **Fix:** Gunakan `unknown` sebagai intermediate type atau proper type guard

---

### 5. **components/error-boundary.tsx**
**Error:** Sentry type casting issue
- **Line:** 51
- **Issue:** Type conversion dari `Window` ke `{ Sentry: ... }` tidak aman
- **Priority:** Medium
- **Fix:** Gunakan `unknown` sebagai intermediate type atau proper type guard

---

### 6. **components/guide/guide-error-boundary.tsx**
**Error:** Sentry type casting issue
- **Line:** 44
- **Issue:** Type conversion dari `Window` ke `{ Sentry: ... }` tidak aman
- **Priority:** Medium
- **Fix:** Gunakan `unknown` sebagai intermediate type atau proper type guard

---

## ⚠️ **CODE QUALITY ISSUES (2 issues)**

### 7. **app/[locale]/(mobile)/guide/guide-dashboard-client.tsx**
**Issue:** Menggunakan `console.log` instead of `logger`
- **Line:** 174, 192
- **Issue:** 
  - Development-only logging menggunakan `console.log`
  - Seharusnya menggunakan `logger.debug()` atau `logger.info()`
- **Priority:** Medium
- **Fix:** 
  - Replace `console.log` dengan `logger.debug()` atau `logger.info()`
  - Keep development-only check

---

### 8. **app/[locale]/(mobile)/guide/trips/[slug]/trip-tasks.tsx**
**Issue:** Menggunakan `console.error` instead of `logger`
- **Line:** 88
- **Issue:** Error logging menggunakan `console.error` instead of `logger.error()`
- **Priority:** Medium
- **Fix:** Replace `console.error` dengan `logger.error()`

---

## 📊 **SUMMARY**

### Total Errors: 8
- **TypeScript Errors:** 6 (High: 2, Medium: 4)
- **Code Quality Issues:** 2 (Medium: 2)

### Priority Breakdown:
- **High Priority:** 2 errors
- **Medium Priority:** 6 issues

---

## 🔧 **FIXING STRATEGY**

### Phase 1: TypeScript Errors (High Priority)
1. Fix `app/api/admin/trips/reassign-expired/route.ts` - Add type annotation
2. Fix `app/api/guide/quick-actions/route.ts` - Fix type mapping

### Phase 2: TypeScript Errors (Medium Priority)
3. Fix Sentry type casting di semua error boundaries (4 files)

### Phase 3: Code Quality
4. Replace `console.log` dengan `logger` di guide-dashboard-client.tsx
5. Replace `console.error` dengan `logger` di trip-tasks.tsx

---

## ✅ **EXPECTED OUTCOME**

Setelah semua error diperbaiki:
- ✅ Zero TypeScript errors
- ✅ Zero `console.log/error` usage (semua menggunakan `logger`)
- ✅ Type-safe code throughout
- ✅ Consistent error handling

---

**Next Step:** Mulai perbaikan dari High Priority errors terlebih dahulu.
