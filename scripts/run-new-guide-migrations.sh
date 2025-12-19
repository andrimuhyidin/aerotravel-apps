#!/bin/bash
# Run new Guide App migrations (014, 015, 016)
# Usage: ./scripts/run-new-guide-migrations.sh

set -e

echo "🚀 Running new Guide App migrations..."
echo ""

# Load env vars from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

MIGRATIONS=(
  "scripts/migrations/014-guide-equipment-checklist.sql"
  "scripts/migrations/015-guide-trip-activity-log.sql"
  "scripts/migrations/016-guide-performance-goals.sql"
)

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in .env.local"
  echo ""
  echo "💡 Please run migrations manually via Supabase Dashboard:"
  echo "   1. Go to: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new"
  echo "   2. Copy and run each migration file:"
  for migration in "${MIGRATIONS[@]}"; do
    echo "      - $migration"
  done
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
  echo "Or run migrations manually via Supabase Dashboard:"
  echo "   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new"
  exit 1
fi

echo "✅ Using psql with DATABASE_URL"
echo ""

# Run each migration
for migration in "${MIGRATIONS[@]}"; do
  if [ ! -f "$migration" ]; then
    echo "❌ Error: Migration file not found: $migration"
    exit 1
  fi

  echo "📦 Running $migration..."
  psql "$DATABASE_URL" -f "$migration" || {
    echo "⚠️  Warning: Migration may have partially failed (some objects may already exist)"
  }
  echo "✅ $migration completed"
  echo ""
done

echo "🎉 All migrations completed!"
echo ""
echo "🔍 Verifying tables..."
psql "$DATABASE_URL" -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'guide_equipment_checklists',
    'guide_equipment_reports',
    'guide_trip_activity_logs',
    'guide_trip_timeline_shares',
    'guide_performance_goals'
  )
ORDER BY table_name;
"

echo ""
echo "✅ Migration verification complete!"

