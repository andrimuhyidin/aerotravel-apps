#!/usr/bin/env node
/**
 * Verify Translation Keys
 * Check that all required translation keys exist
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const messagesPath = join(__dirname, '..', 'messages', 'id.json');

try {
  const messages = JSON.parse(readFileSync(messagesPath, 'utf-8'));
  
  console.log('🔍 Verifying translation keys...\n');
  
  // Check guide.contracts keys
  const contracts = messages.guide?.contracts;
  
  if (!contracts) {
    console.error('❌ guide.contracts not found in messages/id.json');
    console.log('\nAvailable guide keys:', Object.keys(messages.guide || {}));
    process.exit(1);
  }
  
  if (!contracts.title) {
    console.error('❌ guide.contracts.title not found');
    process.exit(1);
  }
  
  if (!contracts.description) {
    console.error('❌ guide.contracts.description not found');
    process.exit(1);
  }
  
  console.log('✅ All translation keys found:');
  console.log(`   guide.contracts.title: "${contracts.title}"`);
  console.log(`   guide.contracts.description: "${contracts.description}"`);
  console.log('\n💡 If error persists, try:');
  console.log('   1. Restart Next.js dev server');
  console.log('   2. Clear .next cache: rm -rf .next');
  console.log('   3. Hard refresh browser: Ctrl+Shift+R');
  
} catch (error) {
  console.error('❌ Error reading messages file:', error.message);
  process.exit(1);
}
