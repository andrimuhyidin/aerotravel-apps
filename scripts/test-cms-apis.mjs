#!/usr/bin/env node

/**
 * Test CMS API Endpoints
 * Verifies all CMS-related API routes are working correctly
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
const envPath = join(__dirname, '..', '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ .env.local not found');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const BASE_URL = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🧪 Testing CMS API Endpoints...\n');
console.log(`Base URL: ${BASE_URL}\n`);

const endpoints = [
  {
    name: 'Legal Pages - Terms',
    url: `${BASE_URL}/api/legal-pages/terms`,
    method: 'GET',
  },
  {
    name: 'Legal Pages - Privacy',
    url: `${BASE_URL}/api/legal-pages/privacy`,
    method: 'GET',
  },
  {
    name: 'Legal Pages - DPO',
    url: `${BASE_URL}/api/legal-pages/dpo`,
    method: 'GET',
  },
  {
    name: 'FAQs - Public',
    url: `${BASE_URL}/api/faqs?app_type=public`,
    method: 'GET',
  },
  {
    name: 'FAQs - Package',
    url: `${BASE_URL}/api/faqs?app_type=package`,
    method: 'GET',
  },
  {
    name: 'About Page Content',
    url: `${BASE_URL}/api/about`,
    method: 'GET',
  },
  {
    name: 'Loyalty Rewards',
    url: `${BASE_URL}/api/user/loyalty/rewards`,
    method: 'GET',
  },
  {
    name: 'Settings - Public',
    url: `${BASE_URL}/api/settings?prefix=app.`,
    method: 'GET',
  },
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const status = response.status;
    const isSuccess = status >= 200 && status < 300;

    if (isSuccess) {
      const data = await response.json();
      console.log(`  ✅ ${endpoint.name}: ${status}`);
      if (data.content) {
        console.log(`     Content: ${typeof data.content}`);
      } else if (data.faqs) {
        console.log(`     FAQs: ${data.faqs.length} items`);
      } else if (data.rewards) {
        console.log(`     Rewards: ${data.rewards.length} items`);
      } else if (data.settings) {
        console.log(`     Settings: ${Object.keys(data.settings).length} keys`);
      }
    } else {
      const errorText = await response.text();
      console.log(`  ❌ ${endpoint.name}: ${status}`);
      console.log(`     Error: ${errorText.substring(0, 100)}`);
    }

    return isSuccess;
  } catch (error) {
    console.log(`  ❌ ${endpoint.name}: ERROR`);
    console.log(`     ${error.message}`);
    return false;
  }
}

async function main() {
  let successCount = 0;
  let failCount = 0;

  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('');
  }

  console.log('📊 Test Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some endpoints failed. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All CMS API endpoints are working correctly!');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

