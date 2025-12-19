#!/usr/bin/env node

/**
 * Alternative method to generate types
 * This script provides instructions and tries alternative methods
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Attempting to generate Supabase types...\n');

// Method 1: Try with SUPABASE_ACCESS_TOKEN from env
const envPath = join(__dirname, '..', '.env.local');
let envContent = '';
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('❌ .env.local not found');
  process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
});

const accessToken = env.SUPABASE_ACCESS_TOKEN;
const projectId = 'mjzukilsgkdqmcusjdut';

if (accessToken) {
  console.log('✅ Access token found, generating types...');
  try {
    process.env.SUPABASE_ACCESS_TOKEN = accessToken;
    execSync(
      `npx supabase gen types typescript --project-id ${projectId} > types/supabase.ts`,
      { stdio: 'inherit', env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken } }
    );
    console.log('\n✅ Types generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to generate types:', error.message);
  }
} else {
  console.log('⚠️  SUPABASE_ACCESS_TOKEN not found in .env.local\n');
  console.log('📝 To generate types, please:');
  console.log('   1. Go to: https://app.supabase.com/account/tokens');
  console.log('   2. Create a new Personal Access Token');
  console.log('   3. Add to .env.local: SUPABASE_ACCESS_TOKEN=your_token_here');
  console.log('   4. Run: npm run update-types\n');
  console.log('💡 Or run manually:');
  console.log(`   npx supabase login`);
  console.log(`   npx supabase gen types typescript --project-id ${projectId} > types/supabase.ts\n`);
}

