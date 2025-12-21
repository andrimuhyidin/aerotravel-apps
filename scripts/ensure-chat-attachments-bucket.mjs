#!/usr/bin/env node
/**
 * Ensure guide-chat-attachments storage bucket exists
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Load .env.local
config({ path: resolve(projectRoot, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = 'guide-chat-attachments';

async function ensureBucket() {
  console.log(`📦 Checking storage bucket: ${BUCKET_NAME}...\n`);

  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      process.exit(1);
    }

    // Check if bucket exists
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (bucketExists) {
      console.log(`✅ Bucket '${BUCKET_NAME}' already exists`);
      return;
    }

    // Create bucket
    console.log(`📝 Creating bucket '${BUCKET_NAME}'...`);
    const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false, // Private bucket
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError.message);
      console.error('\n💡 Please create the bucket manually in Supabase Dashboard:');
      console.error(`   Storage > Buckets > New Bucket > Name: ${BUCKET_NAME}`);
      console.error('   Settings: Private, Max file size: 10MB');
      process.exit(1);
    }

    console.log(`✅ Bucket '${BUCKET_NAME}' created successfully`);
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

ensureBucket()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

