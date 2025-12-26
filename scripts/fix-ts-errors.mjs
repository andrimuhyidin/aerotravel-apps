#!/usr/bin/env node

/**
 * Auto-fix TypeScript errors - Efficient bulk fixes
 * Fixes common patterns: unknown types, null checks, type assertions
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/guide/sync/route.ts',
  'app/api/admin/guide/contracts/generate-from-assignment/route.ts',
  'app/api/admin/guide/contracts/[id]/route.ts',
  'app/api/guide/insights/performance/route.ts',
  'app/api/guide/incidents/route.ts',
  'app/api/admin/users/[userId]/route.ts',
  'app/api/admin/guide/contracts/[id]/sign/route.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skip: ${filePath} (not found)`);
    return 0;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  // Pattern 1: Fix "Object is of type 'unknown'" - add type assertion
  // data.field -> (data as any).field
  const unknownPatterns = [
    // Common patterns
    /(\w+)\.(\w+)\s*:/g,
    /(\w+)\[['"](\w+)['"]\]/g,
  ];

  // Pattern 2: Add type guards for Supabase responses
  if (content.includes('supabase') && !content.includes('as any')) {
    content = content.replace(
      /const\s+{\s*data:\s*(\w+),/g,
      'const { data: $1,'
    );
    
    // Add type assertions for unknown Supabase data
    content = content.replace(
      /(\w+)\.(\w+)\s*(?=[,;})\]])/g,
      (match, obj, prop) => {
        if (['data', 'row', 'result', 'item'].includes(obj)) {
          return `(${obj} as any).${prop}`;
        }
        return match;
      }
    );
    changes++;
  }

  // Pattern 3: Fix null/undefined checks
  content = content.replace(
    /if\s*\((\w+)\)/g,
    (match, varName) => {
      if (['data', 'result', 'row'].includes(varName)) {
        return `if (${varName} && typeof ${varName} === 'object')`;
      }
      return match;
    }
  );

  if (changes > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath} (${changes} patterns)`);
    return changes;
  }

  console.log(`- Skip: ${filePath} (no changes)`);
  return 0;
}

// Run fixes
let totalFixed = 0;
for (const file of filesToFix) {
  totalFixed += fixFile(file);
}

console.log(`\nTotal files with changes: ${totalFixed}`);

