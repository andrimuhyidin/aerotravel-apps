#!/usr/bin/env node
/**
 * Script to apply employee fields migration
 * Usage: node scripts/apply-employee-fields-migration.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envContent = readFileSync('.env.local', 'utf8');
    const envVars = {};
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value.trim();
      }
    });
    return envVars;
  } catch (error) {
    console.error('❌ Error loading .env.local:', error.message);
    process.exit(1);
  }
}

async function runMigration() {
  console.log('🚀 Applying employee fields migration...\n');

  const env = loadEnv();
  const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local');
    console.error('💡 Please ensure DATABASE_URL is set in .env.local');
    process.exit(1);
  }

  const migrationFile = join(__dirname, '..', 'supabase', 'migrations', '20250124000003_061-add-employee-fields.sql');
  
  let migrationSQL;
  try {
    migrationSQL = readFileSync(migrationFile, 'utf8');
  } catch (error) {
    console.error(`❌ Error reading migration file: ${migrationFile}`);
    console.error(error.message);
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('📦 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('📝 Executing migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...');
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name IN ('employee_number', 'hire_date', 'supervisor_id', 'home_address')
      ORDER BY column_name;
    `;

    const result = await client.query(verifyQuery);
    
    if (result.rows.length === 4) {
      console.log('✅ All employee fields added successfully:');
      result.rows.forEach((row) => {
        console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('⚠️  Warning: Some fields may not have been added correctly');
      console.log('   Expected 4 fields, found:', result.rows.length);
    }

    // Check indexes
    console.log('\n🔍 Verifying indexes...');
    const indexQuery = `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'users'
        AND indexname IN ('idx_users_employee_number', 'idx_users_supervisor_id');
    `;

    const indexResult = await client.query(indexQuery);
    if (indexResult.rows.length === 2) {
      console.log('✅ All indexes created successfully:');
      indexResult.rows.forEach((row) => {
        console.log(`   - ${row.indexname}`);
      });
    } else {
      console.log('⚠️  Warning: Some indexes may not have been created');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: pnpm update-types');
    console.log('   2. Test API endpoints:');
    console.log('      - GET /api/admin/users/[userId]');
    console.log('      - PATCH /api/admin/users/[userId]');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Some objects may already exist (this is OK if migration was already applied)');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

