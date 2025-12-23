#!/usr/bin/env node

/**
 * Smart Type Replacer
 * Replaces 'any' with proper types based on context
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Smart Type Replacer Starting...\n');

// Get files with explicit any
let lintOutput = '';
try {
  lintOutput = execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

const fileIssues = {};
const lines = lintOutput.split('\n');
let currentFile = null;

for (const line of lines) {
  if (line.startsWith('/Users')) {
    currentFile = line.trim();
    if (currentFile.includes('/scripts/')) currentFile = null;
  } else if (currentFile && line.includes('no-explicit-any')) {
    if (!fileIssues[currentFile]) fileIssues[currentFile] = [];
    const match = line.match(/(\d+):(\d+)/);
    if (match) fileIssues[currentFile].push(parseInt(match[1]));
  }
}

console.log(`Found ${Object.keys(fileIssues).length} files with 'any' types\n`);

let fixedCount = 0;

for (const [filePath, lineNumbers] of Object.entries(fileIssues)) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;
    let addedImport = false;

    // Sort descending to preserve line numbers
    lineNumbers.sort((a, b) => b - a);

    for (const lineNum of lineNumbers) {
      const index = lineNum - 1;
      const line = lines[index];

      // Strategy 1: Catch blocks
      // catch (error: any) -> catch (error: unknown)
      if (line.includes('catch') && (line.includes(': any') || line.includes('as any'))) {
        lines[index] = line.replace(/: any|as any/g, ': unknown'); // Safer than any
        modified = true;
        fixedCount++;
        continue;
      }

      // Strategy 2: Request body parsing
      // const body: any = await req.json() -> const body = await req.json()
      if (line.includes('await req.json()') || line.includes('await request.json()')) {
        lines[index] = line.replace(/: any/g, ''); // Let inference handle it or use generic
        modified = true;
        fixedCount++;
        continue;
      }

      // Strategy 3: Supabase client
      // const supabase: any = -> const supabase = 
      if (line.includes('createClient') && line.includes(': any')) {
        lines[index] = line.replace(/: any/g, '');
        modified = true;
        fixedCount++;
        continue;
      }

      // Strategy 4: Generic variable declaration
      // const x: any = -> const x = (remove type) or const x: unknown =
      if (line.match(/const\s+\w+\s*:\s*any\s*=/)) {
        lines[index] = line.replace(/:\s*any/g, ''); // Let type inference work
        modified = true;
        fixedCount++;
        continue;
      }
      
      // Strategy 5: Function params (safer to use unknown than any)
      if (line.includes(': any')) {
        // Only replace if it's safe (simple params)
        if (!line.includes('return') && !line.includes('=>')) {
           lines[index] = line.replace(/: any/g, ': unknown');
           modified = true;
           fixedCount++;
        }
      }
    }

    if (modified) {
      writeFileSync(filePath, lines.join('\n'), 'utf-8');
      console.log(`✓ Fixed ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
}

console.log(`\n✅ Replaced ${fixedCount} instances of 'any'`);

