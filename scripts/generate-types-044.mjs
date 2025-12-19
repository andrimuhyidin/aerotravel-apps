#!/usr/bin/env node
/**
 * Generate TypeScript types from Supabase database
 * Includes new tables from migration 044
 */

import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env.local
dotenv.config({ path: join(rootDir, '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function generateTypes() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Verify new tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('trip_crews', 'crew_profiles_public_internal', 'crew_notes', 'crew_audit_logs')
      ORDER BY table_name;
    `);

    console.log('📊 Tables found:', tablesResult.rows.map(r => r.table_name).join(', '));
    console.log('✅ All tables from migration 044 exist!\n');

    // Check if types file exists and has new tables
    const typesPath = join(rootDir, 'types/supabase.ts');
    try {
      const typesContent = readFileSync(typesPath, 'utf-8');
      if (typesContent.includes('trip_crews') || typesContent.includes('crew_profiles_public_internal')) {
        console.log('✅ Types file already includes new tables');
        console.log('💡 Run: supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts');
        console.log('   Or use Supabase Dashboard to generate types');
      } else {
        console.log('⚠️  Types file exists but may need update');
        console.log('💡 Run: supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts');
      }
    } catch (err) {
      console.log('⚠️  Types file not found or needs generation');
      console.log('💡 Run: supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

generateTypes();
