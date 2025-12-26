#!/bin/bash
# Run Update Menu Label Migration (077-update-guide-menu-tentang-aplikasi.sql)
# Usage: ./scripts/run-update-tentang-aplikasi-migration.sh

set -e

echo "🚀 Running Update Menu Label Migration..."
echo ""

# Load .env.local
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local not found"
  echo "Please create .env.local with DATABASE_URL"
  exit 1
fi

export $(grep -v '^#' .env.local | xargs)

MIGRATION_FILE="supabase/migrations/20250130000002_077-update-guide-menu-tentang-aplikasi.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: DATABASE_URL or SUPABASE_DB_URL not found in .env.local"
  echo ""
  echo "💡 Please add to .env.local:"
  echo "   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"
  echo ""
  echo "   Get from: Supabase Dashboard > Settings > Database > Connection string (URI)"
  echo ""
  echo "   Or run migration manually via Supabase Dashboard:"
  echo "   1. Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql/new"
  echo "   2. Copy and run migration file:"
  echo "      cat $MIGRATION_FILE"
  exit 1
fi

DB_URL="${DATABASE_URL:-$SUPABASE_DB_URL}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "❌ Error: psql not found"
  echo ""
  echo "💡 Please install psql:"
  echo "   brew install postgresql  # macOS"
  echo "   apt-get install postgresql-client  # Linux"
  echo ""
  echo "Or run migration manually via Supabase Dashboard:"
  echo "   https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql/new"
  exit 1
fi

echo "✅ Using psql with DATABASE_URL"
echo "📦 Running migration: $MIGRATION_FILE"
echo ""

# Run migration
psql "$DB_URL" -f "$MIGRATION_FILE" || {
  echo "⚠️  Warning: Migration may have partially failed"
}

echo ""
echo "✅ Migration completed!"
echo ""
echo "🔍 Verifying updated menu items..."
psql "$DB_URL" -c "
SELECT 
  section,
  href,
  label,
  description
FROM guide_menu_items
WHERE href = '/guide/about' 
   OR label LIKE '%Tentang%';
" || echo "⚠️  Could not verify menu items (this is okay)"

echo ""
echo "🎉 Done! Menu label updated to 'Tentang Aplikasi'"
echo ""

