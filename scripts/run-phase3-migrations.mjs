#!/usr/bin/env node
/**
 * Run Phase 3 Migrations
 * - Compliance Education
 * - Waste Tracking & Carbon Footprint
 * - Mandatory Trainings
 * - Training Reminders Cron
 * - Competency Assessment
 * - Trainer Feedback
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(projectRoot, '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL or SUPABASE_DB_URL not found in .env.local');
  console.error('');
  console.error('💡 Please add DATABASE_URL to .env.local:');
  console.error('   DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres');
  process.exit(1);
}

const migrations = [
  {
    file: 'supabase/migrations/20250126000000_069-compliance-education.sql',
    name: 'Compliance Education',
  },
  {
    file: 'supabase/migrations/20250126000001_070-waste-tracking.sql',
    name: 'Waste Tracking & Carbon Footprint',
  },
  {
    file: 'supabase/migrations/20250126000002_071-mandatory-trainings.sql',
    name: 'Mandatory Trainings',
  },
  {
    file: 'supabase/migrations/20250126000003_072-training-reminders-cron.sql',
    name: 'Training Reminders Cron Functions',
  },
  {
    file: 'supabase/migrations/20250126000004_073-competency-assessment.sql',
    name: 'Competency Assessment',
  },
  {
    file: 'supabase/migrations/20250126000005_074-trainer-feedback.sql',
    name: 'Trainer Feedback',
  },
];

async function runMigration(migration) {
  const filePath = join(projectRoot, migration.file);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    console.log(`📦 Running: ${migration.name}...`);
    console.log(`   File: ${migration.file}`);
    
    // Use psql to run migration
    execSync(`psql "${DATABASE_URL}" -c "${sql.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, {
      stdio: 'inherit',
      cwd: projectRoot,
    });
    
    console.log(`✅ ${migration.name} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error running ${migration.name}:`, error.message);
    return false;
  }
}

async function setupCronJobs() {
  console.log('\n🔧 Setting up Cron Jobs...\n');
  
  const cronSQL = `
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule Training Reminders (Daily at 08:00 UTC)
SELECT cron.schedule(
  'training-reminders-daily',
  '0 8 * * *',
  $$
  SELECT check_mandatory_training_reminders();
  $$
);

-- Verify cron job
SELECT * FROM cron.job WHERE jobname = 'training-reminders-daily';
`;

  try {
    console.log('📅 Scheduling Training Reminders Cron Job...');
    execSync(`psql "${DATABASE_URL}" -c "${cronSQL.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, {
      stdio: 'inherit',
      cwd: projectRoot,
    });
    console.log('✅ Cron jobs setup completed\n');
    return true;
  } catch (error) {
    console.error('⚠️  Warning: Cron job setup may have failed (may already exist)');
    console.error('   Error:', error.message);
    console.error('\n💡 You can manually setup cron jobs in Supabase SQL Editor:');
    console.error('   1. Go to Supabase Dashboard > SQL Editor');
    console.error('   2. Run the SQL from: supabase/migrations/20250126000003_072-training-reminders-cron.sql');
    console.error('   3. Then schedule the cron job manually\n');
    return false;
  }
}

async function main() {
  console.log('🚀 Running Phase 3 Migrations...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    console.log('💡 You can also run migrations manually via Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/[your-project]/sql/new');
  }
  
  // Setup cron jobs
  await setupCronJobs();
  
  console.log('\n🎉 Phase 3 migrations completed!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Verify tables in Supabase Dashboard');
  console.log('   2. Check cron jobs: SELECT * FROM cron.job;');
  console.log('   3. Run: pnpm update-types (to regenerate TypeScript types)');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

