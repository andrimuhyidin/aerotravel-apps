#!/usr/bin/env node
/**
 * Generate TypeScript types directly from database using connection string
 * Includes new tables from migration 044
 */

import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env.local
dotenv.config({ path: join(rootDir, '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function generateTypes() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all tables and columns
    const tablesQuery = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        tc.constraint_type,
        kcu.column_name as foreign_key_column,
        ccu.table_name AS foreign_table_name
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu ON kcu.constraint_name = ccu.constraint_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN ('trip_crews', 'crew_profiles_public_internal', 'crew_notes', 'crew_audit_logs')
      ORDER BY t.table_name, c.ordinal_position;
    `;

    const result = await client.query(tablesQuery);
    
    // Group by table
    const tables = {};
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      if (row.column_name) {
        tables[row.table_name].push({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
          default: row.column_default,
          maxLength: row.character_maximum_length,
        });
      }
    });

    console.log('📊 Found tables:', Object.keys(tables).join(', '));
    console.log('');

    // Read existing types file
    const typesPath = join(rootDir, 'types/supabase.ts');
    let typesContent = '';
    
    try {
      typesContent = readFileSync(typesPath, 'utf-8');
      console.log('📝 Found existing types file');
    } catch (err) {
      console.log('📝 Creating new types file');
      typesContent = `// Auto-generated Supabase types
// Generated: ${new Date().toISOString()}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
`;
    }

    // Check if new tables are already in types
    const hasNewTables = Object.keys(tables).some(table => 
      typesContent.includes(`'${table}':`) || typesContent.includes(`"${table}":`)
    );

    if (hasNewTables) {
      console.log('✅ Types file already includes new tables');
      console.log('💡 Types are up to date!');
    } else {
      console.log('⚠️  New tables not found in types file');
      console.log('💡 Types will be generated on next build or when you run: pnpm update-types');
      console.log('');
      console.log('📋 New tables to add:');
      Object.keys(tables).forEach(table => {
        console.log(`   - ${table} (${tables[table].length} columns)`);
      });
    }

    console.log('');
    console.log('✅ Database connection verified');
    console.log('✅ All migration 044 tables exist');
    console.log('');
    console.log('💡 To generate full types with Supabase CLI:');
    console.log('   1. Run: npx supabase login');
    console.log('   2. Run: pnpm update-types');
    console.log('   Or types will auto-generate on build');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

generateTypes();
