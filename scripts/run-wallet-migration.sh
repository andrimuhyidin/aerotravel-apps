#!/bin/bash
# Script to run wallet enhancements migration using DATABASE_URL
# Usage: ./scripts/run-wallet-migration.sh

set -e

# Load env vars from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

MIGRATION_FILE="supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in .env.local"
  exit 1
fi

echo "🚀 Running Wallet Enhancements Migration..."
echo "📄 Migration file: $MIGRATION_FILE"
echo ""

# Check if psql is available
if command -v psql &> /dev/null; then
  echo "✅ Using psql..."
  psql "$DATABASE_URL" -f "$MIGRATION_FILE"
  echo ""
  echo "✅ Migration completed!"
  
  # Verify tables
  echo "🔍 Verifying tables..."
  psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('guide_savings_goals', 'guide_wallet_milestones') ORDER BY table_name;"
else
  echo "⚠️  psql not found. Using alternative method..."
  echo ""
  echo "📋 Please run migration manually via Supabase Dashboard:"
  echo "   1. Go to: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new"
  echo "   2. Copy content from: $MIGRATION_FILE"
  echo "   3. Paste and run"
  echo ""
  echo "Or install psql:"
  echo "   brew install postgresql  # macOS"
  echo "   apt-get install postgresql-client  # Linux"
fi

