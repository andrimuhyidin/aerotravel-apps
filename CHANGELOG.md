# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Next.js 14.2.35+
- TypeScript strict mode configuration
- Supabase integration (PostgreSQL + pgvector)
- PWA support with Serwist
- TanStack Query v5.59.5 for server state
- Zustand v5.0.x for client state
- Shadcn UI + Tailwind CSS design system
- DeepSeek-V3.2 AI integration
- Sentry error tracking
- PostHog analytics + feature flags
- Google Analytics 4
- Playwright E2E testing setup
- Vitest unit testing setup
- Enterprise-grade code quality tools:
  - Husky + lint-staged
  - Commitlint
  - Type-safe environment variables
  - Prettier with Tailwind sorting
  - ESLint with A11y plugin
- Structured logging system
- Centralized API client
- Query keys factory
- Barrel exports for clean imports
- Health check endpoint
- Error boundaries (Global + Route-level)
- RLS policy examples
- PDF generators (Invoice, E-Ticket, Manifest)
- Excel export/import functions
- Map component with dynamic import
- QR code components
- SEO infrastructure (ISR pages, sitemap, robots.txt)
- AI Content Spinner for programmatic SEO
- Docker setup for local development
- CI/CD pipeline (GitHub Actions)
- Comprehensive documentation

### Security
- Security patches for CVE-2025-55182, CVE-2025-55184, CVE-2025-55183
- Security headers configuration
- Input sanitization utilities
- Type-safe environment variables

### Changed
- Updated to Next.js 14.2.35+ (security patched)
- React 18.3.1 (stable, security-hardened)
- TanStack Query v5.59.5 (latest stable)

### Fixed
- TypeScript strict mode with `noUncheckedIndexedAccess`
- Environment variable validation at build time

## [0.1.0] - 2025-01-XX

### Added
- Initial release
- Project foundation setup

---

## How to Update This Changelog

When making changes:

1. Add entries under `[Unreleased]` section
2. Use categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
3. Use conventional commit format for consistency
4. Move `[Unreleased]` to version tag when releasing

Example:
```markdown
## [Unreleased]

### Added
- New booking form component

### Fixed
- Payment gateway timeout issue
```

