#!/bin/bash
# Run Guide App Migrations and Sample Data

set -e

echo "🚀 Running Guide App migrations..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found"
  exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Try Supabase CLI first
if command -v supabase &> /dev/null; then
  echo "📦 Using Supabase CLI..."
  supabase db push --local
elif [ -n "$DATABASE_URL" ]; then
  echo "📦 Using DATABASE_URL..."
  psql "$DATABASE_URL" -f supabase/migrations/20251219000000_021-guide-ui-config.sql
  psql "$DATABASE_URL" -f supabase/migrations/20251219000001_022-guide-sample-data.sql
  psql "$DATABASE_URL" -f supabase/migrations/20251219000002_023-guide-comprehensive-sample.sql
else
  echo "❌ No database connection found"
  echo "Please run migrations manually:"
  echo "  psql \$DATABASE_URL -f supabase/migrations/20251219000000_021-guide-ui-config.sql"
  echo "  psql \$DATABASE_URL -f supabase/migrations/20251219000001_022-guide-sample-data.sql"
  echo "  psql \$DATABASE_URL -f supabase/migrations/20251219000002_023-guide-comprehensive-sample.sql"
  exit 1
fi

echo "✅ Migrations completed!"

