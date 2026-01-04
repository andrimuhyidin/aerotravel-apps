#!/usr/bin/env node

/**
 * Update Existing Contracts to Master Contracts
 * Convert all existing contracts to annual master contracts
 * Or delete non-annual contracts (optional)
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

console.log('🔄 Updating existing contracts to master contracts...\n');

// Option 1: Delete non-annual contracts (clean slate)
console.log('1️⃣  Option 1: Delete non-annual contracts...\n');
const deleteSQL = `
  DELETE FROM guide_contracts
  WHERE contract_type != 'annual';
`;

try {
  const deleteOutput = execSync(`psql "${DATABASE_URL}" -c "${deleteSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(deleteOutput);
  console.log('✅ Non-annual contracts deleted\n');
} catch (error) {
  console.error('❌ Error deleting contracts:', error.message);
}

// Option 2: Update existing annual contracts to master contracts
console.log('2️⃣  Updating annual contracts to master contracts...\n');
const updateSQL = `
  UPDATE guide_contracts 
  SET 
    contract_type = 'annual',
    is_master_contract = true, 
    auto_cover_trips = true,
    renewal_date = end_date,
    fee_amount = NULL,
    fee_type = 'per_trip',
    payment_terms = 'Dibayar setelah trip selesai berdasarkan fee di trip assignment'
  WHERE contract_type = 'annual' 
    AND (is_master_contract = false OR is_master_contract IS NULL);
`;

try {
  const updateOutput = execSync(`psql "${DATABASE_URL}" -c "${updateSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(updateOutput);
  console.log('✅ Annual contracts updated\n');
} catch (error) {
  console.error('❌ Error updating contracts:', error.message);
}

// Verify contracts
console.log('3️⃣  Verifying contracts...\n');
const verifySQL = `
  SELECT 
    contract_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_master_contract = true) as master_contracts,
    COUNT(*) FILTER (WHERE status = 'active') as active
  FROM guide_contracts
  GROUP BY contract_type
  ORDER BY contract_type;
`;

try {
  const verifyOutput = execSync(`psql "${DATABASE_URL}" -c "${verifySQL}"`, {
    encoding: 'utf-8',
  });
  console.log(verifyOutput);
} catch (error) {
  console.error('❌ Error verifying contracts:', error.message);
}

// Show all contracts
console.log('4️⃣  All contracts summary...\n');
const allSQL = `
  SELECT 
    id,
    contract_number,
    contract_type,
    is_master_contract,
    auto_cover_trips,
    renewal_date,
    fee_amount,
    status
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
  console.error('❌ Error getting contracts:', error.message);
}

console.log('🎯 Update complete!\n');
