#!/usr/bin/env node

/**
 * Generate Supabase TypeScript types directly from database
 * Uses service role key to connect and fetch schema
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars from .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error loading .env.local:', error.message);
    process.exit(1);
  }
}

async function generateTypes() {
  console.log('🔄 Generating Supabase types from database...\n');
  
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  console.log('📡 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    // Use Supabase CLI's type generation via API
    // This is a workaround - we'll use the CLI but with a different approach
    console.log('⚠️  Direct database type generation requires Supabase CLI access token.');
    console.log('💡 Please run: npx supabase login');
    console.log('   Then run: npm run update-types');
    console.log('\n📝 Alternatively, you can:');
    console.log('   1. Get access token from: https://app.supabase.com/account/tokens');
    console.log('   2. Set SUPABASE_ACCESS_TOKEN in .env.local');
    console.log('   3. Run: npm run update-types');
    
    process.exit(1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateTypes();

