# Operations Runbook

## Overview

This runbook provides procedures for common operational tasks and incident response.

---

## Table of Contents

1. [Common Issues](#common-issues)
2. [Alert Handling](#alert-handling)
3. [Scaling Procedures](#scaling-procedures)
4. [Emergency Procedures](#emergency-procedures)
5. [Maintenance Tasks](#maintenance-tasks)

---

## Common Issues

### Issue: High API Response Time

**Symptoms:**
- API responses > 500ms
- User complaints about slow loading

**Diagnosis:**
```bash
# Check Vercel function logs
vercel logs --follow

# Check Supabase dashboard for slow queries
# Supabase Dashboard > Database > Query Performance
```

**Resolution:**
1. Check for N+1 queries in API routes
2. Verify database indexes are in place
3. Check if rate limiting is causing queuing
4. Scale up if needed (see Scaling section)

---

### Issue: Rate Limit Errors (429)

**Symptoms:**
- Users getting "Too many requests" errors
- 429 status codes in logs

**Diagnosis:**
```bash
# Check Upstash Redis
# View rate limit counters in Upstash dashboard
```

**Resolution:**
1. Identify the user/IP causing excessive requests
2. If legitimate traffic, temporarily increase limits:
   ```typescript
   // lib/rate-limit/guide-limits.ts
   ai: { limit: 20, window: '1m' }, // Temporarily increase
   ```
3. Deploy updated limits
4. Monitor and revert after peak

---

### Issue: SOS Notifications Not Sending

**Symptoms:**
- SOS triggered but WhatsApp/Email not received

**Diagnosis:**
1. Check Sentry for errors in `/api/guide/sos`
2. Check Resend dashboard for email failures
3. Check WhatsApp API status

**Resolution:**
1. Verify API keys are valid
2. Check rate limits on external services
3. Verify recipient phone/email is valid
4. Fallback: Manually notify emergency contacts

**Escalation:**
- If SOS is completely broken, escalate to on-call immediately
- Priority: P0 - Life safety issue

---

### Issue: Offline Sync Failing

**Symptoms:**
- Data not syncing when coming back online
- Users losing data

**Diagnosis:**
```javascript
// In browser console
indexedDB.databases().then(console.log);
```

**Resolution:**
1. Clear IndexedDB for affected user:
   ```javascript
   indexedDB.deleteDatabase('guide-app-db');
   ```
2. User logs out and back in
3. If widespread, check sync endpoint health

---

### Issue: AI Features Returning Errors

**Symptoms:**
- Voice commands not working
- AI insights failing

**Diagnosis:**
1. Check Google Cloud Console for quota usage
2. Check Sentry for specific error messages

**Resolution:**
1. If quota exceeded, wait or increase quota
2. If API key invalid, rotate key:
   ```bash
   # In Vercel/hosting dashboard
   # Update GOOGLE_GEMINI_API_KEY
   ```
3. Fallback: Disable AI features temporarily

---

## Alert Handling

### P0 - Critical (Immediate Response)

**Criteria:**
- SOS system completely down
- Authentication broken
- Data loss occurring

**Response Time:** 15 minutes

**Procedure:**
1. Acknowledge alert in PagerDuty/Slack
2. Join incident channel
3. Assess impact scope
4. Begin mitigation (rollback if needed)
5. Communicate status to stakeholders
6. Post-incident review within 24 hours

---

### P1 - High (Response within 1 hour)

**Criteria:**
- Core features degraded (trips, attendance)
- Widespread errors (>5% of requests)
- External service outage affecting functionality

**Procedure:**
1. Acknowledge alert
2. Investigate root cause
3. Implement fix or workaround
4. Monitor for recurrence
5. Document in incident log

---

### P2 - Medium (Response within 4 hours)

**Criteria:**
- Non-critical feature issues
- Performance degradation
- Intermittent errors

**Procedure:**
1. Log issue in tracking system
2. Schedule investigation
3. Fix in next deployment cycle

---

### P3 - Low (Response within 24 hours)

**Criteria:**
- UI bugs
- Minor feature issues
- Enhancement requests

**Procedure:**
1. Log in backlog
2. Prioritize with product team

---

## Scaling Procedures

### Horizontal Scaling (Vercel)

Vercel automatically scales. If hitting limits:

1. Check Vercel dashboard for function limits
2. Upgrade plan if needed
3. Optimize slow functions

### Database Scaling (Supabase)

**Signs you need to scale:**
- Connection pool exhausted
- Query times increasing
- Storage approaching limit

**Procedure:**
1. Check Supabase usage dashboard
2. Upgrade compute size:
   - Dashboard > Settings > Compute
   - Select larger instance
3. Add read replicas if read-heavy
4. Consider pgBouncer for connection pooling

### Redis Scaling (Upstash)

**Signs:**
- Rate limit commands timing out
- Memory usage high

**Procedure:**
1. Upgrade Upstash plan
2. Or increase rate limit windows (less strict)

---

## Emergency Procedures

### Complete Outage

1. Check status pages:
   - status.vercel.com
   - status.supabase.com
   - status.upstash.com

2. If our issue:
   - Rollback to last known good deployment
   - Enable maintenance mode if needed

3. Communication:
   - Update status page
   - Notify customers via backup channel (email)

### Data Breach Suspected

1. **DO NOT** attempt to cover up
2. Immediately notify:
   - Security team lead
   - CTO
   - Legal counsel

3. Preserve evidence:
   - Do not delete logs
   - Screenshot relevant data

4. Contain the breach:
   - Revoke compromised credentials
   - Block suspicious IPs

5. Follow incident response plan

### Database Corruption

1. Stop all write operations
2. Enable maintenance mode
3. Restore from latest backup:
   ```bash
   supabase db restore --backup-id <backup_id>
   ```
4. Verify data integrity
5. Resume operations
6. Investigate root cause

---

## Maintenance Tasks

### Daily

- [ ] Review Sentry errors
- [ ] Check API response times
- [ ] Verify critical flows working

### Weekly

- [ ] Review PostHog analytics
- [ ] Check database performance
- [ ] Update dependencies (patch versions)
- [ ] Review rate limit metrics

### Monthly

- [ ] Security audit
- [ ] Performance review
- [ ] Backup restoration test
- [ ] Rotate API keys (if policy requires)

### Quarterly

- [ ] Major dependency updates
- [ ] Infrastructure review
- [ ] Disaster recovery drill
- [ ] Documentation update

---

## Contact Information

### On-Call Rotation

| Role | Primary | Secondary |
|------|---------|-----------|
| Backend | [Name] | [Name] |
| Frontend | [Name] | [Name] |
| DevOps | [Name] | [Name] |
| Security | [Name] | [Name] |

### External Contacts

| Service | Support URL |
|---------|-------------|
| Vercel | support.vercel.com |
| Supabase | supabase.com/support |
| Upstash | upstash.com/support |
| Resend | resend.com/support |

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-02 | 1.0 | Initial runbook |

