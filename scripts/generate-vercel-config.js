/**
 * Generate vercel.json based on VERCEL_PLAN environment variable
 * 
 * Usage:
 *   VERCEL_PLAN=hobby node scripts/generate-vercel-config.js
 *   VERCEL_PLAN=pro node scripts/generate-vercel-config.js
 * 
 * This script is run during build to configure cron jobs based on plan.
 */

const fs = require('fs');
const path = require('path');

// Get plan from environment (default: hobby)
const plan = process.env.VERCEL_PLAN || 'hobby';

console.log(`[vercel-config] Generating vercel.json for plan: ${plan.toUpperCase()}`);

// Hobby plan configuration (max 2 crons, daily minimum)
const hobbyConfig = {
  crons: [
    {
      path: '/api/cron/daily-tasks',
      schedule: '0 0 * * *', // Daily at midnight UTC
    },
  ],
};

// Pro plan configuration (unlimited crons, any schedule)
const proConfig = {
  crons: [
    {
      path: '/api/cron/license-expiry',
      schedule: '0 0 * * *', // Daily at midnight UTC
    },
    {
      path: '/api/cron/certification-expiry',
      schedule: '0 1 * * *', // Daily at 1 AM UTC
    },
    {
      path: '/api/cron/data-retention',
      schedule: '0 2 * * *', // Daily at 2 AM UTC
    },
    {
      path: '/api/cron/wallet-balance-sync',
      schedule: '0 3 * * *', // Daily at 3 AM UTC
    },
    {
      path: '/api/cron/booking-reminders',
      schedule: '0 6 * * *', // Daily at 6 AM UTC (1 PM WIB)
    },
    {
      path: '/api/cron/trip-status-check',
      schedule: '*/15 * * * *', // Every 15 minutes
    },
    {
      path: '/api/cron/payment-status-check',
      schedule: '*/30 * * * *', // Every 30 minutes
    },
    {
      path: '/api/cron/assessment-reminder',
      schedule: '0 9 1 * *', // Monthly 1st at 9 AM UTC
    },
    {
      path: '/api/cron/guide-availability-refresh',
      schedule: '0 4 * * 1', // Weekly Monday at 4 AM UTC
    },
    {
      path: '/api/cron/analytics-aggregation',
      schedule: '0 5 * * *', // Daily at 5 AM UTC
    },
    {
      path: '/api/cron/cache-warmup',
      schedule: '0 23 * * *', // Daily at 11 PM UTC
    },
  ],
};

// Select config based on plan
const config = plan === 'pro' ? proConfig : hobbyConfig;

// Write vercel.json
const outputPath = path.join(__dirname, '..', 'vercel.json');
fs.writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n');

console.log(`[vercel-config] Generated vercel.json with ${config.crons.length} cron job(s)`);
config.crons.forEach((cron, i) => {
  console.log(`  ${i + 1}. ${cron.path} - ${cron.schedule}`);
});
console.log('[vercel-config] Done!');
