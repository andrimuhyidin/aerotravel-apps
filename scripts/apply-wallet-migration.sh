#!/bin/bash
# Script to apply wallet enhancements migration
# Usage: ./scripts/apply-wallet-migration.sh

set -e

echo "🚀 Applying Wallet Enhancements Migration..."
echo ""

# Check if SUPABASE_PROJECT_ID is set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "❌ Error: SUPABASE_PROJECT_ID environment variable is not set"
  echo "   Please set it in your .env.local file or export it:"
  echo "   export SUPABASE_PROJECT_ID=your-project-id"
  exit 1
fi

MIGRATION_FILE="supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "⚠️  Supabase CLI not found. Installing..."
  npm install -g supabase
fi

echo "📋 Migration SQL:"
echo "---"
head -20 "$MIGRATION_FILE"
echo "..."
echo "---"
echo ""

echo "✅ To apply this migration:"
echo ""
echo "Option 1: Supabase Dashboard"
echo "  1. Go to https://supabase.com/dashboard/project/$SUPABASE_PROJECT_ID/sql/new"
echo "  2. Copy the content of: $MIGRATION_FILE"
echo "  3. Paste and run in SQL Editor"
echo ""
echo "Option 2: Supabase CLI"
echo "  supabase db push --project-ref $SUPABASE_PROJECT_ID"
echo ""
echo "Option 3: Direct SQL (if you have psql access)"
echo "  psql -h <host> -U <user> -d <database> -f $MIGRATION_FILE"
echo ""

