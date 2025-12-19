#!/bin/bash
# Apply migration 044 directly using psql

set -e

cd "$(dirname "$0")/.."

# Load .env.local
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Get DATABASE_URL
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:%23AeroTVL2025@db.mjzukilsgkdqmcusjdut.supabase.co:5432/postgres}"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found"
    exit 1
fi

MIGRATION_FILE="supabase/migrations/20250123000001_044-multi-guide-crew-directory.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "🚀 Applying Migration 044: Multi-Guide Crew Directory"
echo "📁 File: $MIGRATION_FILE"
echo "🔗 Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"
echo ""

# Apply migration using psql
psql "$DATABASE_URL" -f "$MIGRATION_FILE" <<EOF
\set ON_ERROR_STOP on
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration 044 applied successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Generate types: pnpm update-types"
    echo "2. Test features: /guide/crew/directory"
else
    echo ""
    echo "❌ Migration failed. Check errors above."
    exit 1
fi
