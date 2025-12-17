# Contributing Guide

## Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow TypeScript strict mode
   - Use existing patterns and conventions
   - Write tests for new features

3. **Commit Changes**
   ```bash
   git commit -m "feat: your feature description"
   ```
   - Use conventional commits format
   - Prefix: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

4. **Run Tests**
   ```bash
   pnpm lint
   pnpm test:e2e
   ```

5. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Naming**: 
  - Components: PascalCase
  - Functions/Variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case for routes, PascalCase for components

- **Imports**: 
  - Use absolute imports with `@/` alias
  - Group: external → internal → relative

- **Error Handling**: Always use try-catch for async operations

## Project Structure

```
/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utilities & helpers
│   ├── supabase/    # Supabase clients
│   ├── integrations/# Third-party integrations
│   └── stores/      # Zustand stores
├── public/           # Static assets
├── tests/            # E2E tests
└── scripts/         # Build & deployment scripts
```

## Security Checklist

- [ ] No secrets in code (use .env.local)
- [ ] Input validation with Zod
- [ ] Rate limiting on API routes
- [ ] RLS policies on database queries
- [ ] Sanitize user inputs

## Testing

- Write E2E tests for critical flows (booking, payment)
- Test offline functionality for Guide App
- Verify security (RLS, rate limiting)

