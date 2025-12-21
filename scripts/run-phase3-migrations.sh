#!/bin/bash
# Run Phase 3 Migrations and Setup Cron Jobs
# Usage: ./scripts/run-phase3-migrations.sh

set -e

echo "🚀 Running Phase 3 Migrations..."
echo ""

# Load .env.local
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local not found"
  exit 1
fi

export $(grep -v '^#' .env.local | xargs)

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: DATABASE_URL or SUPABASE_DB_URL not found in .env.local"
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
  exit 1
fi

# Migrations to run
MIGRATIONS=(
  "supabase/migrations/20250126000000_069-compliance-education.sql"
  "supabase/migrations/20250126000001_070-waste-tracking.sql"
  "supabase/migrations/20250126000002_071-mandatory-trainings.sql"
  "supabase/migrations/20250126000003_072-training-reminders-cron.sql"
  "supabase/migrations/20250126000004_073-competency-assessment.sql"
  "supabase/migrations/20250126000005_074-trainer-feedback.sql"
)

echo "✅ Using psql with DATABASE_URL"
echo ""

# Run each migration
SUCCESS_COUNT=0
FAIL_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
  if [ ! -f "$migration" ]; then
    echo "❌ Error: Migration file not found: $migration"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    continue
  fi

  echo "📦 Running $migration..."
  if psql "$DB_URL" -f "$migration" 2>&1; then
    echo "✅ $migration completed"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "⚠️  Warning: $migration may have partially failed (some objects may already exist)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo ""
done

echo "📊 Migration Summary:"
echo "   ✅ Success: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAIL_COUNT"
echo ""

# Setup Cron Jobs
echo "🔧 Setting up Cron Jobs..."
echo ""

echo "📅 Scheduling Training Reminders Cron Job..."
if [ -f "scripts/setup-cron-jobs.sql" ]; then
  if psql "$DB_URL" -f "scripts/setup-cron-jobs.sql" 2>&1; then
    echo "✅ Cron jobs setup completed"
  else
    echo "⚠️  Warning: Cron job setup may have failed (may already exist)"
    echo ""
    echo "💡 You can manually setup cron jobs:"
    echo "   1. Go to Supabase Dashboard > SQL Editor"
    echo "   2. Run: scripts/setup-cron-jobs.sql"
  fi
else
  echo "⚠️  Warning: setup-cron-jobs.sql not found"
  echo ""
  echo "💡 You can manually setup cron jobs in Supabase SQL Editor:"
  echo "   1. Go to Supabase Dashboard > SQL Editor"
  echo "   2. Run the SQL from: scripts/setup-cron-jobs.sql"
fi

echo ""
echo "🎉 Phase 3 migrations completed!"
echo ""
echo "📝 Next Steps:"
echo "   1. Verify tables in Supabase Dashboard"
echo "   2. Check cron jobs: SELECT * FROM cron.job WHERE jobname = 'training-reminders-daily';"
echo "   3. Run: pnpm update-types (to regenerate TypeScript types)"

