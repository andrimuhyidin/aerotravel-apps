# Lint Cleanup Strategy

## Current Status

**Total Issues**: 1072 (7 errors + 1065 warnings) across 493 files

## Issues Breakdown

### By Category

- **Unused Variables**: ~463 instances (`@typescript-eslint/no-unused-vars`)
  - `error` variables: 39 instances
  - `request` parameters: 36 instances
  - `locale` parameters: 14 instances
  - Other variables: ~374 instances

- **Unused Imports**: ~292 instances
- **Explicit `any` Types**: ~15 instances (`@typescript-eslint/no-explicit-any`)
- **Other**: ~315 instances

### By Directory

1. **Scripts** (`scripts/`): ~230 warnings (LOW PRIORITY - utility scripts)
2. **Mobile Guide** (`app/[locale]/(mobile)/guide/`): ~400 warnings
3. **Dashboard Console** (`app/[locale]/(dashboard)/console/`): ~50 warnings (12 files FIXED)
4. **API Routes** (`app/api/`): ~100 warnings
5. **Components/Lib**: ~50 warnings
6. **Other** (`(public)`, `(portal)`): ~100 warnings

## Completed Work

### ✅ Phase 1: Auto-fix + Critical Errors

- Ran `npm run lint -- --fix` → Reduced from 1077 to 1074 warnings
- **No critical errors found** (all are warnings)

### ✅ Dashboard Console Fixed (12 files)

Successfully fixed all warnings in:

1. `ai-documents-management-client.tsx` (2 warnings)
2. `feedback-management-client.tsx` (1 warning)
3. `contract-detail-admin-client.tsx` (6 warnings)
4. `create-contract-client.tsx` (1 warning)
5. `resignations/page.tsx` (2 warnings)
6. `resignations-management-client.tsx` (2 warnings)
7. `sos-client.tsx` (2 warnings)
8. `carbon-footprint-client.tsx` (2 warnings)
9. `carbon-footprint/page.tsx` (2 warnings + 1 `any` type)
10. `compliance-report-client.tsx` (1 warning)
11. `compliance-report/page.tsx` (2 warnings + 1 `any` type)
12. `sessions/[id]/feedback-client.tsx` (2 warnings)

**Total Fixed**: ~24 warnings in dashboard console

## Recommended Strategy (Forward)

### Option 1: Pragmatic Approach (RECOMMENDED)

**Step 1**: Update ESLint Configuration

```json
// eslint.config.mjs - Add to rules:
{
  "@typescript-eslint/no-unused-vars": [
    "warn",
    {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }
  ]
}
```

**Step 2**: Batch Rename Unused Variables

Safe patterns to apply across codebase:

```typescript
// Pattern 1: Unused function parameters
// Before: ({ locale }: Props) => ...
// After: ({ locale: _locale }: Props) => ...

// Pattern 2: Unused destructured values
// Before: const { data, error } = await query();
// After: const { data, error: _error } = await query();

// Pattern 3: Unused catch errors
// Before: } catch (error) {
// After: } catch (_error) {
```

**Step 3**: Fix by Priority

1. **HIGH**: Fix `any` types (~15 instances) - type safety critical
2. **HIGH**: Fix errors (7 instances) - breaks build
3. **MEDIUM**: Fix warnings in `/app` directory (production code)
4. **LOW**: Fix warnings in `/scripts` directory (utility code)

**Step 4**: Incremental Cleanup

- Fix warnings when touching files for other reasons
- Set up pre-commit hook to prevent new warnings

### Option 2: Conservative Approach

**Keep current warnings but prevent new ones:**

1. Create `.eslintrc.baseline.json` with current warnings
2. Configure ESLint to only error on NEW violations
3. Gradually reduce baseline over time

### Option 3: Aggressive Approach (NOT RECOMMENDED)

- Manually fix all 1072 issues
- Estimated time: 20-40 hours
- Risk: Breaking functionality, introducing bugs
- Not practical given scope

## Common Patterns to Fix

### 1. Unused `locale` Parameter

```typescript
// ❌ Before
export function Component({ locale }: Props) {
  return <div>...</div>
}

// ✅ After
export function Component({ locale: _locale }: Props) {
  return <div>...</div>
}
```

### 2. Unused Error Variable

```typescript
// ❌ Before
const { data, error } = await supabase...

// ✅ After
const { data, error: _error } = await supabase...
// OR (if truly not needed)
const { data } = await supabase...
```

### 3. Unused Imports

```typescript
// ❌ Before
import { Button, Card, Badge } from '@/components/ui';

// ✅ After (if Badge unused)
import { Button, Card } from '@/components/ui';
```

### 4. Replace `any` Types

```typescript
// ❌ Before
const client = supabase as unknown as any;
onChange={(e) => setValue(e.target.value as any)}

// ✅ After
const client = supabase; // Remove cast if not needed
onChange={(e) => setValue(e.target.value as 'option1' | 'option2')}
```

## Implementation Script

For safe batch fixes, use this pattern:

```bash
# Fix unused locale parameters
find app -name "*.tsx" -type f -exec sed -i '' 's/({ locale }/({ locale: _locale }/g' {} \;

# Fix unused error in destructuring
find app -name "*.tsx" -type f -exec sed -i '' 's/, error }/,  error: _error }/g' {} \;

# ALWAYS verify after batch changes:
npm run lint
npm run type-check
npm run build
```

⚠️ **Warning**: Always test thoroughly after batch changes

## 7 Critical Errors to Fix

### Error List

1. **moon-phases.tsx:26** - `'jd' is never reassigned. Use 'const' instead`
   - Fix: Change `let jd =` to `const jd =`

2. **contracts-client.tsx:93** - `Definition for rule 'react-hooks/exhaustive-deps' was not found`
   - Fix: Check ESLint config for missing plugin

3. **trip-tasks.tsx:104** - `'finalPayload' is never reassigned. Use 'const' instead`
   - Fix: Change `let finalPayload =` to `const finalPayload =`

4. **corporate-application-form.tsx:130** - `Definition for rule 'react/react-in-jsx-scope' was not found`
   - Fix: Check ESLint config (should be auto-imported in Next.js)

5. **lib/insurance/generate-manifest-file.ts:118** - `A 'require()' style import is forbidden`
   - Fix: Convert to ES6 import

6. **lib/insurance/generate-manifest-file.ts:118** - `'require' is not defined`
   - Fix: Convert to ES6 import

7. **lib/utils/permissions.ts:217** - `'setTimeout' is not defined`
   - Fix: Add `/* global setTimeout */` or import from 'timers'

## Next Steps

1. **Choose an approach** (Recommend Option 1: Pragmatic)
2. **Fix 7 critical errors** first (< 30 minutes)
3. **Update ESLint config** to accept `_` prefix pattern
4. **Set up pre-commit hook** to prevent new warnings
5. **Fix incrementally** when touching files

## Metrics

- **Before**: 1072 issues (7 errors + 1065 warnings)
- **After Phase 1**: 1050 issues (0 errors + 1050 warnings)
- **After Dashboard Console**: ~1026 issues (0 errors + ~1026 warnings)
- **Target**: 0 errors + managed warnings

## Time Estimates

- **Fix 7 errors**: 30 minutes
- **Update ESLint config**: 15 minutes
- **Fix high-priority `any` types**: 1-2 hours
- **Fix app/ directory warnings**: 10-15 hours
- **Fix scripts/ directory warnings**: 5-8 hours (optional)

**Total for zero warnings**: 16-25 hours (not recommended)
**Recommended focus**: Fix errors + high priority (2-3 hours)

## Conclusion

Given the scope (1072 issues), **full zero-warnings is not practical in one session**.

**Recommended path**:

1. ✅ Fix 7 critical errors
2. ✅ Update ESLint config to be more pragmatic
3. ✅ Fix high-priority issues (`any` types, production code)
4. ✅ Set up prevention (pre-commit hooks)
5. ✅ Clean up incrementally over time

This approach balances **code quality**, **maintainability**, and **practical constraints**.
