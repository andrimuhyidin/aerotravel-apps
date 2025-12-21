# Fix Menu Count - 8 Items Including "Lainnya"

## Overview

Memperbaiki jumlah menu di home guide app agar total 8 items (termasuk button "Lainnya"). Saat ini menampilkan 8 menu items + 1 button "Lainnya" = 9 items total, padahal seharusnya 7 menu items + 1 button "Lainnya" = 8 items total.

## Current Issue

**File**: `app/[locale]/(mobile)/guide/widgets/super-app-menu-grid.tsx`

**Problem**:
- Line 223: `return priority.slice(0, 8);` - mengambil 8 menu items
- Line 226: `const hasMoreItems = allItems.length > 8;` - check apakah ada lebih dari 8 items
- Line 258-278: Render 8 menu items
- Line 281-294: Jika `hasMoreItems` true, tambahkan button "Lainnya"

**Result**: Total 9 items di grid (8 menu + 1 button "Lainnya")

## Expected Behavior

- **Total items di grid**: Maksimal 8 items (termasuk button "Lainnya")
- **Jika ada ≤7 menu items**: Tampilkan semua menu items, tidak perlu button "Lainnya"
- **Jika ada >7 menu items**: Tampilkan 7 menu items + 1 button "Lainnya" = total 8 items

## Solution

### Fix 1: Update displayedItems Logic

**Location**: Line 215-224

**Current Code**:
```typescript
const displayedItems = useMemo(() => {
  const priority = [
    ...(categorizedItems.operasional || []).slice(0, 4),
    ...(categorizedItems.finansial || []).slice(0, 2),
    ...(categorizedItems.pengembangan || []).slice(0, 1),
    ...(categorizedItems.dukungan || []).slice(0, 1),
  ];
  return priority.slice(0, 8); // ❌ 8 items
}, [categorizedItems]);

const hasMoreItems = allItems.length > 8;
```

**Fixed Code**:
```typescript
const displayedItems = useMemo(() => {
  const priority = [
    ...(categorizedItems.operasional || []).slice(0, 4),
    ...(categorizedItems.finansial || []).slice(0, 2),
    ...(categorizedItems.pengembangan || []).slice(0, 1),
    ...(categorizedItems.dukungan || []).slice(0, 1),
  ];
  // ✅ Maksimal 7 items (karena button "Lainnya" akan jadi item ke-8)
  return priority.slice(0, 7);
}, [categorizedItems]);

// ✅ Check apakah ada lebih dari 7 items (bukan 8)
const hasMoreItems = allItems.length > 7;
```

### Fix 2: Update Comment

**Location**: Line 215

**Current**:
```typescript
// Get first 8 items untuk ditampilkan di home (prioritaskan operasional dan finansial)
```

**Fixed**:
```typescript
// Get first 7 items untuk ditampilkan di home (prioritaskan operasional dan finansial)
// Button "Lainnya" akan menjadi item ke-8 jika ada lebih dari 7 menu items
```

## Implementation Steps

1. Update `displayedItems` logic: ubah `slice(0, 8)` menjadi `slice(0, 7)`
2. Update `hasMoreItems` check: ubah `allItems.length > 8` menjadi `allItems.length > 7`
3. Update comment untuk menjelaskan logic baru
4. Verify: Test dengan berbagai jumlah menu items (≤7, >7)

## Testing Checklist

- [ ] Jika ada ≤7 menu items: semua menu ditampilkan, tidak ada button "Lainnya"
- [ ] Jika ada >7 menu items: 7 menu items + 1 button "Lainnya" = total 8 items
- [ ] Button "Lainnya" membuka sheet dengan semua menu yang tersisa
- [ ] Grid layout tetap 4 kolom (2 baris x 4 kolom = 8 items)
- [ ] Visual appearance tidak berubah (hanya jumlah items)

## Files to Modify

1. `app/[locale]/(mobile)/guide/widgets/super-app-menu-grid.tsx`
   - Line 215: Update comment
   - Line 223: Change `slice(0, 8)` to `slice(0, 7)`
   - Line 226: Change `allItems.length > 8` to `allItems.length > 7`

