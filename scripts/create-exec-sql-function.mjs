#!/usr/bin/env node
/**
 * Create exec_sql RPC function for executing raw SQL
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const createExecSQLFunction = `
CREATE OR REPLACE FUNCTION exec_sql(statement TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE statement;
END;
$$;
`;

async function main() {
  console.log('🔧 Creating exec_sql function...\n');

  try {
    // Try to create the function via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ statement: createExecSQLFunction }),
    });

    if (!response.ok) {
      // Function doesn't exist yet, create it via direct connection
      // We'll use a workaround: execute via Supabase Dashboard or use psql
      console.log('⚠️  Cannot create function via API');
      console.log('📋 Creating function manually...');
      
      // Try alternative: use Supabase client to execute
      const { error } = await supabase.rpc('exec_sql', { 
        statement: createExecSQLFunction 
      });
      
      if (error) {
        console.log('📝 Please create exec_sql function manually via Supabase Dashboard:');
        console.log('\n' + createExecSQLFunction);
        return false;
      }
    }

    console.log('✅ exec_sql function created');
    return true;
  } catch (error) {
    console.log('📝 Please create exec_sql function manually:');
    console.log('\n' + createExecSQLFunction);
    return false;
  }
}

main().catch(console.error);

