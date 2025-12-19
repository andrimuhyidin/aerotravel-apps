#!/usr/bin/env node

/**
 * Update Existing Contracts to Master Contract
 * Mark annual contracts as master contracts
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

// Check existing annual contracts
console.log('1️⃣  Checking existing annual contracts...\n');
const checkSQL = `
  SELECT 
    id,
    contract_number,
    contract_type,
    is_master_contract,
    auto_cover_trips,
    status,
    start_date,
    end_date
  FROM guide_contracts
  WHERE contract_type = 'annual'
  ORDER BY created_at DESC;
`;

try {
  const checkOutput = execSync(`psql "${DATABASE_URL}" -c "${checkSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(checkOutput);
} catch (error) {
  console.error('❌ Error checking contracts:', error.message);
}

// Update annual contracts to master contracts
console.log('2️⃣  Updating annual contracts to master contracts...\n');
const updateSQL = `
  UPDATE guide_contracts 
  SET 
    is_master_contract = true, 
    auto_cover_trips = true,
    renewal_date = end_date
  WHERE contract_type = 'annual' 
    AND status = 'active'
    AND end_date IS NOT NULL
    AND (is_master_contract = false OR is_master_contract IS NULL);
`;

try {
  const updateOutput = execSync(`psql "${DATABASE_URL}" -c "${updateSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(updateOutput);
  
  // Get count of updated contracts
  const countSQL = `
    SELECT COUNT(*) as updated_count
    FROM guide_contracts
    WHERE contract_type = 'annual' 
      AND is_master_contract = true;
  `;
  
  const countOutput = execSync(`psql "${DATABASE_URL}" -c "${countSQL}"`, {
    encoding: 'utf-8',
  });
  console.log(countOutput);
  console.log('✅ Update completed\n');
} catch (error) {
  console.error('❌ Error updating contracts:', error.message);
}

// Verify updated contracts
console.log('3️⃣  Verifying updated contracts...\n');
const verifySQL = `
  SELECT 
    id,
    contract_number,
    contract_type,
    is_master_contract,
    auto_cover_trips,
    renewal_date,
    status
  FROM guide_contracts
  WHERE is_master_contract = true
  ORDER BY created_at DESC;
`;

try {
  const verifyOutput = execSync(`psql "${DATABASE_URL}" -c "${verifySQL}"`, {
    encoding: 'utf-8',
  });
  console.log(verifyOutput);
  console.log('✅ Verification complete\n');
} catch (error) {
  console.error('❌ Error verifying contracts:', error.message);
}

// Check all contracts summary
console.log('4️⃣  Contract summary...\n');
const summarySQL = `
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
  const summaryOutput = execSync(`psql "${DATABASE_URL}" -c "${summarySQL}"`, {
    encoding: 'utf-8',
  });
  console.log(summaryOutput);
} catch (error) {
  console.error('❌ Error getting summary:', error.message);
}

console.log('🎯 Update complete!\n');
