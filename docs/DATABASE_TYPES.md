# Database Type Generation

## Overview

Supabase database types are auto-generated to keep TypeScript in sync with your database schema.

## Setup

### 1. Install Supabase CLI

```bash
# Global install
npm install -g supabase

# Or use npx
npx supabase
```

### 2. Link Project (Optional)

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### 3. Generate Types

```bash
# Using script (requires SUPABASE_PROJECT_ID env var)
pnpm update-types

# Or using Supabase CLI directly
supabase gen types typescript --project-id <project-id> > types/supabase.ts

# Or if project is linked
supabase gen types typescript --linked > types/supabase.ts
```

## Usage

```tsx
import { Database } from '@/types/supabase';

// Type-safe database queries
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('status', 'confirmed');

// data is typed as Database['public']['Tables']['bookings']['Row'][]
```

## When to Update

Run `pnpm update-types` whenever you:
- Add/modify database tables
- Change column types
- Add new columns
- Modify database schema

## CI/CD Integration

Add to CI pipeline to ensure types are always up-to-date:

```yaml
- name: Check types are up-to-date
  run: |
    pnpm update-types
    git diff --exit-code types/supabase.ts
```

## Benefits

- ✅ Type safety for database queries
- ✅ Auto-complete for table/column names
- ✅ Catch schema mismatches at compile time
- ✅ No manual type definitions

---

**Important:** Never edit `types/supabase.ts` manually. Always regenerate it.

