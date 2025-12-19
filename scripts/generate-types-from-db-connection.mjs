#!/usr/bin/env node

/**
 * Generate Supabase TypeScript types using database connection
 * Alternative method when access token is not available
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
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
}

async function generateTypes() {
  console.log('🔄 Generating Supabase types using database connection...\n');
  
  const env = loadEnv();
  const projectId = 'mjzukilsgkdqmcusjdut';
  
  // Try method 1: Using access token if available
  if (env.SUPABASE_ACCESS_TOKEN) {
    console.log('✅ Using access token method...');
    try {
      process.env.SUPABASE_ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
      execSync(
        `npx supabase gen types typescript --project-id ${projectId} > types/supabase.ts`,
        { stdio: 'inherit', env: { ...process.env, SUPABASE_ACCESS_TOKEN: env.SUPABASE_ACCESS_TOKEN } }
      );
      console.log('\n✅ Types generated successfully using access token!');
      return;
    } catch (error) {
      console.error('❌ Failed with access token:', error.message);
    }
  }
  
  // Try method 2: Using Supabase CLI login (interactive)
  console.log('⚠️  Access token not found. Trying alternative methods...\n');
  console.log('💡 Recommended: Get access token from https://app.supabase.com/account/tokens');
  console.log('   Then add to .env.local: SUPABASE_ACCESS_TOKEN=your_token\n');
  
  // Try method 3: Direct database connection (requires pg_dump or similar)
  console.log('📝 Alternative: You can also:');
  console.log('   1. Run: npx supabase login');
  console.log('   2. Then run: npm run update-types');
  console.log('\n   Or manually:');
  console.log(`   npx supabase gen types typescript --project-id ${projectId} > types/supabase.ts`);
}

generateTypes();

