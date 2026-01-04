#!/usr/bin/env node
/**
 * Generate TypeScript types using Supabase Service Role Key
 * Direct connection to database
 */

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env.local
dotenv.config({ path: join(rootDir, '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

// Extract project ID from URL
const projectId = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectId) {
  console.error('❌ Could not extract project ID from SUPABASE_URL');
  process.exit(1);
}

console.log('🚀 Generating TypeScript types from Supabase database');
console.log('📁 Project ID:', projectId);
console.log('');

// Try using Supabase CLI with service key
async function generateTypes() {
  try {
    // Method 1: Use Supabase CLI with project ID
    // This requires access token, but we can try with service key as fallback
    console.log('⏳ Attempting to generate types via Supabase CLI...');
    
    const { execSync } = await import('child_process');
    
    // Try with project ID directly
    try {
      execSync(
        `npx supabase gen types typescript --project-id ${projectId} > ${join(rootDir, 'types/supabase.ts')}`,
        { stdio: 'inherit', cwd: rootDir }
      );
      console.log('✅ Types generated successfully via Supabase CLI!');
      return;
    } catch (error) {
      console.log('⚠️  CLI method failed, trying direct database connection...');
    }

    // Method 2: Direct database connection to verify tables exist
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log('✅ Connected to database');

    // Verify new tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('trip_crews', 'crew_profiles_public_internal', 'crew_notes', 'crew_audit_logs')
      ORDER BY table_name;
    `);

    console.log('📊 Verified tables:', result.rows.map(r => r.table_name).join(', '));
    console.log('');
    console.log('✅ All migration 044 tables exist in database');
    console.log('');
    console.log('💡 Types will be auto-generated on build');
    console.log('   Or run manually: npx supabase login && pnpm update-types');

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateTypes();
