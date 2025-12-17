# Database Migrations Guide

## Overview

This project uses Supabase PostgreSQL with manual SQL migrations. For production, consider using Supabase CLI or a migration tool.

## Migration Files

Migrations are stored in `scripts/migrations/` directory:

```
scripts/migrations/
├── 001-rls-policies.sql
├── 002-create-tables.sql (example)
└── 003-add-indexes.sql (example)
```

## Running Migrations

### Option 1: Supabase Dashboard

1. Go to Supabase Dashboard > SQL Editor
2. Copy migration SQL
3. Run the SQL script
4. Verify changes

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <project-ref>

# Push migrations
supabase db push

# Or run specific migration
supabase db execute -f scripts/migrations/001-rls-policies.sql
```

### Option 3: psql

```bash
# Connect to database
psql -h <host> -U <user> -d <database>

# Run migration
\i scripts/migrations/001-rls-policies.sql
```

## Migration Best Practices

1. **Version Control:** Always commit migration files to Git
2. **Naming:** Use sequential numbers: `001-`, `002-`, etc.
3. **Idempotency:** Make migrations idempotent (use `IF NOT EXISTS`, `ON CONFLICT`)
4. **Rollback:** Document rollback steps in comments
5. **Testing:** Test migrations on staging before production

## Example Migration Template

```sql
-- Migration: 002-create-tables.sql
-- Description: Create core tables
-- Date: 2025-01-01
-- Author: Development Team

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles with role and branch assignment';
```

## Rollback Strategy

For each migration, document rollback steps:

```sql
-- Rollback: 002-create-tables.sql
-- DROP TABLE IF EXISTS profiles CASCADE;
```

## Migration Checklist

- [ ] Migration file created with sequential number
- [ ] SQL syntax validated
- [ ] Idempotency ensured
- [ ] RLS policies added (if needed)
- [ ] Indexes created for performance
- [ ] Rollback steps documented
- [ ] Tested on local database
- [ ] Reviewed by team
- [ ] Committed to Git

## Production Deployment

1. **Backup:** Always backup database before migration
2. **Staging:** Test migration on staging first
3. **Maintenance Window:** Schedule during low traffic
4. **Monitor:** Watch for errors after deployment
5. **Verify:** Confirm migration success

## Supabase CLI Commands

```bash
# Initialize Supabase locally
supabase init

# Start local Supabase
supabase start

# Create new migration
supabase migration new <migration-name>

# Apply migrations
supabase db push

# Reset database (WARNING: deletes all data)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

