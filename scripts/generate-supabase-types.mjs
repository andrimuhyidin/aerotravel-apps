#!/usr/bin/env node
/**
 * Generate Supabase TypeScript Types
 * 
 * This script generates TypeScript types from your Supabase database schema
 * without requiring the Supabase CLI to be installed globally.
 * 
 * Usage:
 *   node scripts/generate-supabase-types.mjs
 *   # or
 *   pnpm gen:types
 * 
 * Prerequisites:
 *   - DATABASE_URL or SUPABASE_DB_URL in .env.local
 *   - postgres package installed
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env vars
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }
  
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

const sql = postgres(databaseUrl, {
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// PostgreSQL to TypeScript type mapping
const pgToTsType = {
  // Numeric types
  'smallint': 'number',
  'integer': 'number',
  'bigint': 'number',
  'decimal': 'number',
  'numeric': 'number',
  'real': 'number',
  'double precision': 'number',
  'serial': 'number',
  'bigserial': 'number',
  
  // String types
  'character varying': 'string',
  'varchar': 'string',
  'character': 'string',
  'char': 'string',
  'text': 'string',
  'citext': 'string',
  
  // Boolean
  'boolean': 'boolean',
  
  // Date/Time
  'date': 'string',
  'time': 'string',
  'time with time zone': 'string',
  'time without time zone': 'string',
  'timestamp': 'string',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'timestamptz': 'string',
  'interval': 'string',
  
  // UUID
  'uuid': 'string',
  
  // JSON
  'json': 'Json',
  'jsonb': 'Json',
  
  // Arrays (handled separately)
  'ARRAY': 'unknown[]',
  
  // Other
  'bytea': 'string',
  'inet': 'string',
  'cidr': 'string',
  'macaddr': 'string',
  'tsvector': 'string',
  'tsquery': 'string',
  'vector': 'string',
  'point': 'unknown',
  'line': 'unknown',
  'lseg': 'unknown',
  'box': 'unknown',
  'path': 'unknown',
  'polygon': 'unknown',
  'circle': 'unknown',
};

function mapPgTypeToTs(pgType, udtName, isArray) {
  // Handle arrays
  if (isArray || pgType === 'ARRAY') {
    const baseType = udtName?.replace(/^_/, '') || 'unknown';
    const tsBaseType = pgToTsType[baseType] || 'unknown';
    return `${tsBaseType}[]`;
  }
  
  // Handle user-defined types (enums) but check pgToTsType first for known types like vector
  if (pgType === 'USER-DEFINED') {
    // Check if it's a known type first
    if (pgToTsType[udtName]) {
      return pgToTsType[udtName];
    }
    return udtName || 'unknown';
  }
  
  return pgToTsType[pgType] || pgToTsType[udtName] || 'unknown';
}

async function getEnums() {
  const enums = await sql`
    SELECT 
      t.typname as enum_name,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname
  `;
  return enums;
}

async function getTables() {
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  return tables.map(t => t.table_name);
}

async function getTableColumns(tableName) {
  const columns = await sql`
    SELECT 
      column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;
  return columns;
}

async function getViews() {
  const views = await sql`
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  return views.map(v => v.table_name);
}

async function getFunctions() {
  // Get unique function names only (ignore overloads)
  const functions = await sql`
    SELECT DISTINCT ON (p.proname)
      p.proname as function_name,
      pg_get_function_arguments(p.oid) as arguments,
      pg_get_function_result(p.oid) as return_type
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    ORDER BY p.proname
  `;
  return functions;
}

function generateEnumTypes(enums) {
  let output = '';
  for (const e of enums) {
    const values = e.enum_values.map(v => `"${v}"`).join(' | ');
    output += `    ${e.enum_name}: ${values}\n`;
  }
  return output;
}

function generateTableType(tableName, columns, enums) {
  const enumNames = new Set(enums.map(e => e.enum_name));
  
  let rowOutput = '';
  let insertOutput = '';
  let updateOutput = '';
  
  for (const col of columns) {
    const isNullable = col.is_nullable === 'YES';
    const hasDefault = col.column_default !== null;
    const isArray = col.data_type === 'ARRAY';
    
    let tsType = mapPgTypeToTs(col.data_type, col.udt_name, isArray);
    
    // If it's a user-defined type, check if it's an enum
    if (col.data_type === 'USER-DEFINED' && enumNames.has(col.udt_name)) {
      tsType = `Database["public"]["Enums"]["${col.udt_name}"]`;
    }
    
    const nullSuffix = isNullable ? ' | null' : '';
    
    // Row type (what you get when reading)
    rowOutput += `          ${col.column_name}: ${tsType}${nullSuffix}\n`;
    
    // Insert type (what you provide when inserting)
    const insertOptional = hasDefault || isNullable ? '?' : '';
    insertOutput += `          ${col.column_name}${insertOptional}: ${tsType}${nullSuffix}\n`;
    
    // Update type (all optional)
    updateOutput += `          ${col.column_name}?: ${tsType}${nullSuffix}\n`;
  }
  
  return {
    row: rowOutput,
    insert: insertOutput,
    update: updateOutput,
  };
}

async function generateTypes() {
  console.log('🔌 Connecting to database...');
  
  try {
    const testResult = await sql`SELECT NOW() as time`;
    console.log(`✅ Connected at ${testResult[0].time}`);
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
    process.exit(1);
  }
  
  console.log('📊 Fetching schema...');
  
  const enums = await getEnums();
  const tables = await getTables();
  const views = await getViews();
  const functions = await getFunctions();
  
  console.log(`   Found: ${tables.length} tables, ${views.length} views, ${enums.length} enums, ${functions.length} functions`);
  
  // Build types
  let output = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
`;
  
  // Generate table types
  for (const tableName of tables) {
    const columns = await getTableColumns(tableName);
    const types = generateTableType(tableName, columns, enums);
    
    output += `      ${tableName}: {
        Row: {
${types.row}        }
        Insert: {
${types.insert}        }
        Update: {
${types.update}        }
        Relationships: []
      }
`;
  }
  
  output += `    }
    Views: {
`;
  
  // Generate view types
  for (const viewName of views) {
    const columns = await getTableColumns(viewName);
    const types = generateTableType(viewName, columns, enums);
    
    output += `      ${viewName}: {
        Row: {
${types.row}        }
        Relationships: []
      }
`;
  }
  
  output += `    }
    Functions: {
`;
  
  // Generate function types (simplified)
  for (const fn of functions) {
    output += `      ${fn.function_name}: {
        Args: Record<string, unknown>
        Returns: unknown
      }
`;
  }
  
  output += `    }
    Enums: {
${generateEnumTypes(enums)}    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
`;

  // Write to file
  const outputPath = path.join(__dirname, '..', 'types', 'supabase.ts');
  fs.writeFileSync(outputPath, output);
  
  console.log(`\n✅ Types generated successfully!`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Tables: ${tables.length}`);
  console.log(`   Views: ${views.length}`);
  console.log(`   Enums: ${enums.length}`);
  console.log(`   Functions: ${functions.length}`);
  
  await sql.end();
}

generateTypes().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

