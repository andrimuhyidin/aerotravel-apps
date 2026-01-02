# Deployment Guide

## Overview

This guide covers deploying the MyAeroTravel Guide App to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Supabase Setup](#supabase-setup)
4. [External Services](#external-services)
5. [Build & Deploy](#build--deploy)
6. [Monitoring Setup](#monitoring-setup)
7. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### Required Tools

- Node.js >= 20.19.0
- pnpm >= 8.0.0
- Docker (for containerized deployment)
- Vercel CLI (optional, for Vercel deployment)

### Accounts Required

- Supabase (Database & Auth)
- Vercel (Hosting) or similar
- Upstash (Redis for rate limiting)
- Resend (Email notifications)
- PostHog (Analytics)
- Sentry (Error tracking)
- Google Cloud (Speech-to-Text, Gemini AI)

---

## Environment Variables

### Required Variables

Create `.env.production` with the following:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# AI Services
GOOGLE_GEMINI_API_KEY=your-gemini-key
GOOGLE_SPEECH_API_KEY=your-speech-key

# Notifications
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=noreply@myaerotravel.id

# WhatsApp (for SOS)
WHATSAPP_API_URL=https://api.whatsapp.com/...
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Error Tracking
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your-auth-token

# App Settings
NEXT_PUBLIC_APP_URL=https://app.myaerotravel.id
NODE_ENV=production
```

### Optional Variables

```bash
# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_OFFLINE_MODE=true

# Performance
EDGE_RUNTIME=true

# Logging
LOG_LEVEL=info
```

---

## Supabase Setup

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note the Project URL and API keys

### 2. Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 3. Configure RLS Policies

Ensure all tables have appropriate Row Level Security policies:

```sql
-- Example: guides table
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view own data"
  ON guides FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Guides can update own data"
  ON guides FOR UPDATE
  USING (auth.uid() = id);
```

### 4. Storage Buckets

Create required storage buckets:

- `guide-uploads` - For guide documents and photos
- `trip-photos` - For trip photos
- `incident-evidence` - For incident report files

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('guide-uploads', 'guide-uploads', false),
  ('trip-photos', 'trip-photos', false),
  ('incident-evidence', 'incident-evidence', false);
```

### 5. Edge Functions (Optional)

Deploy any edge functions:

```bash
supabase functions deploy function-name
```

---

## External Services

### Upstash Redis (Rate Limiting)

1. Create account at [upstash.com](https://upstash.com)
2. Create new Redis database
3. Copy REST URL and Token

### Resend (Email)

1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Create API key

### Google Cloud (AI Services)

1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Speech-to-Text API
3. Enable Generative AI API (Gemini)
4. Create API keys with appropriate restrictions

### PostHog (Analytics)

1. Create account at [posthog.com](https://posthog.com)
2. Create project
3. Copy project API key

### Sentry (Error Tracking)

1. Create account at [sentry.io](https://sentry.io)
2. Create Next.js project
3. Copy DSN and auth token

---

## Build & Deploy

### Local Build Test

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test production build locally
pnpm start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add SUPABASE_URL production
# ... repeat for all variables
```

### Deploy with Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t myaerotravel-guide .
docker run -p 3000:3000 --env-file .env.production myaerotravel-guide
```

---

## Monitoring Setup

### 1. Sentry Configuration

Sentry is pre-configured. Verify it's working:

```typescript
// Test error reporting
Sentry.captureMessage('Deployment test');
```

### 2. PostHog Analytics

Verify analytics are tracking:

1. Open app in browser
2. Navigate through pages
3. Check PostHog dashboard for events

### 3. Uptime Monitoring

Set up uptime monitoring for critical endpoints:

- `/api/health` - Health check endpoint
- `/api/guide/trips` - Core API endpoint
- `/id/guide/dashboard` - Main app page

### 4. Log Aggregation

Configure log forwarding to your preferred service:

- Vercel Logs (if using Vercel)
- Papertrail
- Datadog
- LogDNA

---

## Post-Deployment Checklist

### Immediate (Day 1)

- [ ] Verify all environment variables are set
- [ ] Test authentication flow
- [ ] Test critical flows (check-in, SOS, trips)
- [ ] Verify rate limiting is working
- [ ] Check Sentry for any initial errors
- [ ] Verify email notifications (Resend)
- [ ] Test WhatsApp SOS notifications

### First Week

- [ ] Monitor error rates in Sentry
- [ ] Review PostHog analytics
- [ ] Check API response times
- [ ] Verify offline sync is working
- [ ] Test on multiple devices (iOS, Android)
- [ ] Load test critical endpoints

### Ongoing

- [ ] Weekly security review
- [ ] Monthly dependency updates
- [ ] Quarterly performance review
- [ ] Regular backup verification

---

## Rollback Procedure

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback
```

### Docker

```bash
# Tag previous version
docker tag myaerotravel-guide:previous myaerotravel-guide:latest

# Restart container
docker-compose up -d
```

### Database Rollback

```bash
# Revert last migration
supabase db reset --to-version previous_version
```

---

## Support

For deployment issues:
- Check Vercel/hosting logs first
- Review Sentry for errors
- Check Supabase logs for database issues
- Contact DevOps team for infrastructure issues
