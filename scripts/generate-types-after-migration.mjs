#!/usr/bin/env node
/**
 * Generate TypeScript Types After Migration
 * Runs pnpm update-types with proper error handling
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('📝 Generating TypeScript types...\n');

try {
  execSync('pnpm update-types', {
    stdio: 'inherit',
    cwd: projectRoot,
  });
  console.log('\n✅ Types generated successfully!');
  console.log('📄 File: types/supabase.ts');
} catch (error) {
  console.error('\n❌ Type generation failed');
  console.log('\n📋 Manual steps:');
  console.log('   1. Ensure SUPABASE_PROJECT_ID or SUPABASE_ACCESS_TOKEN is set');
  console.log('   2. Run: pnpm update-types');
  console.log('   3. Or: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts');
  process.exit(1);
}

