# Rencana Perbaikan: Unified Communication System Errors

**Tanggal:** 2025-01-31  
**Status:** 🔴 Errors Detected - Need Fix

---

## Analisa Error

### TypeScript Errors (11 errors)

**File:** `app/[locale]/(mobile)/guide/notifications/notifications-client.tsx`

**Errors:**
1. Line 611: `Declaration or statement expected`
2. Line 612: `Expression expected`
3. Line 618: `Unexpected token. Did you mean '{'>'}' or '&gt;'?`
4. Line 619-620: `Expression expected`
5. Line 628-629: `Unexpected token. Did you mean '{'}'}' or '&rbrace;'?`
6. Line 687-689: Multiple `Unexpected token` errors

**Root Cause:**
1. **Struktur if-else salah:** Ada `else if` setelah `else`, yang tidak valid dalam JavaScript/TypeScript
   - Current: `if` → `else { broadcast }` → `else if { promo }` ❌
   - Should be: `if` → `else if` → `else if` ✅

2. **Function definition di dalam JSX:** Function `getPriorityColor` didefinisikan di dalam return statement, yang tidak valid di React/TypeScript

---

## Rencana Perbaikan

### Fix 1: Perbaiki Struktur If-Else Chain

**Location:** `app/[locale]/(mobile)/guide/notifications/notifications-client.tsx` (line ~525-611)

**Problem:**
```typescript
if (notification.type === 'system') {
  // ... system notification
} else {
  // ... broadcast notification
} else if (notification.type === 'promo') {  // ❌ ERROR: else if after else
  // ... promo notification
}
```

**Solution:**
```typescript
if (notification.type === 'system') {
  // ... system notification
} else if (notification.type === 'broadcast') {
  // ... broadcast notification
} else if (notification.type === 'promo') {
  // ... promo notification
} else {
  return null;
}
```

### Fix 2: Pindahkan Function Definition ke Luar JSX

**Location:** `app/[locale]/(mobile)/guide/notifications/notifications-client.tsx` (line ~618)

**Problem:**
```typescript
} else if (notification.type === 'promo') {
  const p = notification as PromoNotification;
  // ...
  
  // ❌ ERROR: Function definition di dalam JSX return
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      // ...
    }
  };
  
  return (
    // JSX menggunakan getPriorityColor
  );
}
```

**Solution:**
Pindahkan function `getPriorityColor` ke component level (di luar map function), atau gunakan inline function/ternary di dalam JSX.

**Option A: Move to component level**
```typescript
// Di luar map function, di component level
const getPromoPriorityColor = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

// Di dalam map:
} else if (notification.type === 'promo') {
  const p = notification as PromoNotification;
  // ... use getPromoPriorityColor(p.priority)
}
```

**Option B: Inline object lookup (recommended)**
```typescript
} else if (notification.type === 'promo') {
  const p = notification as PromoNotification;
  
  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  } as const;
  
  const priorityColor = priorityColors[p.priority] || 'bg-slate-100 text-slate-700 border-slate-200';
  
  return (
    // JSX menggunakan priorityColor
  );
}
```

---

## Implementation Steps

### Step 1: Fix If-Else Structure

1. Ganti `else { broadcast }` menjadi `else if (notification.type === 'broadcast')`
2. Pastikan semua case ter-cover dengan `else { return null }` di akhir

### Step 2: Fix Function Definition

1. Pilih option (A atau B) - recommended: Option B (inline object lookup)
2. Pindahkan logic `getPriorityColor` sesuai option yang dipilih
3. Update JSX yang menggunakan function tersebut

### Step 3: Verify

1. Run `npm run type-check` - should pass
2. Run `npm run lint` - should pass
3. Manual test: Check notifications page dengan semua type (system, broadcast, promo)

---

## Testing Checklist

- [ ] TypeScript compilation passes
- [ ] No linter errors
- [ ] System notifications display correctly
- [ ] Broadcast notifications display correctly
- [ ] Promo notifications display correctly
- [ ] Filter tabs work correctly (all, system, broadcast, promo)
- [ ] Read status tracking works for promos
- [ ] Promo detail page auto-marks as read

---

## Files to Modify

1. `app/[locale]/(mobile)/guide/notifications/notifications-client.tsx`
   - Fix if-else structure (line ~525-611)
   - Fix function definition (line ~618-629)

---

## Expected Outcome

- ✅ Zero TypeScript errors
- ✅ Zero linter errors
- ✅ All notification types display correctly
- ✅ Code follows React/TypeScript best practices

