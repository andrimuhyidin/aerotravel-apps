#!/usr/bin/env node
/**
 * Generate Migration Commands
 * This will output ready-to-use SQL that you can copy-paste
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

console.log('🚀 Migration SQL Generator\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const migrations = [
  {
    file: 'supabase/migrations/20250225000013_121-package-reviews-system.sql',
    name: 'Package Reviews System',
  },
  {
    file: 'supabase/migrations/20250225000014_122-analytics-ab-testing-feedback.sql',
    name: 'Analytics & Feedback System',
  },
];

// Combine all migrations into single file
let combinedSQL = `-- =====================================================
-- AUTOMATED MIGRATION SCRIPT
-- Generated: ${new Date().toISOString()}
-- =====================================================

-- This file combines all pending migrations
-- Execute this entire file in Supabase SQL Editor

`;

migrations.forEach((migration, index) => {
  console.log(`📄 Reading: ${migration.name}`);
  
  try {
    const sql = readFileSync(resolve(process.cwd(), migration.file), 'utf8');
    
    combinedSQL += `\n-- =====================================================\n`;
    combinedSQL += `-- Migration ${index + 1}: ${migration.name}\n`;
    combinedSQL += `-- File: ${migration.file}\n`;
    combinedSQL += `-- =====================================================\n\n`;
    combinedSQL += sql;
    combinedSQL += `\n\n`;
    
    console.log(`   ✅ Added (${(sql.length / 1024).toFixed(2)} KB)\n`);
  } catch (error) {
    console.error(`   ❌ Failed to read: ${error.message}\n`);
  }
});

// Write combined SQL to output file
const outputFile = 'supabase/migrations/COMBINED_MIGRATION.sql';
writeFileSync(resolve(process.cwd(), outputFile), combinedSQL, 'utf8');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`✅ Combined SQL file created: ${outputFile}\n`);
console.log('📋 NEXT STEPS:\n');
console.log('1. Open Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new\n');
console.log('2. Copy entire content from:');
console.log(`   ${outputFile}\n`);
console.log('3. Paste into SQL Editor\n');
console.log('4. Click "Run" button\n');
console.log('5. Verify success (check for green checkmarks)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Also print quick stats
const stats = `
📊 Migration Statistics:
   Total migrations: ${migrations.length}
   Combined file size: ${(combinedSQL.length / 1024).toFixed(2)} KB
   Total lines: ${combinedSQL.split('\n').length}
`;

console.log(stats);
console.log('🎯 Ready for execution!\n');

