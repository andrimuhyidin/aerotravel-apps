#!/bin/bash
# Script to apply migration 044-multi-guide-crew-directory.sql
# This script applies the migration directly to Supabase

set -e

echo "=========================================="
echo "Applying Migration 044: Multi-Guide Crew Directory"
echo "=========================================="

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI not found. Install it first: npm install -g supabase"
    exit 1
fi

# Check if linked
if ! supabase projects list &> /dev/null; then
    echo "Error: Not linked to Supabase project. Run: supabase link"
    exit 1
fi

echo ""
echo "Step 1: Applying migration 044..."
echo ""

# Try to apply via db push
if supabase db push --linked --include-all --yes 2>&1 | grep -q "044-multi-guide"; then
    echo "✅ Migration 044 applied successfully!"
else
    echo "⚠️  Migration 044 not applied via CLI."
    echo ""
    echo "Please apply manually via Supabase Dashboard:"
    echo "1. Go to: https://supabase.com/dashboard/project/$(grep NEXT_PUBLIC_SUPABASE_URL .env.local 2>/dev/null | cut -d'/' -f3 | cut -d'.' -f1 || echo 'YOUR_PROJECT_ID')/sql/new"
    echo "2. Copy content from: supabase/migrations/20250123000001_044-multi-guide-crew-directory.sql"
    echo "3. Paste and execute"
    exit 1
fi

echo ""
echo "Step 2: Generating TypeScript types..."
echo ""

# Generate types
if [ -f .env.local ]; then
    source .env.local
    if [ -n "$SUPABASE_PROJECT_ID" ]; then
        pnpm update-types
        echo "✅ Types generated successfully!"
    else
        echo "⚠️  SUPABASE_PROJECT_ID not found in .env.local"
        echo "Run manually: pnpm update-types"
    fi
else
    echo "⚠️  .env.local not found"
    echo "Run manually: pnpm update-types"
fi

echo ""
echo "=========================================="
echo "✅ Migration 044 applied successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test crew directory: /guide/crew/directory"
echo "2. Test crew management in trip detail"
echo "3. Test crew notes"
echo ""
