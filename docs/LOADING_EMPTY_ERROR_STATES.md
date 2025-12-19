# Loading, Empty, and Error States - Best Practices

## Overview

Dokumen ini menjelaskan best practices untuk handling loading states, empty states, dan error states di Guide Apps sesuai dengan industry standards.

## Standardized Components

Kami telah membuat standardized components di `components/ui/`:

### 1. LoadingState (`components/ui/loading-state.tsx`)

Component untuk menampilkan loading state dengan berbagai variant.

```tsx
import { LoadingState } from '@/components/ui/loading-state';

// Spinner variant
<LoadingState variant="spinner" message="Memuat data..." />

// Skeleton variant
<LoadingState variant="skeleton" lines={3} />

// Skeleton card variant
<LoadingState variant="skeleton-card" lines={3} />

// Inline variant
<LoadingState variant="inline" message="Loading..." />
```

### 2. EmptyState (`components/ui/empty-state.tsx`)

Component untuk menampilkan empty state ketika data tidak tersedia.

```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar } from 'lucide-react';

<EmptyState
  icon={Calendar}
  title="Belum ada trip tersedia"
  description="Trip yang ditugaskan ke Anda akan muncul di sini"
  variant="default" // or 'subtle' or 'minimal'
  action={<Button>Refresh</Button>}
/>
```

### 3. ErrorState (`components/ui/error-state.tsx`)

Component untuk menampilkan error state dengan retry functionality.

```tsx
import { ErrorState } from '@/components/ui/error-state';

<ErrorState
  title="Terjadi Kesalahan"
  message="Gagal memuat data trip"
  onRetry={handleRetry}
  retryLabel="Coba Lagi"
  variant="card" // or 'default' or 'inline'
  showIcon={true}
/>
```

## Best Practices

### 1. Never Return `null` for Critical Components

**❌ Bad:**
```tsx
if (error || !data) {
  return null; // Component disappears without feedback
}
```

**✅ Good:**
```tsx
if (error) {
  return (
    <ErrorState
      message={error}
      onRetry={loadData}
      variant="card"
    />
  );
}

if (!data) {
  return (
    <EmptyState
      icon={Calendar}
      title="Belum ada data"
      description="Data akan muncul setelah..."
    />
  );
}
```

### 2. Always Show Loading State

**❌ Bad:**
```tsx
if (loading) {
  return <div>Loading...</div>; // Inconsistent styling
}
```

**✅ Good:**
```tsx
if (loading) {
  return (
    <Card>
      <CardContent>
        <LoadingState variant="skeleton" lines={3} />
      </CardContent>
    </Card>
  );
}
```

### 3. Provide Retry Mechanism for Errors

**✅ Good:**
```tsx
const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/endpoint');
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    setData(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load');
  } finally {
    setLoading(false);
  }
};

if (error) {
  return (
    <ErrorState
      message={error}
      onRetry={loadData}
    />
  );
}
```

### 4. Handle Race Conditions

**✅ Good:**
```tsx
useEffect(() => {
  let mounted = true;

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchData();
      if (mounted) {
        setData(data);
      }
    } catch (err) {
      if (mounted) {
        setError(err.message);
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  void load();

  return () => {
    mounted = false;
  };
}, []);
```

### 5. Optional Widgets Can Return `null`

Untuk optional widgets (seperti weather widget, challenges widget), returning `null` is acceptable:

```tsx
// ✅ Acceptable for optional widgets
if (!weatherData) {
  return null; // Widget is optional, returning null is acceptable
}
```

Tapi untuk critical components (seperti trip detail, manifest), selalu show proper state.

## Component Patterns

### Pattern 1: Full Component with States

```tsx
export function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/endpoint');
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      await loadData();
      if (!mounted) return;
    };
    void load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LoadingState variant="skeleton" lines={3} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <ErrorState
            message={error}
            onRetry={loadData}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={Calendar}
            title="Belum ada data"
            description="Data akan muncul setelah..."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Render data */}
      </CardContent>
    </Card>
  );
}
```

### Pattern 2: Using TanStack Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

export function MyComponent() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['myData'],
    queryFn: async () => {
      const res = await fetch('/api/endpoint');
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    },
  });

  if (isLoading) {
    return <LoadingState variant="skeleton" lines={3} />;
  }

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load'}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Belum ada data"
      />
    );
  }

  return (
    <div>
      {/* Render data */}
    </div>
  );
}
```

## Fixed Components

### ✅ GuideAiAssistant
- **Before:** Returned `null` when error or no insights → AI tips disappeared
- **After:** Shows proper error state with retry, empty state when no insights

### ✅ TripItineraryTimeline
- **Before:** Returned `null` when error or no data
- **After:** Shows proper error state with retry, empty state when no itinerary

### ✅ ChallengesWidget & WeatherWidget
- **Before:** Returned `null` silently
- **After:** Added comments explaining that returning `null` is acceptable for optional widgets

## Checklist

Saat membuat component baru, pastikan:

- [ ] Loading state menggunakan `LoadingState` component
- [ ] Error state menggunakan `ErrorState` component dengan retry
- [ ] Empty state menggunakan `EmptyState` component
- [ ] Race conditions dihandle dengan `mounted` flag
- [ ] Tidak ada `return null` untuk critical components
- [ ] Optional widgets boleh return `null` dengan comment yang jelas
- [ ] Consistent styling dengan design system
- [ ] Proper error messages yang user-friendly
- [ ] Retry mechanism untuk failed API calls

## Common Mistakes to Avoid

1. **Returning `null` without feedback** - User tidak tahu apa yang terjadi
2. **Inconsistent loading states** - Setiap component punya loading UI berbeda
3. **No retry mechanism** - User harus refresh manual
4. **Race condition bugs** - State update setelah component unmount
5. **Poor error messages** - Technical error messages yang tidak user-friendly
6. **Missing empty states** - Blank screen ketika tidak ada data

## References

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [TanStack Query Error Handling](https://tanstack.com/query/latest/docs/react/guides/error-handling)
- [Material Design Loading States](https://material.io/design/communication/loading.html)
- [Human Interface Guidelines - Loading](https://developer.apple.com/design/human-interface-guidelines/loading)
