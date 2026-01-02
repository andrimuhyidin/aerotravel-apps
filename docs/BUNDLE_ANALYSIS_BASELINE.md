# Bundle Analysis Baseline

## Analysis Date

2026-01-02

## How to Run Bundle Analyzer

```bash
pnpm analyze
# or
ANALYZE=true pnpm build
```

This will open a browser with the bundle visualization.

## Expected Large Dependencies (To Monitor)

Based on `package.json` analysis, the following are expected to be the largest dependencies:

| Dependency | Expected Size | Notes |
|------------|---------------|-------|
| `@sentry/nextjs` | ~100KB+ | Error tracking, can be lazy loaded |
| `@react-pdf/renderer` | ~200KB+ | PDF generation, should be code-split |
| `recharts` | ~150KB+ | Charts, should be code-split |
| `leaflet` + `react-leaflet` | ~150KB+ | Maps, MUST be code-split |
| `@tanstack/react-query-devtools` | ~50KB | Should be dev-only |
| `exceljs` | ~100KB+ | Excel processing, can be lazy loaded |
| `lucide-react` | ~50KB+ | Icons, tree-shaking should help |
| `zod` | ~30KB+ | Schema validation |

## Code Splitting Opportunities

### High Priority (Phase 1)

1. **Map Components** (`leaflet`, `react-leaflet`)
   - Files: `app/[locale]/(mobile)/guide/tracking/`
   - Action: Dynamic import with `ssr: false`

2. **PDF Generation** (`@react-pdf/renderer`)
   - Files: Training certificate generation
   - Action: Dynamic import when generating

3. **Charts** (`recharts`)
   - Files: Dashboard, analytics pages
   - Action: Dynamic import

### Medium Priority (Phase 2)

4. **Excel Processing** (`exceljs`)
   - Files: Import/export features
   - Action: Dynamic import on demand

5. **Query Devtools** (`@tanstack/react-query-devtools`)
   - Should be conditionally loaded in development only

## Baseline Targets

| Metric | Target | Current (Estimated) |
|--------|--------|---------------------|
| First Load JS (Home) | < 100KB | TBD (run analyzer) |
| First Load JS (Guide App) | < 150KB | TBD (run analyzer) |
| Shared Chunks | < 200KB | TBD (run analyzer) |
| Total Bundle (all routes) | < 500KB | TBD (run analyzer) |

## Performance Budget

Based on PRD requirements:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- Bundle size per route: < 100KB gzipped

## Build Results (January 2, 2026)

✅ **Build Status**: SUCCESS

| Metric | Value |
|--------|-------|
| Total .next Directory | 958 MB |
| Static Chunks Size | 10 MB |
| Number of Chunks | 246 |
| Build Time | ~2-3 min |

## Test Results Summary

### Unit Tests (Vitest)

| Status | Count |
|--------|-------|
| ✅ Passed | **236** |
| ❌ Failed | 0 |
| Total | 236 |

**All tests passing!** ✅

### E2E Tests (Playwright)

| Status | Count |
|--------|-------|
| ✅ Passed | 1 |
| ❌ Failed | 1 |
| Total | 2 (sample run) |

**Note**: Full E2E suite has 620 tests. Sample run showed heading text mismatch.

## Next Steps

1. ✅ Document expected large dependencies
2. ✅ Implement code splitting for maps (with loading states)
3. ✅ Implement React.memo for list components (TripCard)
4. ✅ Run full bundle analysis after optimizations
5. ⏳ Compare before/after metrics
6. ⏳ Fix failing tests

### Tests Fixed ✅

| Issue | Solution Applied |
|-------|------------------|
| `@testing-library/react` missing | Installed `@testing-library/react`, `@testing-library/jest-dom` |
| IndexedDB not available | Added `fake-indexeddb` + vitest setup file |
| Wallet rounding | Changed `Math.floor` to `Math.round` |
| Refund logic mismatch | Updated tests to match PRD 4.5.C policy |

## Commands for Monitoring

```bash
# Run bundle analyzer
pnpm analyze

# Check bundle size without visualization
ANALYZE=true pnpm build 2>&1 | grep -E "First Load|Route"

# Run Lighthouse for Core Web Vitals
npx lighthouse https://localhost:3000 --view

# Run unit tests
pnpm test:unit

# Run E2E tests
pnpm test:e2e
```

