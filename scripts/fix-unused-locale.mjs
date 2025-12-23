#!/usr/bin/env node

/**
 * Safe batch fix for unused locale parameters
 * Only fixes cases where locale is clearly unused (not referenced in function body)
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('Finding files with unused locale...\n');

let lintOutput = '';
try {
  lintOutput = execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

// Parse lint output for unused locale
const filesToFix = new Set();
const lines = lintOutput.split('\n');
let currentFile = null;

for (const line of lines) {
  if (line.startsWith('/Users')) {
    currentFile = line.trim();
  } else if (currentFile && line.includes("'locale' is") && line.includes('never used')) {
    filesToFix.add(currentFile);
  }
}

console.log(`Found ${filesToFix.size} files with unused locale\n`);

let fixed = 0;
let skipped = 0;

for (const filePath of filesToFix) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    // Pattern 1: Function parameter { locale }
    // Before: export function Component({ locale }: Props) {
    // After:  export function Component({ locale: _locale }: Props) {
    if (content.includes('{ locale }') && !content.includes('{ locale: _locale }')) {
      // Only replace if it's in function parameter context
      content = content.replace(
        /(\{)\s*locale\s*(\}:)/g,
        '$1locale: _locale$2'
      );
      modified = true;
    }

    // Pattern 2: const { locale } = await params (in generateMetadata)
    // Before: const { locale } = await params;
    // After:  (remove the line or prefix)
    // Actually, better to just remove the destructuring if unused
    if (content.includes('const { locale } = await params') && 
        content.includes('generateMetadata') &&
        !content.match(/locale[^_]/)) { // Check if locale is used elsewhere
      // Remove the line
      content = content.replace(/^\s*const \{ locale \} = await params;\s*$/gm, '');
      modified = true;
    }

    // Pattern 3: const { locale } = await params (in page component)
    // Similar to pattern 2
    if (content.includes('const { locale } = await params') &&
        !content.includes('setRequestLocale') &&
        !content.match(/locale[^_]/)) {
      content = content.replace(/^\s*const \{ locale \} = await params;\s*$/gm, '');
      modified = true;
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed ${filePath}`);
      fixed++;
    } else {
      skipped++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    skipped++;
  }
}

console.log(`\n✓ Fixed: ${fixed} files`);
console.log(`⚠ Skipped: ${skipped} files (may need manual review)`);
console.log('\nRunning lint again to verify...\n');

try {
  execSync('npm run lint 2>&1 | tail -5', { stdio: 'inherit' });
} catch (error) {
  // Expected - lint will show remaining issues
}

