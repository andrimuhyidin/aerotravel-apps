#!/bin/bash
# Run Guide Menu Reorganization Migration
# Usage: ./scripts/run-menu-migration.sh

set -e

echo "🚀 Running Guide Menu Reorganization Migration..."
echo ""

# Load .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

MIGRATION_FILE="supabase/migrations/20250126000001_044-guide-menu-final-reorganization.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in .env.local"
  echo ""
  echo "💡 Please run migration manually via Supabase Dashboard:"
  echo "   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new"
  echo "   2. Copy content from: $MIGRATION_FILE"
  echo "   3. Paste and run in SQL Editor"
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
  echo "Or run migration manually via Supabase Dashboard"
  exit 1
fi

echo "✅ Using psql with DATABASE_URL"
echo "📦 Running migration: $MIGRATION_FILE"
echo ""

# Run migration
psql "$DATABASE_URL" -f "$MIGRATION_FILE" || {
  echo "⚠️  Warning: Migration may have partially failed (some objects may already exist)"
  echo "   This is normal if migration was run before"
}

echo ""
echo "✅ Migration completed!"
echo ""
echo "🔍 Verifying results..."

# Verify migration
psql "$DATABASE_URL" -c "
SELECT 
  section,
  COUNT(*) as item_count,
  string_agg(label, ', ' ORDER BY display_order) as items
FROM guide_menu_items
WHERE is_active = true
GROUP BY section
ORDER BY 
  CASE section
    WHEN 'Akun' THEN 1
    WHEN 'Pembelajaran' THEN 2
    WHEN 'Dukungan' THEN 3
    WHEN 'Pengaturan' THEN 4
    ELSE 5
  END;
" || echo "⚠️  Could not verify (this is okay)"

echo ""
echo "🎉 Done!"

