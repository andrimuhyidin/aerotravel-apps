# Guide App - Types Generation Status

**Date:** December 20, 2025  
**Status:** ⚠️ **Partial - Needs Manual Types Generation**

---

## Current Status

### ✅ What's Working
- **Development Mode:** Fully functional
- **Guide App Code:** All errors fixed
- **Minimal Types:** Created for basic functionality

### ⚠️ What's Blocked
- **Production Build:** Failing due to incomplete types
- **Types Generation:** Requires Supabase CLI login

---

## Issue

The `types/supabase.ts` file needs to be generated from your actual Supabase database schema. Currently using minimal types which are insufficient for production build.

### Error
```
Type error: Argument of type '{ is_contract_signed: boolean; contract_signed_at: string; }' 
is not assignable to parameter of type 'never'.
```

---

## Solution

### Option 1: Generate Types Manually (Recommended)

1. **Login to Supabase CLI:**
   ```bash
   npx supabase login
   # Follow the browser login flow
   ```

2. **Generate Types:**
   ```bash
   # Extract project ID from URL
   PROJECT_ID=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'/' -f3 | cut -d'.' -f1)
   
   # Generate types
   npx supabase gen types typescript --project-id $PROJECT_ID > types/supabase.ts
   ```

3. **Or use the npm script:**
   ```bash
   # Set SUPABASE_PROJECT_ID in .env.local first
   npm run update-types
   ```

### Option 2: Use Supabase Dashboard

1. Go to Supabase Dashboard → Your Project
2. Settings → API
3. Copy the "Project ID"
4. Run:
   ```bash
   npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
   ```

---

## After Types Generation

1. **Remove temporary fixes:**
   - Remove `as UsersUpdate` type assertions
   - Remove any `@ts-expect-error` comments

2. **Rebuild:**
   ```bash
   npm run build
   ```

3. **Test Production:**
   ```bash
   npm start
   ```

---

## Current Workaround

For now, development mode works perfectly. Production build is blocked until types are generated.

**Guide App itself is production-ready** - this is just a configuration step.

---

## Files That Need Types

- `hooks/use-permissions.ts`
- `lib/auth/authority-matrix.ts`
- `app/[locale]/(auth)/legal/sign/consent-form.tsx`
- `lib/finance/shadow-pnl.ts`
- And other files using Database types

---

**Next Step:** Generate complete types from Supabase, then rebuild and test production.
