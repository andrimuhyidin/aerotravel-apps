#!/usr/bin/env node

/**
 * Smart batch fix for 'any' types
 * Uses pattern analysis to replace 'any' with proper types
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('Analyzing any types patterns...\n');

let lintOutput = '';
try {
  lintOutput = execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

// Parse any type warnings
const fileIssues = {};
const lines = lintOutput.split('\n');
let currentFile = null;

for (const line of lines) {
  if (line.startsWith('/Users')) {
    currentFile = line.trim();
    // Focus on app/ directory, skip scripts
    if (currentFile.includes('/scripts/')) {
      currentFile = null;
    }
  } else if (currentFile && line.includes('no-explicit-any')) {
    const match = line.match(/(\d+):(\d+)/);
    if (match) {
      if (!fileIssues[currentFile]) {
        fileIssues[currentFile] = [];
      }
      fileIssues[currentFile].push({
        line: parseInt(match[1]),
        col: parseInt(match[2]),
      });
    }
  }
}

console.log(`Found ${Object.keys(fileIssues).length} files with any types\n`);

// Common patterns for any replacement
const anyPatterns = [
  // Pattern 1: request: NextRequest (unused) -> request: _request
  {
    pattern: /(request|req):\s*NextRequest/,
    replacement: (match, varName) => `${varName}: _${varName}`,
    context: 'unused-request',
  },
  // Pattern 2: as any -> as unknown (safer)
  {
    pattern: /\s+as\s+any\b/g,
    replacement: ' as unknown',
    context: 'type-assertion',
  },
  // Pattern 3: : any in function parameters -> : unknown
  {
    pattern: /:\s*any(?=\s*[,)])/g,
    replacement: ': unknown',
    context: 'function-param',
  },
  // Pattern 4: const x: any = -> const x: unknown =
  {
    pattern: /const\s+(\w+):\s*any\s*=/g,
    replacement: 'const $1: unknown =',
    context: 'variable-declaration',
  },
];

let totalFixed = 0;
let filesModified = 0;

for (const [filePath, issues] of Object.entries(fileIssues)) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let modified = false;

    // Sort issues by line number (descending) to avoid line shifts
    issues.sort((a, b) => b.line - a.line);

    // Apply patterns
    for (const pattern of anyPatterns) {
      const newContent = content.replace(pattern.pattern, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        totalFixed += (originalContent.match(pattern.pattern) || []).length;
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed ${filePath} (${issues.length} instances)`);
      filesModified++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

console.log(`\n✓ Fixed ${totalFixed} instances in ${filesModified} files`);
console.log('\nNote: Some any types may need manual review for proper type definitions');

