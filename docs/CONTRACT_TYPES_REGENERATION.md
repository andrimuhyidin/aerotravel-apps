# Contract Types Regeneration - Quick Guide

**Tanggal**: 2025-01-21  
**Purpose**: Regenerate database types untuk include `guide_contract_resignations` dan `guide_contract_sanctions`

---

## 🚀 Quick Start

### Option 1: Using Script (Recommended)

```bash
# Run the regeneration script
pnpm update-types:contracts
```

Script ini akan:
- ✅ Check environment variables
- ✅ Generate types automatically
- ✅ Verify tables are included
- ✅ Provide next steps

### Option 2: Manual Command

```bash
# Set environment variable first
export SUPABASE_PROJECT_ID=your-project-id
# OR
export SUPABASE_ACCESS_TOKEN=your-access-token

# Run update-types
pnpm update-types
```

---

## 📋 Prerequisites

### 1. Migration Status

Pastikan migration sudah dijalankan:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('guide_contract_resignations', 'guide_contract_sanctions')
ORDER BY table_name;
```

**Expected Output:**
```
guide_contract_resignations
guide_contract_sanctions
```

### 2. Environment Variables

Add to `.env.local`:

```bash
# Option 1: Using Project ID
SUPABASE_PROJECT_ID=your-project-id

# Option 2: Using Access Token (more reliable)
SUPABASE_ACCESS_TOKEN=your-access-token
```

**Get Access Token:**
1. Go to: https://app.supabase.com/account/tokens
2. Create new Personal Access Token
3. Copy and add to `.env.local`

---

## ✅ Verification

### 1. Check Types File

```bash
# Verify tables are in types
grep -i "guide_contract_resignations\|guide_contract_sanctions" types/supabase.ts
```

**Expected Output:**
```typescript
guide_contract_resignations: {
  Row: { ... },
  Insert: { ... },
  Update: { ... }
}
guide_contract_sanctions: {
  Row: { ... },
  Insert: { ... },
  Update: { ... }
}
```

### 2. Type Check

```bash
# Run type check
pnpm type-check
```

Should pass without errors related to contract tables.

### 3. Update Code

After types are regenerated, update code to remove temporary fixes:

**File**: `app/api/guide/contracts/[id]/resignations/route.ts`

**Before:**
```typescript
const client = supabase as unknown as any;
const { data: resignations, error } = await client
  .from('guide_contract_resignations')
```

**After:**
```typescript
const { data: resignations, error } = await supabase
  .from('guide_contract_resignations')
```

---

## 📚 Related Files

- **Migration**: `supabase/migrations/20250122000000_042-guide-contract-sanctions-resign.sql`
- **Documentation**: `docs/REGENERATE_TYPES_GUIDE.md` (detailed guide)
- **Script**: `scripts/regenerate-contract-types.sh`

---

## 🎯 Summary

1. ✅ Migration executed → Tables exist
2. ✅ Environment variables set → PROJECT_ID or ACCESS_TOKEN
3. ✅ Types regenerated → `pnpm update-types:contracts` or `pnpm update-types`
4. ✅ Verified → Tables in types file
5. ✅ Code updated → Remove `as unknown as any` fixes

---

**Status**: Ready for regeneration  
**Last Updated**: 2025-01-21
