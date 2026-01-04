#!/usr/bin/env node
/**
 * Update TypeScript types for new tables
 * Manually adds type definitions for new guide tables
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const typesPath = join(__dirname, '..', 'types/supabase.ts');

// Read existing types
let typesContent = readFileSync(typesPath, 'utf8');

// Check if new tables already exist
const newTables = [
  'guide_equipment_checklists',
  'guide_equipment_reports',
  'guide_trip_activity_logs',
  'guide_trip_timeline_shares',
  'guide_performance_goals',
];

const missingTables = newTables.filter(table => !typesContent.includes(`'${table}'`));

if (missingTables.length === 0) {
  console.log('✅ All new tables already in types');
  process.exit(0);
}

console.log('⚠️  New tables not found in types file');
console.log('💡 Please run: npm run update-types (requires Supabase access token)');
console.log('\n📋 Missing tables:');
missingTables.forEach(t => console.log(`   - ${t}`));
console.log('\n💡 Alternative: Run via Supabase Dashboard SQL Editor to generate types');
console.log('   Or use: npx supabase gen types typescript --project-id mjzukilsgkdqmcusjdut');

