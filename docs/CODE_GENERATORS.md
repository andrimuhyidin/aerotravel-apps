# Code Generators (Plop.js)

## Overview

Plop.js provides scaffolding for consistent file structure across the team.

## Usage

### Generate Component

```bash
pnpm generate component Button
```

This creates:
- `components/button/Button.tsx`
- `components/button/index.ts`
- `components/button/Button.test.tsx` (optional)
- `components/button/Button.stories.tsx` (optional)

### Generate Page

```bash
pnpm generate page dashboard
```

This creates:
- `app/dashboard/page.tsx`
- `app/dashboard/layout.tsx` (optional)

### Generate API Route

```bash
pnpm generate api bookings
pnpm generate api payments/verify
```

This creates:
- `app/api/bookings/route.ts`
- `app/api/payments/verify/route.ts`

## Benefits

- ✅ Consistent file structure
- ✅ Standardized boilerplate
- ✅ Faster development
- ✅ Team alignment

## Customization

Edit `plopfile.js` to customize generators or add new ones.

---

**Note:** Plop.js is optional but recommended for teams with multiple developers.

