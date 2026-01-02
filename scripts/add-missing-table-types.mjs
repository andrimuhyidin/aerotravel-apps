#!/usr/bin/env node
/**
 * Add Missing Table Types to Supabase Types
 * 
 * This script adds types for new tables that are not yet in types/supabase.ts
 * without regenerating the entire file.
 * 
 * Usage:
 *   node scripts/add-missing-table-types.mjs
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env vars
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
  return env;
}

const env = loadEnv();
const databaseUrl = env.DATABASE_URL || env.POSTGRES_URL || env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error('❌ No DATABASE_URL found in .env.local');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require', max: 1 });

// PostgreSQL to TypeScript type mapping
const pgToTsType = {
  'smallint': 'number',
  'integer': 'number',
  'bigint': 'number',
  'decimal': 'number',
  'numeric': 'number',
  'real': 'number',
  'double precision': 'number',
  'character varying': 'string',
  'varchar': 'string',
  'text': 'string',
  'boolean': 'boolean',
  'date': 'string',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'timestamptz': 'string',
  'uuid': 'string',
  'json': 'Json',
  'jsonb': 'Json',
};

async function getTableColumns(tableName) {
  return await sql`
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;
}

async function getEnums() {
  const enums = await sql`
    SELECT t.typname as enum_name
    FROM pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  `;
  return new Set(enums.map(e => e.enum_name));
}

function generateTableTypes(tableName, columns, enumNames) {
  let rowType = `      ${tableName}: {\n        Row: {\n`;
  let insertType = `        Insert: {\n`;
  let updateType = `        Update: {\n`;
  
  for (const col of columns) {
    const isNullable = col.is_nullable === 'YES';
    const hasDefault = col.column_default !== null;
    
    let tsType = pgToTsType[col.data_type] || 'unknown';
    
    // Handle enums
    if (col.data_type === 'USER-DEFINED' && enumNames.has(col.udt_name)) {
      tsType = `Database["public"]["Enums"]["${col.udt_name}"]`;
    }
    
    // Handle arrays
    if (col.data_type === 'ARRAY') {
      const baseType = col.udt_name?.replace(/^_/, '') || 'unknown';
      tsType = `${pgToTsType[baseType] || 'unknown'}[]`;
    }
    
    const nullSuffix = isNullable ? ' | null' : '';
    
    rowType += `          ${col.column_name}: ${tsType}${nullSuffix}\n`;
    
    const insertOptional = hasDefault || isNullable ? '?' : '';
    insertType += `          ${col.column_name}${insertOptional}: ${tsType}${nullSuffix}\n`;
    
    updateType += `          ${col.column_name}?: ${tsType}${nullSuffix}\n`;
  }
  
  rowType += `        }\n`;
  insertType += `        }\n`;
  updateType += `        }\n        Relationships: []\n      }`;
  
  return rowType + insertType + updateType;
}

async function main() {
  console.log('🔍 Checking for missing table types...');
  
  // Read current supabase.ts
  const typesPath = path.join(__dirname, '..', 'types', 'supabase.ts');
  const currentTypes = fs.readFileSync(typesPath, 'utf-8');
  
  // Tables we need to check
  const newTables = [
    'integration_settings',
    'seasons', 
    'authority_matrix',
    'approval_workflows',
    'corporate_budgets',
    'companies',
  ];
  
  const enumNames = await getEnums();
  const missingTables = [];
  
  for (const table of newTables) {
    // Check if table is already in types
    const regex = new RegExp(`\\b${table}:\\s*\\{`, 'g');
    if (!regex.test(currentTypes)) {
      missingTables.push(table);
    }
  }
  
  if (missingTables.length === 0) {
    console.log('✅ All new tables already have types defined!');
    await sql.end();
    return;
  }
  
  console.log(`📝 Missing tables: ${missingTables.join(', ')}`);
  console.log('');
  console.log('Add these types manually to types/supabase.ts in the Tables section:');
  console.log('');
  console.log('------- COPY BELOW -------');
  
  for (const tableName of missingTables) {
    const columns = await getTableColumns(tableName);
    if (columns.length > 0) {
      console.log(generateTableTypes(tableName, columns, enumNames));
      console.log('');
    }
  }
  
  console.log('------- END COPY -------');
  console.log('');
  console.log('💡 Tip: Add these inside Database["public"]["Tables"] object');
  
  await sql.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

