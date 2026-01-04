# Multi-Role System - Quick Setup Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Migrations

**Via Supabase Dashboard (Recommended):**

1. Open: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy & paste content from:
   - `supabase/migrations/20251221000000_029-multi-role-system.sql`
   - `supabase/migrations/20251221000001_030-multi-role-data-migration.sql`
5. Run each migration (click "Run" or press Cmd+Enter)

### Step 2: Generate Types

```bash
pnpm update-types
```

**Note:** Requires `SUPABASE_PROJECT_ID` or `SUPABASE_ACCESS_TOKEN` in `.env.local`

### Step 3: Verify

```bash
# Check TypeScript types
npm run type-check

# Start dev server
pnpm dev
```

## ✅ Verification Checklist

- [ ] Migrations executed successfully
- [ ] Types generated (`types/supabase.ts` updated)
- [ ] No TypeScript errors
- [ ] Can access `/partner` landing page
- [ ] Can access `/console/users/role-applications` (as admin)

## 🎯 Test Features

1. **Role Applications:**
   - Visit `/partner/apply` or `/guide/apply`
   - Submit application form
   - Check admin panel at `/console/users/role-applications`

2. **Role Switching:**
   - Login with user that has multiple roles
   - Use role switcher component (if available)

3. **Public Landing Pages:**
   - `/partner` - Partner landing
   - `/guide` - Guide landing
   - `/corporate` - Corporate landing

## 📝 Migration Files

- `supabase/migrations/20251221000000_029-multi-role-system.sql`
- `supabase/migrations/20251221000001_030-multi-role-data-migration.sql`

## 🐛 Troubleshooting

**Migration fails:**
- Check SQL syntax in Supabase Dashboard
- Verify database connection
- Check for existing tables (migrations use `IF NOT EXISTS`)

**Type generation fails:**
- Ensure `SUPABASE_PROJECT_ID` or `SUPABASE_ACCESS_TOKEN` is set
- Run `npx supabase login` if needed
- Check Supabase CLI is installed: `npm install -g supabase`

