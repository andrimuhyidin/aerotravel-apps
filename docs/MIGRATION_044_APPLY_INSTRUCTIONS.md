# Migration 044: Multi-Guide Crew Directory - Apply Instructions

## Status
✅ **Migration file ready**: `supabase/migrations/20250123000001_044-multi-guide-crew-directory.sql`  
✅ **All code implementation**: COMPLETE  
✅ **API routes**: COMPLETE  
✅ **Client components**: COMPLETE  

⚠️ **Migration needs to be applied to database**

---

## Quick Apply (Recommended)

### Via Supabase Dashboard SQL Editor

1. **Open SQL Editor**
   - Go to: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Copy Migration SQL**
   ```bash
   # Copy entire content from:
   supabase/migrations/20250123000001_044-multi-guide-crew-directory.sql
   ```

3. **Paste and Execute**
   - Paste the SQL into the editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - Wait for "Success" message

4. **Verify Tables Created**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('trip_crews', 'crew_profiles_public_internal', 'crew_notes', 'crew_audit_logs')
   ORDER BY table_name;
   ```
   
   Should return 4 rows.

---

## After Migration Applied

### 1. Generate TypeScript Types

```bash
pnpm update-types
```

This will update `types/supabase.ts` with new table types.

### 2. Verify Migration

```bash
# Check migration status
npx supabase migration list --linked | grep "044-multi-guide"

# Should show: 20250123000001_044-multi-guide-crew-directory.sql
```

### 3. Test Features

#### Crew Directory
- Navigate to: `/guide/crew/directory`
- Should show crew directory with search & filter

#### Crew Management
- Navigate to any trip detail: `/guide/trips/[slug]`
- Should show "Crew Section" with crew members
- Admin can assign crew members

#### Crew Notes
- In trip detail page
- Should show "Crew Notes" section
- Can create notes for coordination

---

## What This Migration Creates

### Tables
1. **trip_crews** - Crew assignments with role (lead/support)
2. **crew_profiles_public_internal** - Public profiles for directory
3. **crew_notes** - Internal crew notes for coordination
4. **crew_audit_logs** - Audit logs for security

### Functions
1. **update_crew_profile_availability()** - Auto-update availability
2. **sync_crew_profile_from_user()** - Sync profile from users table
3. **log_crew_audit()** - Log audit actions

### Triggers
1. **trigger_update_crew_availability** - Auto-update on guide_status changes
2. **trigger_sync_crew_profile** - Auto-sync on users table changes

### RLS Policies
- Complete RLS policies with branch isolation
- Guides can view crews for assigned trips
- Ops/Admin can manage all assignments
- Branch isolation enforced

---

## Troubleshooting

### Error: "relation already exists"
- Tables already created (partial migration)
- Migration is idempotent (uses `IF NOT EXISTS`)
- Safe to re-run

### Error: "policy already exists"
- Policies already created
- Migration uses `DROP POLICY IF EXISTS` before `CREATE POLICY`
- Safe to re-run

### Error: "trigger already exists"
- Triggers already created
- Migration uses `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`
- Safe to re-run

---

## Next Steps After Migration

1. ✅ Apply migration (via Dashboard)
2. ✅ Generate types: `pnpm update-types`
3. ✅ Test crew directory
4. ✅ Test crew management
5. ✅ Test crew notes
6. ✅ Test permission matrix (Lead vs Support)

---

**Status**: Ready to apply  
**File**: `supabase/migrations/20250123000001_044-multi-guide-crew-directory.sql`  
**Size**: 488 lines  
**Estimated time**: 5-10 seconds
