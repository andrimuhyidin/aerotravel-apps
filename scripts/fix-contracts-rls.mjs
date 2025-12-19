#!/usr/bin/env node
/**
 * Fix Contracts RLS Policies
 * Update policies to remove 'admin' role (doesn't exist in enum)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixPolicies() {
  console.log('🔧 Fixing RLS policies...\n');

  const policies = [
    {
      table: 'guide_contracts',
      name: 'guide_contracts_admin',
      sql: `
        DROP POLICY IF EXISTS "guide_contracts_admin" ON guide_contracts;
        CREATE POLICY "guide_contracts_admin" ON guide_contracts
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE id = auth.uid()
              AND role IN ('super_admin', 'ops_admin', 'finance_manager')
            )
          );
      `,
    },
    {
      table: 'guide_contract_trips',
      name: 'guide_contract_trips_admin',
      sql: `
        DROP POLICY IF EXISTS "guide_contract_trips_admin" ON guide_contract_trips;
        CREATE POLICY "guide_contract_trips_admin" ON guide_contract_trips
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE id = auth.uid()
              AND role IN ('super_admin', 'ops_admin', 'finance_manager')
            )
          );
      `,
    },
    {
      table: 'guide_contract_payments',
      name: 'guide_contract_payments_admin',
      sql: `
        DROP POLICY IF EXISTS "guide_contract_payments_admin" ON guide_contract_payments;
        CREATE POLICY "guide_contract_payments_admin" ON guide_contract_payments
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE id = auth.uid()
              AND role IN ('super_admin', 'ops_admin', 'finance_manager')
            )
          );
      `,
    },
  ];

  // Execute via psql if DATABASE_URL available
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (DATABASE_URL) {
    const { execSync } = await import('child_process');
    
    for (const policy of policies) {
      try {
        console.log(`📦 Fixing ${policy.name}...`);
        execSync(`psql "${DATABASE_URL}" -c "${policy.sql.replace(/\n/g, ' ').replace(/\s+/g, ' ')}"`, {
          stdio: 'inherit',
          encoding: 'utf-8',
        });
        console.log(`✅ ${policy.name} fixed\n`);
      } catch (error) {
        console.log(`⚠️  ${policy.name} fix failed: ${error.message}`);
        console.log(`💡 Please run this SQL manually:\n${policy.sql}\n`);
      }
    }
  } else {
    console.log('💡 DATABASE_URL not found. Please run these SQL manually via Supabase Dashboard:\n');
    policies.forEach((policy) => {
      console.log(`-- Fix ${policy.name}`);
      console.log(policy.sql);
      console.log('');
    });
  }
}

async function main() {
  await fixPolicies();
  console.log('✅ RLS policies fix completed!');
}

main().catch((error) => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});
