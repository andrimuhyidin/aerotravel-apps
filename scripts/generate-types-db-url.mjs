#!/usr/bin/env node
/**
 * Generate Supabase types using DATABASE_URL
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
  
  return env;
}

async function generateTypes() {
  console.log('🔄 Generating Supabase types from database...\n');
  
  const env = loadEnv();
  const databaseUrl = env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }
  
  try {
    console.log('📡 Connecting to database...');
    const output = execSync(
      `npx supabase gen types typescript --db-url "${databaseUrl}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    const typesPath = join(__dirname, '..', 'types/supabase.ts');
    writeFileSync(typesPath, output);
    
    console.log('✅ Types generated successfully!');
    console.log(`📝 Saved to: types/supabase.ts`);
    
    // Verify new tables
    const typesContent = readFileSync(typesPath, 'utf8');
    const newTables = [
      'guide_equipment_checklists',
      'guide_equipment_reports',
      'guide_trip_activity_logs',
      'guide_trip_timeline_shares',
      'guide_performance_goals',
    ];
    
    console.log('\n🔍 Verifying new tables in types...');
    newTables.forEach(table => {
      if (typesContent.includes(`'${table}'`)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ⚠️  ${table} - not found`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating types:', error.message);
    console.log('\n💡 Alternative: Run manually via Supabase Dashboard');
    process.exit(1);
  }
}

generateTypes();

