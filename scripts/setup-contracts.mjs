#!/usr/bin/env node
/**
 * Setup Guide Contracts System
 * Run migrations and setup storage bucket
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration(filePath) {
  console.log(`\n📦 Running migration: ${filePath}`);
  try {
    const sql = readFileSync(filePath, 'utf-8');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try direct query if RPC doesn't work
      console.log('⚠️  RPC method failed, trying direct execution...');
      // Note: Supabase JS client doesn't support raw SQL execution
      // User needs to run via Dashboard or psql
      console.log('💡 Please run this migration manually via Supabase Dashboard SQL Editor');
      return false;
    }
    
    console.log('✅ Migration completed');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function createStorageBucket() {
  console.log('\n📦 Creating storage bucket: guide-documents');
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return false;
    }
    
    const bucketExists = buckets?.some((b) => b.name === 'guide-documents');
    
    if (bucketExists) {
      console.log('✅ Bucket already exists');
      return true;
    }
    
    // Create bucket
    const { data, error } = await supabase.storage.createBucket('guide-documents', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
    });
    
    if (error) {
      console.error('❌ Failed to create bucket:', error.message);
      console.log('💡 Please create bucket manually via Supabase Dashboard');
      return false;
    }
    
    console.log('✅ Bucket created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating bucket:', error.message);
    return false;
  }
}

async function createStoragePolicies() {
  console.log('\n📦 Creating storage policies');
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (DATABASE_URL) {
    const { execSync } = await import('child_process');
    const policiesSQL = `
      CREATE POLICY IF NOT EXISTS "guide_documents_upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'guide-documents');

      CREATE POLICY IF NOT EXISTS "guide_documents_read"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'guide-documents');
    `;
    
    try {
      execSync(`psql "${DATABASE_URL}" -c "${policiesSQL.replace(/\n/g, ' ').replace(/\s+/g, ' ')}"`, {
        stdio: 'inherit',
        encoding: 'utf-8',
      });
      console.log('✅ Storage policies created');
      return true;
    } catch (error) {
      console.warn('⚠️  Policy creation failed (may already exist)');
      return false;
    }
  } else {
    console.log('💡 DATABASE_URL not found. Please run policies manually:');
    console.log(`
      CREATE POLICY IF NOT EXISTS "guide_documents_upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'guide-documents');

      CREATE POLICY IF NOT EXISTS "guide_documents_read"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'guide-documents');
    `);
    return false;
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...');
  
  try {
    // Check tables
    const { data: tables, error } = await supabase
      .from('guide_contracts')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ Table guide_contracts not found - migrations not applied');
      return false;
    }
    
    console.log('✅ Database tables verified');
    
    // Check bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === 'guide-documents');
    
    if (!bucketExists) {
      console.log('⚠️  Storage bucket not found');
      return false;
    }
    
    console.log('✅ Storage bucket verified');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up Guide Contracts System...\n');
  
  const migrationFiles = [
    join(__dirname, '..', 'supabase', 'migrations', '20250121000000_040-guide-contracts.sql'),
    join(__dirname, '..', 'supabase', 'migrations', '20250121000001_041-contract-auto-expire-cron.sql'),
  ];
  
  console.log('⚠️  Note: Supabase JS client cannot execute raw SQL migrations.');
  console.log('Please run migrations manually via Supabase Dashboard SQL Editor:\n');
  
  migrationFiles.forEach((file) => {
    console.log(`  - ${file}`);
  });
  
  console.log('\n📋 Manual Setup Steps:');
  console.log('1. Run migrations via Supabase Dashboard → SQL Editor');
  console.log('2. Create storage bucket: guide-documents');
  console.log('3. Create storage policies (SQL provided below)');
  
  // Try to create bucket
  await createStorageBucket();
  
  // Show policies
  await createStoragePolicies();
  
  // Verify
  const verified = await verifySetup();
  
  if (verified) {
    console.log('\n✅ Setup complete!');
    console.log('\n🎯 Next steps:');
    console.log('  1. Test creating a contract in Console Admin');
    console.log('  2. Test signing a contract in Guide App');
    console.log('  3. Setup cron jobs for auto-expire (optional)');
  } else {
    console.log('\n⚠️  Setup incomplete. Please complete manual steps above.');
  }
}

main().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
