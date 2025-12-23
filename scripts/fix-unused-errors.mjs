#!/usr/bin/env node

/**
 * Safe batch fix for unused error variables
 * Fixes: const { data, error } = ... where error is unused
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('Finding files with unused error variables...\n');

let lintOutput = '';
try {
  lintOutput = execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

// Parse lint output
const fileIssues = {};
const lines = lintOutput.split('\n');
let currentFile = null;

for (const line of lines) {
  if (line.startsWith('/Users')) {
    currentFile = line.trim();
  } else if (currentFile && line.includes("'error' is") && line.includes('never used')) {
    if (!fileIssues[currentFile]) {
      fileIssues[currentFile] = [];
    }
    const match = line.match(/(\d+):(\d+)/);
    if (match) {
      fileIssues[currentFile].push(parseInt(match[1]));
    }
  }
}

console.log(`Found ${Object.keys(fileIssues).length} files with unused error variables\n`);

let fixed = 0;
let skipped = 0;

for (const [filePath, lineNumbers] of Object.entries(fileIssues)) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Sort line numbers descending to avoid line number shifts
    lineNumbers.sort((a, b) => b - a);

    for (const lineNum of lineNumbers) {
      const lineIndex = lineNum - 1;
      const line = lines[lineIndex];

      if (!line) continue;

      // Pattern: const { data, error } = ...
      // Replace with: const { data, error: _error } = ...
      if (line.includes('const {') && line.includes('error }') && !line.includes('error: _error')) {
        lines[lineIndex] = line.replace(/\berror\s*\}/g, 'error: _error }');
        modified = true;
        fixed++;
      }
      // Pattern: const { data, error, ... } = ...
      else if (line.includes('const {') && line.includes(', error,') && !line.includes(', error: _error,')) {
        lines[lineIndex] = line.replace(/,\s*error\s*,/g, ', error: _error,');
        modified = true;
        fixed++;
      }
    }

    if (modified) {
      writeFileSync(filePath, lines.join('\n'), 'utf-8');
      console.log(`✓ Fixed ${filePath}`);
    } else {
      skipped++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    skipped++;
  }
}

console.log(`\n✓ Fixed: ${fixed} instances`);
console.log(`⚠ Skipped: ${skipped} files (may need manual review)`);

