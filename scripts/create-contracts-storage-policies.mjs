#!/usr/bin/env node
/**
 * Create Storage Policies for Guide Contracts
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found');
  process.exit(1);
}

const policiesSQL = `
DO $$ 
BEGIN
  -- Upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'guide_documents_upload'
  ) THEN
    CREATE POLICY "guide_documents_upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'guide-documents');
  END IF;

  -- Read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'guide_documents_read'
  ) THEN
    CREATE POLICY "guide_documents_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'guide-documents');
  END IF;
END $$;
`;

async function main() {
  console.log('🔧 Creating storage policies...\n');

  try {
    // Write SQL to temp file to avoid shell escaping issues
    const { writeFileSync, unlinkSync } = await import('fs');
    const tempFile = join(__dirname, '..', '.temp-policies.sql');
    
    writeFileSync(tempFile, policiesSQL);
    
    execSync(`psql "${DATABASE_URL}" -f "${tempFile}"`, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    
    unlinkSync(tempFile);
    
    console.log('\n✅ Storage policies created successfully!');
  } catch (error) {
    console.warn('⚠️  Policy creation failed (may already exist):', error.message);
    console.log('\n💡 Policies may already exist. If needed, run this SQL manually:');
    console.log(policiesSQL);
  }
}

main().catch((error) => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
