# Regenerate Database Types - Guide

**Tanggal**: 2025-01-21  
**Purpose**: Include `guide_contract_resignations` table in TypeScript types

---

## 📋 Overview

Setelah migration `042-guide-contract-sanctions-resign.sql` dijalankan, table `guide_contract_resignations` sudah ada di database. Namun, TypeScript types perlu di-regenerate untuk include table ini.

---

## ✅ Prerequisites

### 1. Migration Status
Pastikan migration sudah dijalankan:
```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'guide_contract_resignations';
```

### 2. Required Environment Variables
```bash
# Option 1: Using Project ID
SUPABASE_PROJECT_ID=your-project-id

# Option 2: Using Access Token (more reliable)
SUPABASE_ACCESS_TOKEN=your-access-token
```

**Get Access Token:**
1. Go to: https://app.supabase.com/account/tokens
2. Create new Personal Access Token
3. Add to `.env.local`:
   ```bash
   SUPABASE_ACCESS_TOKEN=your_token_here
   ```

---

## 🔄 Regenerate Types

### Method 1: Using npm script (Recommended)

```bash
# Set SUPABASE_PROJECT_ID in .env.local first
export SUPABASE_PROJECT_ID=your-project-id

# Or set SUPABASE_ACCESS_TOKEN
export SUPABASE_ACCESS_TOKEN=your-access-token

# Run update-types
pnpm update-types
```

### Method 2: Using Supabase CLI directly

```bash
# Login first (if not already logged in)
npx supabase login

# Generate types using project ID
npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts

# Or if project is linked
npx supabase gen types typescript --linked > types/supabase.ts
```

### Method 3: Using Access Token

```bash
# Set access token
export SUPABASE_ACCESS_TOKEN=your-access-token

# Generate types
npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```

---

## ✅ Verification

### 1. Check Types File

Setelah regenerate, verifikasi bahwa `guide_contract_resignations` ada di types:

```bash
# Check if table is in types
grep -i "guide_contract_resignations" types/supabase.ts
```

**Expected output:**
```typescript
guide_contract_resignations: {
  Row: {
    id: string;
    contract_id: string;
    guide_id: string;
    branch_id: string | null;
    reason: string;
    effective_date: string;
    notice_period_days: number;
    status: string;
    submitted_at: string;
    resolved_at: string | null;
    resolved_by: string | null;
    resolution_notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: { ... };
  Update: { ... };
}
```

### 2. Type Check

```bash
# Run type check to ensure no errors
pnpm type-check
```

### 3. Remove Temporary Fixes

Setelah types ter-regenerate, hapus temporary fixes:

**File**: `app/api/guide/contracts/[id]/resignations/route.ts`

**Before (temporary fix):**
```typescript
const client = supabase as unknown as any;
const { data: resignations, error } = await client
  .from('guide_contract_resignations')
  // ...
```

**After (type-safe):**
```typescript
const { data: resignations, error } = await supabase
  .from('guide_contract_resignations')
  .select('*')
  .eq('contract_id', contractId)
  .eq('guide_id', user.id)
  .order('submitted_at', { ascending: false });
```

---

## 📝 Migration Details

### Table Structure

Table `guide_contract_resignations` memiliki struktur berikut:

```sql
CREATE TABLE guide_contract_resignations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES guide_contracts(id),
  guide_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  reason TEXT NOT NULL,
  effective_date DATE NOT NULL,
  notice_period_days INTEGER DEFAULT 14,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Related Tables

Migration ini juga membuat:
- `guide_contract_sanctions` - Table untuk sanksi kontrak

---

## 🚨 Troubleshooting

### Error: "Project not found"

**Solution:**
1. Verify project ID is correct
2. Check if you have access to the project
3. Try using access token instead

### Error: "Access token invalid"

**Solution:**
1. Generate new access token from Supabase dashboard
2. Update `.env.local` with new token
3. Re-run command

### Error: "Table not found in types"

**Solution:**
1. Verify migration was executed:
   ```sql
   SELECT * FROM guide_contract_resignations LIMIT 1;
   ```
2. If table doesn't exist, run migration:
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or manually execute migration file
   psql -d your_database -f supabase/migrations/20250122000000_042-guide-contract-sanctions-resign.sql
   ```
3. Regenerate types again

### Error: "Permission denied"

**Solution:**
1. Ensure you have proper permissions in Supabase project
2. Check if access token has correct scopes
3. Try using service role key (for local development only)

---

## 📚 Related Documentation

- [Database Types Documentation](./DATABASE_TYPES.md)
- [Migration File](../supabase/migrations/20250122000000_042-guide-contract-sanctions-resign.sql)
- [Contract Feature Evaluation](./CONTRACT_FEATURE_EVALUATION_COMPLETE.md)

---

## ✅ Checklist

- [ ] Migration executed successfully
- [ ] Environment variables set (PROJECT_ID or ACCESS_TOKEN)
- [ ] Types regenerated using `pnpm update-types`
- [ ] Verified `guide_contract_resignations` in types file
- [ ] Type check passes (`pnpm type-check`)
- [ ] Removed temporary `as unknown as any` fixes
- [ ] Code updated to use type-safe queries

---

**Status**: Ready for regeneration  
**Last Updated**: 2025-01-21
