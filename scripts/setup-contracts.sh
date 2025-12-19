#!/bin/bash
# Setup Guide Contracts System
# Run this script after deploying migrations

set -e

echo "🚀 Setting up Guide Contracts System..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Verify migrations are applied${NC}"
echo "Please ensure you've run the following migrations in Supabase:"
echo "  - 20250121000000_040-guide-contracts.sql"
echo "  - 20250121000001_041-contract-auto-expire-cron.sql"
echo ""
read -p "Have you run the migrations? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please run the migrations first in Supabase Dashboard → SQL Editor"
    exit 1
fi

echo -e "${YELLOW}Step 2: Create Storage Bucket${NC}"
echo "Please create the storage bucket manually:"
echo "  1. Go to Supabase Dashboard → Storage"
echo "  2. Click 'New bucket'"
echo "  3. Name: guide-documents"
echo "  4. Public: false (Private)"
echo "  5. File size limit: 10MB"
echo "  6. Allowed MIME types: image/png, image/jpeg, application/pdf"
echo ""
read -p "Have you created the bucket? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create the bucket first"
    exit 1
fi

echo -e "${YELLOW}Step 3: Setup Storage Policies${NC}"
echo "Run this SQL in Supabase Dashboard → SQL Editor:"
echo ""
cat << 'EOF'
-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "guide_documents_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'guide-documents');

-- Allow users to read their own files
CREATE POLICY IF NOT EXISTS "guide_documents_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'guide-documents');
EOF
echo ""
read -p "Have you created the storage policies? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create the storage policies first"
    exit 1
fi

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test creating a contract in Console Admin"
echo "  2. Test signing a contract in Guide App"
echo "  3. Setup cron jobs for auto-expire (optional)"
echo ""
echo "For cron jobs, add to vercel.json:"
cat << 'EOF'
{
  "crons": [
    {
      "path": "/api/admin/guide/contracts/expire",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/admin/guide/contracts/expire-notify",
      "schedule": "0 9 * * *"
    }
  ]
}
EOF
