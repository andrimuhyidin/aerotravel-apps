# 🚀 Deployment Guide: Legal Compliance Features

## Prerequisites

- [x] Node.js >= 20.19.0
- [x] Supabase CLI installed (`npm install -g supabase`)
- [x] PostgreSQL client (psql)
- [x] Vercel CLI (for cron setup): `npm install -g vercel`

## Step 1: Environment Setup

### 1.1 Copy Environment Template
```bash
cp .env.compliance.example .env.local
```

### 1.2 Fill in Required Values
Edit `.env.local` and set:
- `CRON_SECRET`: Generate with `openssl rand -base64 32`
- `RESEND_API_KEY`: Get from https://resend.com
- `SUPABASE_URL` and keys from Supabase dashboard
- `DATABASE_URL` for migrations

**Critical:** Never commit `.env.local` to git!

## Step 2: Database Migrations

### 2.1 Run All Migrations
```bash
# Using Supabase CLI
supabase db push

# Or using psql directly
psql $DATABASE_URL -f supabase/migrations/20260102100000_business-licenses.sql
psql $DATABASE_URL -f supabase/migrations/20250123000006_049-guide-certifications.sql
psql $DATABASE_URL -f supabase/migrations/20260103200015_143-pdp-consent-management.sql
psql $DATABASE_URL -f supabase/migrations/20260103200016_144-mra-tp-certifications.sql
psql $DATABASE_URL -f supabase/migrations/20260103200017_145-permenparekraf-self-assessment.sql
```

### 2.2 Verify Migrations
```bash
# Check if tables exist
psql $DATABASE_URL -c "\dt"

# Check for consent_purposes table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM consent_purposes;"
```

## Step 3: Seed Data

### 3.1 Run Seed Scripts
```bash
# Consent purposes
psql $DATABASE_URL -f supabase/seed/001-consent-purposes.sql

# MRA-TP competency units
psql $DATABASE_URL -f supabase/seed/002-mra-tp-competency-units.sql

# Permenparekraf criteria
psql $DATABASE_URL -f supabase/seed/003-permenparekraf-criteria.sql
```

### 3.2 Verify Seed Data
```bash
# Check consent purposes
psql $DATABASE_URL -c "SELECT COUNT(*) FROM consent_purposes;"
# Expected: 12 records

# Check competency units
psql $DATABASE_URL -c "SELECT COUNT(*) FROM mra_tp_competency_units;"
# Expected: 25+ records

# Check criteria
psql $DATABASE_URL -c "SELECT COUNT(*) FROM permenparekraf_criteria;"
# Expected: 30+ records
```

## Step 4: Cron Job Setup (Vercel)

### 4.1 Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 4.2 Add Cron Secret to Vercel
```bash
# Add CRON_SECRET environment variable
vercel env add CRON_SECRET
# Paste your generated secret
```

### 4.3 Enable Vercel Cron
The cron jobs are configured in `vercel.cron.json` and will be automatically enabled on deployment.

### 4.4 Test Cron Endpoints Manually
```bash
# Test license expiry check
curl -X POST https://your-app.vercel.app/api/cron/license-expiry \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test certification expiry
curl -X POST https://your-app.vercel.app/api/cron/certification-expiry \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test data retention cleanup
curl -X POST https://your-app.vercel.app/api/cron/data-retention \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "job": "license-expiry-check",
  "timestamp": "2026-01-03T10:00:00.000Z",
  "result": {
    "success": true,
    "alertsSent": 0,
    "errors": 0
  }
}
```

## Step 5: Email Alerts Setup

### 5.1 Verify Resend API Key
```bash
# Test email sending
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@aerotravel.com",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'
```

### 5.2 Configure Email Recipients
Update in `.env.local`:
```env
COMPLIANCE_EMAIL=ops@aerotravel.com
DPO_EMAIL=dpo@aerotravel.com
LEGAL_EMAIL=legal@aerotravel.com
```

## Step 6: Verification

### 6.1 Run Automated Deployment Script
```bash
# Make script executable (already done)
chmod +x scripts/deploy-compliance.sh

# Run deployment
./scripts/deploy-compliance.sh
```

### 6.2 Manual Verification Checklist
- [ ] Database migrations applied successfully
- [ ] Seed data loaded (12 consent purposes, 25+ competency units)
- [ ] All API endpoints responding (test via Postman/curl)
- [ ] Cron jobs scheduled in Vercel dashboard
- [ ] Email alerts working (send test email)
- [ ] Compliance dashboard accessible
- [ ] Privacy policy page visible
- [ ] DPO contact page visible
- [ ] Consent form working on signup

### 6.3 Test Critical User Flows

**Flow 1: User Signup with Consent**
1. Navigate to `/signup`
2. Fill in user details
3. See consent form with granular options
4. Agree to mandatory consents
5. Submit and verify consents recorded

**Flow 2: Data Export Request**
1. Login as user
2. Navigate to `/settings/privacy`
3. Request data export (JSON)
4. Verify email received
5. Download export file

**Flow 3: Admin License Management**
1. Login as admin
2. Navigate to `/dashboard/compliance/licenses`
3. View all licenses
4. Check expiry dates
5. Verify alerts visible for expiring licenses

**Flow 4: Guide Certification Upload**
1. Login as guide
2. Navigate to `/mobile/guide/certifications/mra-tp`
3. Upload certification
4. Verify status shows "Pending"
5. Admin verifies → status changes to "Verified"

## Step 7: Monitoring Setup

### 7.1 Check Logs
```bash
# Vercel logs
vercel logs --follow

# Or check in Vercel dashboard
```

### 7.2 Setup Alerts
- Sentry for error tracking
- Vercel monitoring for uptime
- Custom alerts for compliance events

## Step 8: Team Training

### 8.1 Admin Training (2-3 hours)
- License management workflow
- Certification verification
- Self-assessment procedures
- Breach reporting protocol

### 8.2 Guide Training (1 hour)
- Certification upload process
- Competency tracking
- Data privacy rights

### 8.3 Documentation
- Admin guides in `/docs/admin/`
- User guides in `/docs/user/`
- API documentation in `/docs/API.md`

## Troubleshooting

### Issue: Migrations Fail
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check for conflicting tables
psql $DATABASE_URL -c "\dt"

# Drop and recreate if needed (DEV ONLY)
# supabase db reset
```

### Issue: Cron Jobs Not Running
1. Check Vercel dashboard → Cron tab
2. Verify `CRON_SECRET` env var set
3. Check cron endpoint logs
4. Test manually with curl

### Issue: Email Alerts Not Sending
1. Verify Resend API key valid
2. Check email addresses configured
3. Test with Resend API directly
4. Check Resend dashboard for errors

### Issue: Seeding Fails
```bash
# Check for duplicate key errors
# If data already exists, truncate tables first
psql $DATABASE_URL -c "TRUNCATE consent_purposes CASCADE;"

# Re-run seed script
psql $DATABASE_URL -f supabase/seed/001-consent-purposes.sql
```

## Production Checklist

Before going live:
- [ ] All env vars set in production
- [ ] Database backups configured
- [ ] Monitoring & alerts active
- [ ] Team trained
- [ ] Documentation reviewed
- [ ] Test all critical flows
- [ ] Legal review completed
- [ ] DPO contact published
- [ ] Privacy policy published
- [ ] User consent flow tested

## Rollback Plan

If issues occur:
1. Disable cron jobs in Vercel
2. Revert database migrations if needed
3. Restore from backup
4. Notify affected users
5. Document incident
6. Fix and redeploy

## Support Contacts

- **Technical Issues:** dev@aerotravel.com
- **Compliance Questions:** dpo@aerotravel.com
- **Operations:** ops@aerotravel.com
- **Emergency:** Call ops manager directly

## Next Steps

After deployment:
1. Monitor for 48 hours
2. Verify cron jobs running
3. Check email alerts working
4. Review compliance dashboard
5. Schedule first self-assessment
6. Plan quarterly compliance review

---

**Deployment Status:** Ready for Production ✅  
**Last Updated:** 3 Januari 2026  
**Version:** 1.0.0
