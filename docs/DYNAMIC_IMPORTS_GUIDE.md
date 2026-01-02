# Dynamic Imports Guide for Partner Portal

Guide untuk menggunakan dynamic imports pada heavy components untuk improve initial page load.

## Components yang Perlu Dynamic Import

### Charts (recharts)

**Files:**
- `app/[locale]/(portal)/partner/analytics/clv/clv-dashboard-client.tsx`
- `app/[locale]/(portal)/partner/reports/commission-reports-client.tsx`
- `app/[locale]/(portal)/partner/reports/builder/report-builder-client.tsx`

**Pattern:**
```typescript
import dynamic from 'next/dynamic';

const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> }
);

const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
);
```

### PDF Viewers (react-pdf)

**Files:**
- Contract signing pages
- Invoice detail pages

**Pattern:**
```typescript
const Document = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.Document),
  { ssr: false }
);
```

### Maps (react-leaflet)

Jika ada map components di partner portal.

**Pattern:**
```typescript
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
```

## Benefits

- **Reduced Initial Bundle Size**: Charts and PDF libraries are large
- **Faster First Load**: Only load when component is rendered
- **Better Core Web Vitals**: Improve LCP and FID scores

## When NOT to Use Dynamic Imports

- Small components (< 50KB)
- Above-the-fold content
- Components needed for SSR

