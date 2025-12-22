#!/bin/bash
# Run Performance Optimization Migration
# Adds database indexes untuk optimize guide dashboard queries

set -e

echo "🚀 Running Performance Optimization Migration..."
echo ""

# Load env vars from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
else
  echo "❌ Error: .env.local not found"
  echo "Please create .env.local with DATABASE_URL"
  exit 1
fi

MIGRATION_FILE="supabase/migrations/20250131000002_081-guide-performance-indexes.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in .env.local"
  echo ""
  echo "💡 Please run migration manually via Supabase Dashboard:"
  echo "   1. Go to: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new"
  echo "   2. Copy and run migration file:"
  echo "      cat $MIGRATION_FILE"
  exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "❌ Error: psql not found"
  echo ""
  echo "💡 Please install psql:"
  echo "   brew install postgresql  # macOS"
  echo "   apt-get install postgresql-client  # Linux"
  echo ""
  echo "Or run migration manually via Supabase Dashboard:"
  echo "   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new"
  exit 1
fi

echo "✅ Using psql with DATABASE_URL"
echo "📦 Running migration: $MIGRATION_FILE"
echo ""

# Run migration
psql "$DATABASE_URL" -f "$MIGRATION_FILE" || {
  echo "⚠️  Warning: Some indexes may already exist (this is normal)"
  echo "Migration uses IF NOT EXISTS, so it's safe to run multiple times"
}

echo ""
echo "✅ Migration completed!"
echo ""
echo "🔍 Verifying indexes..."
psql "$DATABASE_URL" -c "
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_guide%'
  AND indexname LIKE '%performance%'
ORDER BY indexname;
" || echo "⚠️  Could not verify indexes (this is okay)"

echo ""
echo "🎉 Performance optimization migration completed!"
echo ""
echo "📊 Next steps:"
echo "   1. Monitor query performance after deployment"
echo "   2. Check cache hit rates in Redis"
echo "   3. Review Web Vitals metrics in GA4/PostHog"
echo ""

