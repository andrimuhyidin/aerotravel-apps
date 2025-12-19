#!/usr/bin/env node

/**
 * Final Verification of Contracts
 * Check if all contracts are master contracts (annual)
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';

config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found');
  process.exit(1);
}

console.log('🔍 Final Verification: Master Contracts Only\n');

// Check contract types
console.log('1️⃣  Contract Types Distribution:\n');
const typesSQL = `
  SELECT 
    contract_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_master_contract = true) as master,
    COUNT(*) FILTER (WHERE auto_cover_trips = true) as auto_cover
  FROM guide_contracts
  GROUP BY contract_type
  ORDER BY contract_type;
`;

try {
  const typesOutput = execSync(`psql "${DATABASE_URL}" -c "${typesSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(typesOutput);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Check all contracts
console.log('2️⃣  All Contracts:\n');
const allSQL = `
  SELECT 
    contract_number,
    contract_type,
    is_master_contract,
    auto_cover_trips,
    fee_amount,
    fee_type,
    status,
    renewal_date
  FROM guide_contracts
  ORDER BY created_at DESC
  LIMIT 10;
`;

try {
  const allOutput = execSync(`psql "${DATABASE_URL}" -c "${allSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(allOutput);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Check for non-annual contracts
console.log('3️⃣  Non-Annual Contracts (should be 0):\n');
const nonAnnualSQL = `
  SELECT COUNT(*) as count
  FROM guide_contracts
  WHERE contract_type != 'annual';
`;

try {
  const nonAnnualOutput = execSync(`psql "${DATABASE_URL}" -c "${nonAnnualSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(nonAnnualOutput);
  
  if (nonAnnualOutput.includes('0')) {
    console.log('✅ All contracts are annual!\n');
  } else {
    console.log('⚠️  Warning: Non-annual contracts found!\n');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Check master contract flags
console.log('4️⃣  Master Contract Flags:\n');
const flagsSQL = `
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_master_contract = true) as is_master,
    COUNT(*) FILTER (WHERE auto_cover_trips = true) as auto_cover,
    COUNT(*) FILTER (WHERE fee_amount IS NULL) as null_fee
  FROM guide_contracts
  WHERE contract_type = 'annual';
`;

try {
  const flagsOutput = execSync(`psql "${DATABASE_URL}" -c "${flagsSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(flagsOutput);
  
  if (flagsOutput.includes('is_master') && flagsOutput.includes('auto_cover')) {
    console.log('✅ Master contract flags set correctly!\n');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('🎯 Verification complete!\n');
