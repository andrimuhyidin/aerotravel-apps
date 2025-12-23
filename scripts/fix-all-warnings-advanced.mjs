#!/usr/bin/env node

/**
 * Advanced batch fix for all common lint warnings
 * Uses pattern analysis and smart replacements
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Advanced Lint Warning Fixer\n');
console.log('This script will fix common patterns:\n');
console.log('  1. Unused variables → prefix with _');
console.log('  2. Any types → unknown (where safe)');
console.log('  3. Unused catch errors → _error');
console.log('  4. Unused function parameters → _param\n');

let lintOutput = '';
try {
  lintOutput = execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

// Parse all warnings
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
  unusedVars: 0,
  anyTypes: 0,
  unusedImports: 0,
  catchErrors: 0,
};

for (const [filePath, warnings] of Object.entries(fileWarnings)) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Sort warnings by line number (descending) to avoid line shifts
    warnings.sort((a, b) => b.line - a.line);

    for (const warning of warnings) {
      const { line: lineNum, varName, rule } = warning;
      const lineIndex = lineNum - 1;
      const line = lines[lineIndex];

      if (!line || varName.startsWith('_')) continue;

      // Skip common names that might break code
      const skipNames = ['data', 'user', 'result', 'response', 'query', 'router'];
      if (skipNames.includes(varName) && !line.includes('catch')) continue;

      // Fix 1: Catch block errors
      if (varName === 'error' && line.includes('catch (')) {
        lines[lineIndex] = line.replace(/catch\s*\(\s*error\s*\)/g, 'catch (_error)');
        modified = true;
        totalFixed++;
        stats.catchErrors++;
        continue;
      }

      // Fix 2: Any types → unknown (safe patterns only)
      if (rule === '@typescript-eslint/no-explicit-any') {
        // Only replace in safe contexts
        if (line.includes('as any')) {
          lines[lineIndex] = line.replace(/\s+as\s+any\b/g, ' as unknown');
          modified = true;
          totalFixed++;
          stats.anyTypes++;
          continue;
        }
        if (line.match(/:\s*any(?=\s*[,)])/)) {
          lines[lineIndex] = line.replace(/:\s*any(?=\s*[,)])/g, ': unknown');
          modified = true;
          totalFixed++;
          stats.anyTypes++;
          continue;
        }
      }

      // Fix 3: Unused function parameters
      if (warning.message.includes('Allowed unused args')) {
        const paramPattern = new RegExp(`(\\{)\\s*${varName}\\s*(\\})`, 'g');
        if (paramPattern.test(line)) {
          lines[lineIndex] = line.replace(paramPattern, `$1${varName}: _${varName}$2`);
          modified = true;
          totalFixed++;
          stats.unusedVars++;
          continue;
        }
        // Also check function parameters: (param) =>
        const funcParamPattern = new RegExp(`\\(([^)]*)\\b${varName}\\b([^)]*)\\)`, 'g');
        if (funcParamPattern.test(line)) {
          lines[lineIndex] = line.replace(
            new RegExp(`\\b${varName}\\b`, 'g'),
            `_${varName}`
          );
          modified = true;
          totalFixed++;
          stats.unusedVars++;
          continue;
        }
      }

      // Fix 4: Unused variables (simple assignments)
      if (rule === 'unused-imports/no-unused-vars' || rule === '@typescript-eslint/no-unused-vars') {
        // Only for simple const/let assignments, not destructuring
        if (line.includes('const ') && line.includes(` ${varName} =`) && !line.includes('{') && !line.includes('[')) {
          lines[lineIndex] = line.replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}`);
          modified = true;
          totalFixed++;
          stats.unusedVars++;
          continue;
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
console.log(`  - Unused variables: ${stats.unusedVars}`);
console.log(`  - Any types → unknown: ${stats.anyTypes}`);
console.log(`  - Catch errors: ${stats.catchErrors}`);
console.log(`  - Unused imports: ${stats.unusedImports} (handled by ESLint plugin)\n`);

console.log('Running lint again to verify...\n');

try {
  execSync('npm run lint 2>&1 | tail -5', { stdio: 'inherit' });
} catch (error) {
  // Expected
}

