# MyAeroTravel ID

**Integrated Travel Ecosystem - ERP & Super App**

Enterprise-grade travel management system dengan AI-powered automation, offline-first PWA, dan multi-branch architecture.

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0 (LTS recommended)
- **pnpm** >= 8.0.0
- **Docker** >= 24.x (for local development)
- **Git** >= 2.30+

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd aero-apps

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp env.example.txt .env.local
# Edit .env.local with your credentials

# 4. Setup Git hooks (Husky)
pnpm prepare

# 5. Start local development
docker-compose up -d  # Start PostgreSQL, Redis, WAHA
pnpm dev              # Start Next.js app
```

Visit `http://localhost:3000`

## 📋 Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── p/                 # Programmatic SEO pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── layout/           # Layout components
│   └── examples/         # Example components
├── lib/                   # Utilities & helpers
│   ├── api/              # API client
│   ├── ai/               # AI integrations
│   ├── analytics/        # Analytics (PostHog, GA4)
│   ├── design/           # Design tokens
│   ├── queries/          # TanStack Query keys
│   ├── utils/            # General utilities
│   └── env.ts            # Type-safe env vars
├── hooks/                 # Custom React hooks
├── tests/                 # Test files
│   ├── e2e/             # Playwright E2E tests
│   └── unit/             # Vitest unit tests
├── scripts/               # Build & migration scripts
├── docs/                  # Documentation
└── public/                # Static assets
```

## 🛠️ Tech Stack

### Core
- **Framework:** Next.js 14.2.35+ (Security Patched)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI:** DeepSeek-V3.2
- **PWA:** Serwist

### State Management
- **Server State:** TanStack Query v5.59.5
- **Client State:** Zustand v5.0.x
- **Forms:** React Hook Form + Zod

### UI/UX
- **Components:** Shadcn UI
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

### Infrastructure
- **Hosting:** Vercel
- **Payment:** Midtrans
- **Email:** Resend
- **WhatsApp:** WAHA (Self-Hosted)
- **Analytics:** PostHog + GA4
- **Monitoring:** Sentry

## 📝 Development Workflow

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add booking form
fix: resolve payment gateway issue
docs: update API documentation
style: format code with prettier
refactor: reorganize component structure
test: add unit tests for booking logic
chore: update dependencies
```

**Format:** `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `revert`

### Code Quality

- **Linting:** ESLint with A11y plugin
- **Formatting:** Prettier with Tailwind sorting
- **Type Checking:** TypeScript strict mode
- **Pre-commit:** Auto lint & format via Husky

### Testing

```bash
# Unit tests
pnpm test:unit

# E2E tests
pnpm test:e2e

# Smoke tests (quick check)
pnpm test:smoke

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## 🔒 Security

### Security Patches

This project includes security patches for:
- **CVE-2025-55182** (React4Shell) - CRITICAL
- **CVE-2025-55184** (DoS) - HIGH
- **CVE-2025-55183** - MEDIUM

**⚠️ IMPORTANT:** If application was online between Dec 4-11, 2025 unpatched, rotate ALL secrets immediately.

### Environment Variables

All environment variables are type-safe and validated at build time using `@t3-oss/env-nextjs`. See `lib/env.ts` for schema.

**Never commit `.env.local`** - it's in `.gitignore`.

## 📚 Documentation

### Quick Links
- **[Project Structure](./docs/PROJECT_STRUCTURE.md)** - Complete structure guide
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture
- **[Design System](./docs/DESIGN_SYSTEM.md)** - UI/UX guidelines
- **[API Documentation](./docs/API.md)** - API reference

### Setup & Development
- **[Project Setup Guide](./project-brief/project-setup.md)** - Detailed setup
- **[UI/UX Setup](./docs/UI_UX_SETUP.md)** - UI/UX configuration
- **[Code Generators](./docs/CODE_GENERATORS.md)** - Plop.js usage
- **[Database Types](./docs/DATABASE_TYPES.md)** - Type generation

### Enterprise Features
- **[Dependency Management](./docs/DEPENDENCY_MANAGEMENT.md)** - Dependency policy
- **[Migrations](./docs/MIGRATIONS.md)** - Database migrations
- **[Connection Pooling](./docs/CONNECTION_POOLING.md)** - Pooling guide

### Requirements
- **[PRD](./project-brief/prd-aerotravel.md)** - Product Requirements Document

**Full documentation index:** [docs/README.md](./docs/README.md)

## 🧪 Testing

### E2E Tests (Playwright)

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run smoke tests only
pnpm test:smoke
```

### Unit Tests (Vitest)

```bash
# Run unit tests
pnpm test:unit

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## 🚢 Deployment

### Build

```bash
pnpm build
```

### Production

```bash
pnpm start
```

### Docker

```bash
docker-compose up -d
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

Proprietary - PT Aero Travel Indonesia & PT Elang Samudera Utama

---

**Last Updated:** $(date)  
**Version:** 0.1.0
