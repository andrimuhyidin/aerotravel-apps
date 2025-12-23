#!/usr/bin/env node

/**
 * Comprehensive batch fix for unused variables
 * Fixes common patterns safely
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('Running comprehensive unused variables fix...\n');

let lintOutput = '';
try {
  lintOutput = execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

// Parse all unused variable warnings
const fileWarnings = {};
const lines = lintOutput.split('\n');
let currentFile = null;

for (const line of lines) {
  if (line.startsWith('/Users')) {
    currentFile = line.trim();
    // Skip scripts directory (lower priority)
    if (currentFile.includes('/scripts/')) {
      currentFile = null;
    }
  } else if (currentFile && line.match(/^\s+\d+:\d+\s+warning/)) {
    const match = line.match(/(\d+):(\d+)\s+warning\s+'([^']+)'\s+(.+?)\s+(@typescript-eslint\/[\w-]+)/);
    if (match && match[5] === '@typescript-eslint/no-unused-vars') {
      const [, lineNum, , varName, message] = match;
      if (!fileWarnings[currentFile]) {
        fileWarnings[currentFile] = [];
      }
      fileWarnings[currentFile].push({
        line: parseInt(lineNum),
        varName,
        message,
      });
    }
  }
}

console.log(`Found ${Object.keys(fileWarnings).length} files with unused variables\n`);

let totalFixed = 0;
let filesModified = 0;

for (const [filePath, warnings] of Object.entries(fileWarnings)) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Sort warnings by line number (descending) to avoid line shifts
    warnings.sort((a, b) => b.line - a.line);

    for (const warning of warnings) {
      const { line: lineNum, varName } = warning;
      const lineIndex = lineNum - 1;
      const line = lines[lineIndex];

      if (!line || varName.startsWith('_')) continue;

      // Skip common names that might break code if changed
      const skipNames = ['data', 'user', 'result', 'response', 'query', 'router'];
      if (skipNames.includes(varName)) continue;

      // Pattern 1: catch (error) -> catch (_error)
      if (varName === 'error' && line.includes('catch (')) {
        lines[lineIndex] = line.replace(/catch\s*\(\s*error\s*\)/g, 'catch (_error)');
        modified = true;
        totalFixed++;
        continue;
      }

      // Pattern 2: Function parameter { varName } -> { varName: _varName }
      if (warning.message.includes('Allowed unused args')) {
        // Try to find the parameter in function signature
        const paramPattern = new RegExp(`(\\{)\\s*${varName}\\s*(\\})`, 'g');
        if (paramPattern.test(line)) {
          lines[lineIndex] = line.replace(paramPattern, `$1${varName}: _${varName}$2`);
          modified = true;
          totalFixed++;
          continue;
        }
      }

      // Pattern 3: const varName = ... -> const _varName = ...
      if (line.includes('const ') && line.includes(` ${varName} =`)) {
        // Only if it's a simple assignment, not destructuring
        if (!line.includes('{') && !line.includes('[')) {
          lines[lineIndex] = line.replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}`);
          modified = true;
          totalFixed++;
          continue;
        }
      }
    }

    if (modified) {
      writeFileSync(filePath, lines.join('\n'), 'utf-8');
      console.log(`✓ Fixed ${filePath} (${warnings.length} warnings)`);
      filesModified++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

console.log(`\n✓ Fixed ${totalFixed} instances in ${filesModified} files`);
console.log('\nRunning lint again to verify...\n');

try {
  execSync('npm run lint 2>&1 | tail -5', { stdio: 'inherit' });
} catch (error) {
  // Expected
}

