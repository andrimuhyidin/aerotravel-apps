# Monitoring Guide

## Overview

This guide describes the key metrics, alerts, and dashboards for monitoring the Guide App.

---

## Key Metrics

### Application Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| API Response Time (p95) | < 300ms | > 500ms | > 1000ms |
| Error Rate | < 0.1% | > 0.5% | > 2% |
| Uptime | 99.9% | < 99.5% | < 99% |
| Request Rate | Normal | +50% spike | +200% spike |

### Business Metrics

| Metric | Description | Dashboard |
|--------|-------------|-----------|
| Active Guides | Guides checked in today | PostHog |
| SOS Alerts | Active SOS count | Admin Console |
| Trip Completion Rate | % trips completed | Analytics |
| App Crashes | PWA/Mobile crashes | Sentry |

### Infrastructure Metrics

| Metric | Target | Source |
|--------|--------|--------|
| Database Connections | < 80% pool | Supabase |
| Database Query Time | < 100ms avg | Supabase |
| Redis Memory | < 80% | Upstash |
| Edge Function Duration | < 10s | Vercel |

---

## Alert Thresholds

### P0 Alerts (Immediate)

```yaml
- name: SOS_ENDPOINT_DOWN
  condition: /api/guide/sos returns 5xx for 2+ minutes
  action: Page on-call immediately

- name: AUTH_BROKEN
  condition: Login success rate < 50%
  action: Page on-call immediately

- name: DATABASE_DOWN
  condition: Supabase connection failures > 10/min
  action: Page on-call immediately
```

### P1 Alerts (1 hour response)

```yaml
- name: HIGH_ERROR_RATE
  condition: 5xx errors > 2% of requests
  action: Slack notification + ticket

- name: SLOW_API
  condition: p95 response time > 1000ms
  action: Slack notification

- name: RATE_LIMIT_SPIKE
  condition: 429 responses > 100/min
  action: Review for abuse
```

### P2 Alerts (4 hour response)

```yaml
- name: ELEVATED_ERRORS
  condition: 5xx errors > 0.5% of requests
  action: Slack notification

- name: AI_QUOTA_WARNING
  condition: Google AI quota > 80%
  action: Review usage
```

---

## Dashboards

### 1. Operations Dashboard

**URL:** PostHog > Dashboards > Guide App Operations

**Panels:**
- Active sessions (real-time)
- API response time trend
- Error rate trend
- Top error types
- Geographic distribution

### 2. Business Dashboard

**URL:** PostHog > Dashboards > Business Metrics

**Panels:**
- Daily active guides
- Trip completions
- Check-in rates
- SOS incidents
- Average rating

### 3. Infrastructure Dashboard

**URL:** Supabase Dashboard + Vercel Dashboard

**Supabase Panels:**
- Query performance
- Connection pool usage
- Storage usage
- API request count

**Vercel Panels:**
- Function invocations
- Build times
- Edge network performance
- Error logs

---

## Logging

### Log Levels

| Level | Usage |
|-------|-------|
| ERROR | Unexpected errors, requires investigation |
| WARN | Potential issues, degraded performance |
| INFO | Normal operations, key events |
| DEBUG | Detailed debugging (dev only) |

### Structured Logging Format

```json
{
  "level": "info",
  "message": "Check-in completed",
  "timestamp": "2026-01-15T08:00:00Z",
  "context": {
    "guideId": "uuid",
    "tripId": "uuid",
    "isLate": false
  },
  "requestId": "req-123"
}
```

### Log Retention

| Environment | Retention |
|-------------|-----------|
| Production | 30 days |
| Staging | 7 days |
| Development | 1 day |

---

## Sentry Configuration

### Error Grouping

Errors are grouped by:
- Stack trace fingerprint
- Error message pattern
- Affected component

### Alert Rules

1. **New Issue Alert**
   - Trigger: First occurrence of new error
   - Action: Slack notification

2. **Regression Alert**
   - Trigger: Previously resolved issue reoccurs
   - Action: Email + Slack

3. **Spike Alert**
   - Trigger: Error count increases 10x from baseline
   - Action: PagerDuty

### Performance Monitoring

Enable performance monitoring for:
- All API routes
- Database queries (via Supabase)
- External API calls

---

## PostHog Events

### Tracked Events

```typescript
// Core events
'guide_check_in'
'guide_check_out'
'trip_started'
'trip_completed'
'sos_triggered'
'sos_resolved'

// Feature usage
'ai_voice_command'
'ai_insights_viewed'
'offline_sync_completed'
'document_uploaded'

// Errors
'api_error'
'sync_failed'
'payment_failed'
```

### User Properties

```typescript
{
  guide_id: 'uuid',
  branch_id: 'uuid',
  is_verified: boolean,
  total_trips: number,
  average_rating: number
}
```

---

## Health Checks

### Endpoint: GET /api/health

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T08:00:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "external_apis": "ok"
  },
  "version": "1.0.0"
}
```

### Health Check Intervals

| Monitor | Interval | Timeout |
|---------|----------|---------|
| Uptime Robot | 1 min | 30s |
| Internal | 30s | 10s |
| External APIs | 5 min | 60s |

---

## Runbook Quick Links

| Issue | Runbook Section |
|-------|-----------------|
| High response time | [RUNBOOK.md#high-api-response-time](./RUNBOOK.md#issue-high-api-response-time) |
| Rate limit errors | [RUNBOOK.md#rate-limit-errors](./RUNBOOK.md#issue-rate-limit-errors-429) |
| SOS not sending | [RUNBOOK.md#sos-notifications](./RUNBOOK.md#issue-sos-notifications-not-sending) |
| Sync failing | [RUNBOOK.md#offline-sync](./RUNBOOK.md#issue-offline-sync-failing) |

---

## Review Schedule

| Review Type | Frequency | Participants |
|-------------|-----------|--------------|
| Error Triage | Daily | On-call engineer |
| Performance Review | Weekly | Engineering team |
| Capacity Planning | Monthly | Engineering + DevOps |
| SLA Review | Quarterly | All stakeholders |

