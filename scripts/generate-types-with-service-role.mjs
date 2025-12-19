#!/usr/bin/env node

/**
 * Generate Supabase types using Service Role Key via Management API
 * This is an alternative when access token is not available
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function generateTypesViaManagementAPI() {
  console.log('🔄 Attempting to generate types via Management API...\n');
  
  const env = loadEnv();
  const projectId = 'mjzukilsgkdqmcusjdut';
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    return false;
  }
  
  try {
    // Try to use Supabase Management API
    // Note: Management API typically requires access token, not service role key
    // But we can try to fetch schema information
    
    console.log('⚠️  Management API requires access token, not service role key.');
    console.log('💡 Please use one of these methods:\n');
    console.log('   Method 1 (Recommended):');
    console.log('   1. Go to: https://app.supabase.com/account/tokens');
    console.log('   2. Create Personal Access Token');
    console.log('   3. Add to .env.local: SUPABASE_ACCESS_TOKEN=your_token');
    console.log('   4. Run: npm run update-types\n');
    
    console.log('   Method 2 (Interactive):');
    console.log('   1. Run: npx supabase login');
    console.log('   2. Follow browser login');
    console.log('   3. Run: npm run update-types\n');
    
    return false;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

generateTypesViaManagementAPI();

