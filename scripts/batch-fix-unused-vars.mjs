#!/usr/bin/env node

/**
 * Batch fix for common unused variable patterns
 * This script safely prefixes unused parameters/variables with _ 
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('Running lint to get list of issues...\n');

let lintOutput = '';
try {
  lintOutput = execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

if (!lintOutput) {
  console.log('No lint output found. Exiting.');
  process.exit(0);
}

// Parse lint output
const issues = [];
const lines = lintOutput.split('\n');
let currentFile = null;

for (const line of lines) {
  if (line.startsWith('/Users')) {
    currentFile = line.trim();
  } else if (currentFile && line.trim().match(/^\d+:\d+\s+warning/)) {
    const match = line.match(/(\d+):(\d+)\s+warning\s+'([^']+)'\s+(.+?)\s+(@typescript-eslint\/[\w-]+)/);
    if (match) {
      const [_, lineNum, col, varName, message, rule] = match;
      
      // Only handle unused-vars with specific patterns
      if (rule === '@typescript-eslint/no-unused-vars') {
        issues.push({
          file: currentFile,
          line: parseInt(lineNum),
          varName,
          message,
        });
      }
    }
  }
}

console.log(`Found ${issues.length} unused variable issues\n`);

// Group by file
const fileGroups = {};
issues.forEach(issue => {
  if (!fileGroups[issue.file]) {
    fileGroups[issue.file] = [];
  }
  fileGroups[issue.file].push(issue);
});

let fixed = 0;
let skipped = 0;

// Process files (only app/ directory, skip scripts/)
Object.entries(fileGroups).forEach(([filePath, fileIssues]) => {
  // Skip scripts directory for now (lower priority)
  if (filePath.includes('/scripts/')) {
    skipped += fileIssues.length;
    return;
  }

  if (!existsSync(filePath)) {
    console.log(`⚠ File not found: ${filePath}`);
    skipped += fileIssues.length;
    return;
  }

  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    fileIssues.forEach(issue => {
      const varName = issue.varName;
      
      // Skip if already prefixed
      if (varName.startsWith('_')) {
        return;
      }

      // Skip common names that might break code
      const skipNames = ['data', 'user', 'result', 'response', 'query'];
      if (skipNames.includes(varName)) {
        return;
      }

      // Pattern 1: Destructured parameter - { foo } => { foo: _foo }
      const destructurePattern = new RegExp(
        `([({,]\\s*)(${varName})(\\s*[,})])`,
        'g'
      );
      
      // Pattern 2: Function parameter - (foo, bar) => (_foo, bar)
      const paramPattern = new RegExp(
        `\\(([^)]*)\\b${varName}\\b([^)]*)\\)\\s*[{:]`,
        'g'
      );

      // Try Pattern 1: Destructured parameter renaming
      const newContent1 = content.replace(
        destructurePattern,
        `$1${varName}: _${varName}$3`
      );

      if (newContent1 !== content) {
        content = newContent1;
        modified = true;
        fixed++;
        return;
      }

      // Try Pattern 2: Simple parameter prefix
      const newContent2 = content.replace(
        paramPattern,
        (match, before, after) => {
          const newBefore = before.replace(
            new RegExp(`\\b${varName}\\b`),
            `_${varName}`
          );
          return `(${newBefore}${after}) {`;
        }
      );

      if (newContent2 !== content) {
        content = newContent2;
        modified = true;
        fixed++;
        return;
      }
    });

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    skipped += fileIssues.length;
  }
});

console.log(`\n✓ Fixed: ${fixed}`);
console.log(`⚠ Skipped: ${skipped} (including ${Object.keys(fileGroups).filter(f => f.includes('/scripts/')).length} script files)`);
console.log('\nNote: Script files in /scripts/ were skipped (lower priority)');

