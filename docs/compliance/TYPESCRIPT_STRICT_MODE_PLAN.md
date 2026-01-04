# TypeScript Strict Mode Implementation Plan

## Current Status (as of implementation)

The project has `ignoreBuildErrors: true` in `next.config.mjs` to allow deployment despite TypeScript errors.

## Identified TypeScript Errors

Total errors found: **35+**

### Categories:

1. **Type Conversion Errors** (10+ errors)
   - Supabase query result type mismatches
   - SelectQueryError types incompatible with expected types
   - Example: `app/[locale]/(dashboard)/console/bookings/new/booking-form.tsx:54`

2. **Zod Schema Errors** (4 errors)
   - `required_error` not valid in Zod v4+
   - Enum parameter changes
   - Example: `app/[locale]/(dashboard)/console/compliance/licenses/new/create-license-client.tsx:37`

3. **React Query Type Errors** (10+ errors)
   - ApiResponse wrapper causing type mismatches
   - Query key factory `_def` property access
   - Example: `app/[locale]/(portal)/partner/analytics/clv/clv-dashboard-client.tsx:125`

4. **Recharts Type Errors** (5 errors)
   - Formatter function parameter types
   - PieLabelRenderProps missing properties
   - Example: `app/[locale]/(portal)/corporate/reports/reports-client.tsx:315`

5. **Miscellaneous** (6 errors)
   - Missing type definitions
   - Property access on undefined types
   - Example: `app/[locale]/(mobile)/guide/trips/[slug]/equipment/equipment-predictor-card.tsx:233`

## Action Plan

### Phase 1: Quick Wins (Estimated: 2-4 hours)
- [ ] Fix Zod schema errors (remove `required_error`, update enum syntax)
- [ ] Add missing type definitions (e.g., `Tool` type)
- [ ] Fix Recharts formatter types with proper type guards

### Phase 2: API Response Types (Estimated: 4-6 hours)
- [ ] Unwrap ApiResponse in TanStack Query
- [ ] Update query functions to return data directly, not wrapped
- [ ] Fix query key factory type issues

### Phase 3: Supabase Type Fixes (Estimated: 6-8 hours)
- [ ] Regenerate Supabase types
- [ ] Fix SelectQueryError type assertions
- [ ] Add proper type casting for complex queries
- [ ] Update type imports to match generated types

### Phase 4: Enable Strict Mode (Estimated: 1 hour)
- [ ] Set `ignoreBuildErrors: false` in `next.config.mjs`
- [ ] Add pre-commit hook for type checking
- [ ] Update CI/CD to fail on TypeScript errors
- [ ] Document type-safe patterns in CONTRIBUTING.md

## Estimated Total Time

**Total: 13-19 hours** of focused development work

## Recommendation

**Current Decision**: Keep `ignoreBuildErrors: true` for now to allow deployment.

**Next Steps**:
1. Allocate dedicated sprint for TypeScript cleanup
2. Fix errors by category (Phase 1 → Phase 2 → Phase 3 → Phase 4)
3. Test thoroughly after each phase
4. Once all errors fixed, disable `ignoreBuildErrors`

## Pre-commit Hook

A pre-commit hook has been created at `.husky/pre-commit-typecheck` but is **not activated** to avoid blocking development.

To activate:
```bash
chmod +x .husky/pre-commit-typecheck
mv .husky/pre-commit-typecheck .husky/pre-commit
```

## References

- TypeScript Strict Mode: https://www.typescriptlang.org/tsconfig#strict
- Zod v4 Migration: https://zod.dev/?id=migration-guide
- TanStack Query Types: https://tanstack.com/query/latest/docs/react/typescript

