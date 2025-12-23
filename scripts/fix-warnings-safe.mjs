#!/usr/bin/env node

/**
 * Safe batch fix for lint warnings
 * Only fixes patterns that are 100% safe and won't break code
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔒 Safe Lint Warning Fixer\n');
console.log('Only fixing 100% safe patterns:\n');
console.log('  1. Unused imports (via ESLint plugin)');
console.log('  2. Unused catch errors → _error');
console.log('  3. Unused function parameters → _param (when safe)');
console.log('  4. Simple unused variables → _var (when safe)\n');

let lintOutput = '';
try {
  lintOutput = execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

// Parse warnings
const fileWarnings = {};
const lines = lintOutput.split('\n');
let currentFile = null;

for (const line of lines) {
  if (line.startsWith('/Users')) {
    currentFile = line.trim();
    // Skip scripts (lower priority)
    if (currentFile.includes('/scripts/')) {
      currentFile = null;
    }
  } else if (currentFile && line.match(/^\s+\d+:\d+\s+warning/)) {
    const match = line.match(/(\d+):(\d+)\s+warning\s+'([^']+)'\s+(.+?)\s+(@typescript-eslint\/[\w-]+|unused-imports\/[\w-]+)/);
    if (match) {
      const [, lineNum, , varName, message, rule] = match;
      if (!fileWarnings[currentFile]) {
        fileWarnings[currentFile] = [];
      }
      fileWarnings[currentFile].push({
        line: parseInt(lineNum),
        varName,
        message,
        rule,
      });
    }
  }
}

console.log(`Found ${Object.keys(fileWarnings).length} files with warnings\n`);

let totalFixed = 0;
let filesModified = 0;
const stats = {
  catchErrors: 0,
  unusedParams: 0,
  unusedVars: 0,
};

for (const [filePath, warnings] of Object.entries(fileWarnings)) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    warnings.sort((a, b) => b.line - a.line);

    for (const warning of warnings) {
      const { line: lineNum, varName, message, rule } = warning;
      const lineIndex = lineNum - 1;
      const line = lines[lineIndex];

      if (!line || varName.startsWith('_')) continue;

      // Skip any types - too risky to auto-fix
      if (rule === '@typescript-eslint/no-explicit-any') continue;

      // Skip unused imports - handled by ESLint plugin
      if (rule === 'unused-imports/no-unused-imports') continue;

      // Fix 1: Catch block errors (100% safe)
      if (varName === 'error' && line.includes('catch (')) {
        lines[lineIndex] = line.replace(/catch\s*\(\s*error\s*\)/g, 'catch (_error)');
        modified = true;
        totalFixed++;
        stats.catchErrors++;
        continue;
      }

      // Fix 2: Unused function parameters (only when clearly unused)
      if (message.includes('Allowed unused args')) {
        // Pattern: ({ param }) => or (param) =>
        const paramPattern = new RegExp(`(\\{)\\s*${varName}\\s*(\\})`, 'g');
        if (paramPattern.test(line)) {
          lines[lineIndex] = line.replace(paramPattern, `$1${varName}: _${varName}$2`);
          modified = true;
          totalFixed++;
          stats.unusedParams++;
          continue;
        }
      }

      // Fix 3: Simple unused variables (only const/let assignments, not destructuring)
      if ((rule === 'unused-imports/no-unused-vars' || rule === '@typescript-eslint/no-unused-vars') &&
          !message.includes('Allowed unused args')) {
        // Only fix if it's a simple assignment, not destructuring
        if (line.match(/^\s*(const|let)\s+${varName}\s*=/)) {
          // Check if it's used elsewhere in the file
          const fileContent = lines.join('\n');
          const usageCount = (fileContent.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
          
          // If only used once (the declaration), it's safe to prefix
          if (usageCount === 1) {
            lines[lineIndex] = line.replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}`);
            modified = true;
            totalFixed++;
            stats.unusedVars++;
            continue;
          }
        }
      }
    }

    if (modified) {
      writeFileSync(filePath, lines.join('\n'), 'utf-8');
      filesModified++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

console.log(`\n✅ Fixed ${totalFixed} instances in ${filesModified} files\n`);
console.log('Breakdown:');
console.log(`  - Catch errors: ${stats.catchErrors}`);
console.log(`  - Unused parameters: ${stats.unusedParams}`);
console.log(`  - Unused variables: ${stats.unusedVars}`);
console.log(`  - Unused imports: (handled by ESLint plugin)\n`);

console.log('Running lint again to verify...\n');

try {
  execSync('npm run lint 2>&1 | tail -5', { stdio: 'inherit' });
} catch (error) {
  // Expected
}

