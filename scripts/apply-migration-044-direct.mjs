#!/usr/bin/env node
/**
 * Script to apply migration 044 directly to Supabase database
 * Uses Supabase connection string from .env.local
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env.local
dotenv.config({ path: join(rootDir, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY not found in .env.local');
  console.error('⚠️  Need service role key to execute SQL directly');
  process.exit(1);
}

// Read migration file
const migrationPath = join(rootDir, 'supabase/migrations/20250123000001_044-multi-guide-crew-directory.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('🚀 Applying Migration 044: Multi-Guide Crew Directory');
console.log('📁 File:', migrationPath);
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('');

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Execute migration
async function applyMigration() {
  try {
    console.log('⏳ Executing migration SQL...');
    
    // Split SQL by semicolons and execute each statement
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use REST API or PostgREST
    
    // Alternative: Use Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql: migrationSQL }),
    });

    if (!response.ok) {
      // Try alternative: Use PostgREST or direct connection
      console.log('⚠️  REST API method not available, trying alternative...');
      throw new Error('REST API method failed');
    }

    const result = await response.json();
    console.log('✅ Migration applied successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('');
    console.log('📋 Alternative: Apply manually via Supabase Dashboard');
    console.log('1. Go to: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql/new');
    console.log('2. Copy content from:', migrationPath);
    console.log('3. Paste and execute');
    process.exit(1);
  }
}

applyMigration();
