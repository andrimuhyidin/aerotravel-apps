# Project Structure

## Overview

This document describes the complete project structure following industry best practices for enterprise-grade Next.js applications.

## Root Directory Structure

```
/
├── .github/                 # GitHub configuration
│   ├── workflows/         # CI/CD pipelines
│   ├── CODEOWNERS         # Code ownership rules
│   ├── dependabot.yml     # Dependency updates
│   └── pull_request_template.md
├── .husky/                 # Git hooks
│   ├── pre-commit         # Pre-commit checks
│   └── commit-msg         # Commit message validation
├── .vscode/                # VS Code settings (shared)
│   ├── settings.json      # Editor settings
│   └── extensions.json    # Recommended extensions
├── app/                    # Next.js App Router
├── components/             # React components
├── docs/                   # Documentation
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities & helpers
├── mocks/                  # Mock Service Worker
├── public/                 # Static assets
├── scripts/                # Build & migration scripts
├── templates/              # Plop.js code generators
├── tests/                  # Test files
├── types/                  # TypeScript type definitions
├── project-brief/          # Project requirements
└── [config files]         # Config files (next.config.js, etc.)
```

## Detailed Structure

### `/app` - Next.js App Router

```
app/
├── api/                    # API routes
│   ├── admin/             # Admin endpoints
│   ├── chat/              # AI chat endpoint
│   ├── health/            # Health check
│   ├── payment/           # Payment processing
│   ├── split-bill/        # Split bill feature
│   ├── v1/                # API v1 endpoints
│   └── webhooks/          # Webhook handlers
├── p/                      # Programmatic SEO pages
│   └── [city]/[slug]/    # Dynamic SEO pages
├── error.tsx              # Route error boundary
├── global-error.tsx       # Root error boundary
├── globals.css            # Global styles
├── layout.tsx             # Root layout
├── page.tsx               # Home page
├── robots.ts              # Robots.txt generator
└── sitemap.ts             # Sitemap generator
```

**Conventions:**
- Use `page.tsx` for routes
- Use `layout.tsx` for shared layouts
- Use `loading.tsx` for loading states
- Use `error.tsx` for error boundaries
- API routes in `api/` directory

### `/components` - React Components

```
components/
├── ui/                    # Shadcn UI components (to be installed)
│   ├── button.tsx        # Button component
│   ├── card.tsx          # Card component
│   └── README.md         # Component guide
├── layout/                # Layout components
│   ├── container.tsx     # Responsive container
│   ├── section.tsx       # Section wrapper
│   └── index.ts          # Barrel export
├── features/              # Feature-specific components (to be created)
│   ├── booking/          # Booking feature components
│   ├── payment/          # Payment feature components
│   └── ...
├── shared/                # Shared components (to be created)
│   ├── header.tsx        # App header
│   ├── footer.tsx        # App footer
│   └── ...
├── icons/                 # SVG icon components
│   └── README.md         # SVG usage guide
├── error-boundary.tsx     # Global error boundary
├── index.ts               # Barrel export
└── examples/              # Example components
```

**Conventions:**
- Use PascalCase for component files
- One component per file
- Include barrel exports (`index.ts`)
- Group by feature when appropriate

### `/lib` - Utilities & Helpers

```
lib/
├── api/                   # API utilities
│   ├── client.ts         # Centralized API client
│   └── error-handler.ts  # Error handling
├── ai/                    # AI integrations
│   ├── rag.ts           # RAG system
│   └── vision.ts        # Vision AI (OCR)
├── analytics/             # Analytics
│   ├── ga4.ts           # Google Analytics 4
│   ├── ga4-script.tsx   # GA4 script component
│   └── posthog.ts       # PostHog analytics
├── branch/                # Multi-branch architecture
│   └── branch-injection.ts
├── design/                # Design system
│   └── tokens.ts        # Design tokens
├── excel/                 # Excel utilities
│   ├── export.ts        # Export functions
│   └── import.ts        # Import functions
├── feature-flags/         # Feature flags
│   └── posthog-flags.ts
├── fonts.ts               # Font configuration
├── integrations/          # Third-party integrations
│   ├── midtrans.ts      # Payment gateway
│   ├── rate-limit.ts    # Rate limiting
│   └── resend.ts        # Email service
├── observability/         # Monitoring & logging
│   ├── otel.ts          # OpenTelemetry
│   └── sentry.ts        # Sentry config
├── offline/               # Offline-first utilities
│   └── indexeddb.ts     # IndexedDB helpers
├── pdf/                   # PDF generators
│   ├── invoice.tsx      # Invoice template
│   ├── e-ticket.tsx     # E-Ticket template
│   └── manifest.tsx     # Manifest template
├── providers/             # React providers
│   └── query-provider.tsx
├── queries/               # TanStack Query
│   └── query-keys.ts    # Query keys factory
├── seo/                   # SEO utilities
│   ├── content-spinner.ts
│   ├── generate-pages.ts
│   ├── metadata.ts
│   └── structured-data.tsx
├── storage/               # Storage utilities
│   └── supabase-storage.ts
├── stores/                # Zustand stores
│   └── booking-store.ts
├── supabase/              # Supabase clients
│   ├── client.ts        # Client-side
│   ├── server.ts        # Server-side
│   └── cron-helper.md   # pg_cron docs
├── utils/                 # General utilities
│   ├── accessibility.ts # A11y helpers
│   ├── logger.ts         # Structured logging
│   ├── responsive.ts     # Responsive utilities
│   ├── sanitize.ts       # Input sanitization
│   └── timezone.ts       # Timezone utilities
├── deepseek.ts            # DeepSeek AI client
├── env.ts                 # Type-safe env vars
└── index.ts               # Barrel export
```

**Conventions:**
- Group by domain/feature
- One utility per file
- Include JSDoc comments
- Export via barrel exports

### `/hooks` - Custom React Hooks

```
hooks/
├── use-media-query.ts     # Responsive hooks
└── index.ts               # Barrel export
```

**Conventions:**
- Prefix with `use`
- One hook per file
- Include TypeScript types

### `/types` - TypeScript Types

```
types/
└── supabase.ts            # Database types (auto-generated)
```

**Conventions:**
- Never edit auto-generated files manually
- Regenerate after schema changes
- Use generated types in code

### `/tests` - Test Files

```
tests/
├── e2e/                   # Playwright E2E tests
│   ├── example.spec.ts
│   └── smoke.spec.ts     # Smoke tests
└── unit/                  # Vitest unit tests
    └── example.test.ts
```

**Conventions:**
- E2E: `*.spec.ts`
- Unit: `*.test.ts`
- Mirror source structure when possible

### `/scripts` - Build & Migration Scripts

```
scripts/
├── migrations/            # Database migrations
│   └── 001-rls-policies.sql
├── init-db.sql           # Database initialization
├── seed-data.sql         # Seed data
└── update-types.sh       # Type generation script
```

**Conventions:**
- SQL migrations: Sequential numbering
- Scripts: Include shebang and error handling

### `/docs` - Documentation

```
docs/
├── API.md                 # API documentation
├── ARCHITECTURE.md        # System architecture
├── CODE_GENERATORS.md     # Code generator guide
├── CONNECTION_POOLING.md  # Connection pooling
├── DATABASE_TYPES.md      # Database types guide
├── DEPENDENCY_MANAGEMENT.md
├── DESIGN_SYSTEM.md       # Design system
├── MIGRATIONS.md          # Migration guide
├── MSW_SETUP.md           # Mock Service Worker
├── PROJECT_STRUCTURE.md   # This file
├── STORYBOOK_SETUP.md     # Storybook guide
└── UI_UX_SETUP.md         # UI/UX setup
```

### `/public` - Static Assets

```
public/
├── manifest.json          # PWA manifest
├── sw.ts                  # Service worker
├── ICONS_README.md        # Icon generation guide
└── STATIC_ASSETS_README.md # Assets guide
```

**Note:** Add actual assets:
- `favicon.ico`
- `og-image.jpg` (1200x630px)
- `icon-192x192.png`
- `icon-512x512.png`

### `/templates` - Code Generator Templates

```
templates/
├── component.hbs          # Component template
├── component-index.hbs    # Barrel export template
├── component-test.hbs     # Test template
├── component-story.hbs    # Storybook template
├── page.hbs               # Page template
├── page-layout.hbs        # Layout template
└── api-route.hbs          # API route template
```

### Configuration Files

```
/
├── .cursorrules           # Cursor AI rules
├── .eslintrc.json        # ESLint config
├── .gitignore            # Git ignore rules
├── .husky/               # Git hooks
├── .lintstagedrc.js      # Lint-staged config
├── .npmrc                # pnpm config
├── .nvmrc                # Node version
├── .prettierrc           # Prettier config
├── .prettierignore       # Prettier ignore
├── commitlint.config.js  # Commitlint config
├── components.json       # Shadcn UI config
├── docker-compose.yml    # Docker services
├── Dockerfile            # Docker build
├── next.config.js        # Next.js config
├── package.json          # Dependencies
├── playwright.config.ts  # Playwright config
├── plopfile.js           # Plop.js config
├── postcss.config.js     # PostCSS config
├── tailwind.config.ts    # Tailwind config
├── tsconfig.json         # TypeScript config
└── vitest.config.ts      # Vitest config
```

## File Organization Rules

### 1. Group by Feature (When Appropriate)

For large features, group related files:

```
components/
└── features/
    └── booking/
        ├── BookingForm.tsx
        ├── BookingList.tsx
        └── index.ts
```

### 2. Barrel Exports

Always include `index.ts` for clean imports:

```tsx
// components/index.ts
export { Container } from './layout/container';
export { Button } from './ui/button';
```

### 3. Co-location

Keep related files together:

```
components/
└── booking-form/
    ├── BookingForm.tsx
    ├── BookingForm.test.tsx
    ├── BookingForm.stories.tsx
    └── index.ts
```

### 4. Separation of Concerns

- **Pages:** `app/` (routing)
- **Components:** `components/` (UI)
- **Logic:** `lib/` (business logic)
- **Hooks:** `hooks/` (reusable logic)
- **Types:** `types/` (type definitions)

## Import Paths

### Always Use Absolute Imports

```tsx
// ✅ Good
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';
import { useIsMobile } from '@/hooks/use-media-query';

// ❌ Bad
import { Button } from '../../components/ui/button';
import { logger } from '../../../lib/utils/logger';
```

### Import Order

```tsx
// 1. External packages
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal (absolute imports)
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';

// 3. Relative imports (only if necessary)
import { LocalComponent } from './local-component';
```

## Naming Conventions

### Files
- **Components:** `PascalCase.tsx` (`Button.tsx`, `BookingForm.tsx`)
- **Utilities:** `camelCase.ts` (`logger.ts`, `sanitize.ts`)
- **Routes:** `kebab-case` (`booking-list/page.tsx`)
- **Tests:** `*.test.ts` or `*.spec.ts`
- **Stories:** `*.stories.tsx`

### Variables & Functions
- **Components:** `PascalCase` (`const Button = () => {}`)
- **Functions:** `camelCase` (`const handleClick = () => {}`)
- **Constants:** `UPPER_SNAKE_CASE` (`const MAX_RETRIES = 3`)
- **Types:** `PascalCase` (`type UserData = {}`)

### Directories
- **Components:** `kebab-case` (`booking-form/`)
- **Features:** `kebab-case` (`booking-management/`)
- **Utils:** `kebab-case` (`date-utils/`)

## Best Practices

### 1. Keep Files Focused
- One component per file
- One utility function per file (or related group)
- Maximum ~300 lines per file

### 2. Use Barrel Exports
- Create `index.ts` in directories
- Export all public APIs
- Keep imports clean

### 3. Organize by Feature (When Large)
- Group related components
- Group related utilities
- Keep feature boundaries clear

### 4. Document Complex Structures
- Add README.md for complex features
- Document architecture decisions
- Keep docs up-to-date

## Migration Guide

If reorganizing existing code:

1. **Move files** to new locations
2. **Update imports** (use find/replace)
3. **Update barrel exports**
4. **Run type-check:** `pnpm type-check`
5. **Run tests:** `pnpm test`
6. **Update documentation**

---

**Last Updated:** $(date)  
**Maintained By:** Development Team

