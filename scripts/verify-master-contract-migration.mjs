#!/usr/bin/env node

/**
 * Verify Master Contract Migration
 * Check if migration was applied correctly
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL or SUPABASE_DB_URL not found in .env.local');
  process.exit(1);
}

console.log('🔍 Verifying Master Contract Migration...\n');

// Check 1: Verify columns exist
console.log('1️⃣  Checking columns...\n');
const columnsSQL = `
  SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
  FROM information_schema.columns
  WHERE table_name = 'guide_contracts'
    AND column_name IN ('is_master_contract', 'auto_cover_trips', 'renewal_date', 'previous_contract_id')
  ORDER BY column_name;
`;

try {
  const columnsOutput = execSync(`psql "${DATABASE_URL}" -c "${columnsSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(columnsOutput);
  
  if (columnsOutput.includes('is_master_contract')) {
    console.log('✅ All columns exist\n');
  } else {
    console.log('❌ Columns missing!\n');
  }
} catch (error) {
  console.error('❌ Error checking columns:', error.message);
}

// Check 2: Verify constraint
console.log('2️⃣  Checking constraint...\n');
const constraintSQL = `
  SELECT 
    constraint_name,
    constraint_type
  FROM information_schema.table_constraints
  WHERE table_name = 'guide_contracts'
    AND constraint_name = 'valid_fee_amount';
`;

try {
  const constraintOutput = execSync(`psql "${DATABASE_URL}" -c "${constraintSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(constraintOutput);
  
  if (constraintOutput.includes('valid_fee_amount')) {
    console.log('✅ Constraint exists\n');
  } else {
    console.log('⚠️  Constraint not found (may have been dropped)\n');
  }
} catch (error) {
  console.error('❌ Error checking constraint:', error.message);
}

// Check 3: Verify indexes
console.log('3️⃣  Checking indexes...\n');
const indexesSQL = `
  SELECT 
    indexname,
    indexdef
  FROM pg_indexes
  WHERE tablename = 'guide_contracts'
    AND indexname IN (
      'idx_guide_contracts_master',
      'idx_guide_contracts_renewal',
      'idx_guide_contracts_previous'
    )
  ORDER BY indexname;
`;

try {
  const indexesOutput = execSync(`psql "${DATABASE_URL}" -c "${indexesSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(indexesOutput);
  
  const indexCount = (indexesOutput.match(/idx_guide_contracts_/g) || []).length;
  if (indexCount >= 3) {
    console.log(`✅ All ${indexCount} indexes exist\n`);
  } else {
    console.log(`⚠️  Only ${indexCount}/3 indexes found\n`);
  }
} catch (error) {
  console.error('❌ Error checking indexes:', error.message);
}

// Check 4: Verify function
console.log('4️⃣  Checking functions...\n');
const functionSQL = `
  SELECT 
    routine_name,
    routine_type
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN (
      'auto_link_trip_to_master_contract',
      'check_contract_renewal'
    )
  ORDER BY routine_name;
`;

try {
  const functionOutput = execSync(`psql "${DATABASE_URL}" -c "${functionSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(functionOutput);
  
  const functionCount = (functionOutput.match(/auto_link_trip_to_master_contract|check_contract_renewal/g) || []).length;
  if (functionCount >= 2) {
    console.log(`✅ All ${functionCount} functions exist\n`);
  } else {
    console.log(`⚠️  Only ${functionCount}/2 functions found\n`);
  }
} catch (error) {
  console.error('❌ Error checking functions:', error.message);
}

// Check 5: Verify trigger
console.log('5️⃣  Checking trigger...\n');
const triggerSQL = `
  SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
  FROM information_schema.triggers
  WHERE trigger_name = 'trigger_auto_link_trip_to_master_contract';
`;

try {
  const triggerOutput = execSync(`psql "${DATABASE_URL}" -c "${triggerSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(triggerOutput);
  
  if (triggerOutput.includes('trigger_auto_link_trip_to_master_contract')) {
    console.log('✅ Trigger exists\n');
  } else {
    console.log('❌ Trigger not found!\n');
  }
} catch (error) {
  console.error('❌ Error checking trigger:', error.message);
}

// Check 6: Sample data check
console.log('6️⃣  Checking sample data...\n');
const sampleSQL = `
  SELECT 
    id,
    contract_type,
    is_master_contract,
    auto_cover_trips,
    renewal_date,
    fee_amount
  FROM guide_contracts
  LIMIT 5;
`;

try {
  const sampleOutput = execSync(`psql "${DATABASE_URL}" -c "${sampleSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(sampleOutput);
  console.log('✅ Sample data retrieved\n');
} catch (error) {
  console.error('❌ Error checking sample data:', error.message);
}

// Check 7: Test if fee_amount can be NULL
console.log('7️⃣  Testing NULL fee_amount (for master contracts)...\n');
const testNullSQL = `
  SELECT 
    COUNT(*) as total_contracts,
    COUNT(fee_amount) as contracts_with_fee,
    COUNT(*) - COUNT(fee_amount) as contracts_without_fee
  FROM guide_contracts;
`;

try {
  const testNullOutput = execSync(`psql "${DATABASE_URL}" -c "${testNullSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(testNullOutput);
  console.log('✅ NULL fee_amount is allowed\n');
} catch (error) {
  console.error('❌ Error testing NULL fee_amount:', error.message);
}

console.log('🎯 Verification complete!\n');
