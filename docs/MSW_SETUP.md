# Mock Service Worker (MSW) Setup

## Overview

MSW allows you to mock API responses during frontend development when the backend is not ready. This enables frontend developers to work independently.

## Setup

### 1. Install Dependencies

```bash
pnpm add -D msw
```

### 2. Enable MSW in Development

Add to `.env.local`:

```env
NEXT_PUBLIC_USE_MSW=true
```

### 3. Initialize MSW in App

Add to `app/layout.tsx` (client-side only):

```tsx
'use client';

if (process.env.NEXT_PUBLIC_USE_MSW === 'true') {
  require('@/mocks/browser');
}
```

## Usage

### In Development

When `NEXT_PUBLIC_USE_MSW=true`, all API calls will be intercepted by MSW handlers defined in `mocks/handlers.ts`.

### In Tests

```tsx
import { server } from '@/mocks/server';
import { setup } from '@storybook/test';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Adding Mock Handlers

Edit `mocks/handlers.ts` to add new mock endpoints:

```tsx
http.get('/api/new-endpoint', () => {
  return HttpResponse.json({ data: 'mock data' });
});
```

## Benefits

- ✅ Frontend dev not blocked by backend
- ✅ Consistent mock data
- ✅ Test API integration without real backend
- ✅ Offline development

---

**Note:** Remove MSW when backend is ready, or keep it for testing purposes.

