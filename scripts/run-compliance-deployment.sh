#!/bin/bash
# Run Legal Compliance Migrations & Seeds
# Usage: ./scripts/run-compliance-deployment.sh

set -e

echo "🚀 Starting Legal Compliance Deployment..."
echo "=========================================="
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local not found"
  exit 1
fi

# Source env vars (skip comments and empty lines)
export $(grep -v '^#' .env.local | grep -v '^$' | xargs)

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in .env.local"
  exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "❌ Error: psql not found"
  echo "Install: brew install postgresql"
  exit 1
fi

echo "✅ Database connection ready"
echo ""

# Test database connection
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
  echo "❌ Error: Cannot connect to database"
  exit 1
fi

echo "✅ Database connection verified"
echo ""

# Compliance migrations to run (in order)
MIGRATIONS=(
  "supabase/migrations/20260102100000_business-licenses.sql"
  "supabase/migrations/20250123000006_049-guide-certifications.sql"
  "supabase/migrations/20260103200015_143-pdp-consent-management.sql"
  "supabase/migrations/20260103200016_144-mra-tp-certifications.sql"
  "supabase/migrations/20260103200017_145-permenparekraf-self-assessment.sql"
)

echo "📦 Running Migrations..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
  if [ ! -f "$migration" ]; then
    echo "⚠️  Warning: Migration file not found: $migration"
    echo "   Skipping..."
    FAIL_COUNT=$((FAIL_COUNT + 1))
    continue
  fi

  echo "Running: $(basename $migration)..."
  if psql "$DATABASE_URL" -f "$migration" 2>&1; then
    echo "✅ $(basename $migration) completed"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "⚠️  Warning: $(basename $migration) may have partially failed (objects may already exist)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo ""
done

echo "📊 Migration Summary:"
echo "   ✅ Success: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAIL_COUNT"
echo ""

# Run seed scripts
echo "🌱 Running Seed Scripts..."
echo ""

SEEDS=(
  "supabase/seed/001-consent-purposes.sql"
  "supabase/seed/002-mra-tp-competency-units.sql"
  "supabase/seed/003-permenparekraf-criteria.sql"
)

SEED_SUCCESS=0
SEED_FAIL=0

for seed in "${SEEDS[@]}"; do
  if [ ! -f "$seed" ]; then
    echo "⚠️  Warning: Seed file not found: $seed"
    echo "   Skipping..."
    SEED_FAIL=$((SEED_FAIL + 1))
    continue
  fi

  echo "Seeding: $(basename $seed)..."
  if psql "$DATABASE_URL" -f "$seed" 2>&1; then
    echo "✅ $(basename $seed) completed"
    SEED_SUCCESS=$((SEED_SUCCESS + 1))
  else
    echo "⚠️  Warning: $(basename $seed) may have partially failed (data may already exist)"
    SEED_FAIL=$((SEED_FAIL + 1))
  fi
  echo ""
done

echo "📊 Seed Summary:"
echo "   ✅ Success: $SEED_SUCCESS"
echo "   ❌ Failed: $SEED_FAIL"
echo ""

# Verify deployment
echo "🔍 Verifying Deployment..."
echo ""

VERIFY_SQL="
SELECT 
  'consent_purposes' as table_name, COUNT(*) as count FROM consent_purposes
UNION ALL
SELECT 'mra_tp_competency_units', COUNT(*) FROM mra_tp_competency_units
UNION ALL
SELECT 'permenparekraf_criteria', COUNT(*) FROM permenparekraf_criteria
UNION ALL
SELECT 'business_licenses', COUNT(*) FROM business_licenses
UNION ALL
SELECT 'guide_certifications_tracker', COUNT(*) FROM guide_certifications_tracker
UNION ALL
SELECT 'user_consents', COUNT(*) FROM user_consents
UNION ALL
SELECT 'permenparekraf_self_assessments', COUNT(*) FROM permenparekraf_self_assessments;
"

psql "$DATABASE_URL" -c "$VERIFY_SQL"

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Verify tables and data counts above"
echo "2. Test API endpoints"
echo "3. Configure cron jobs in Vercel"
echo "4. Test email alerts"
echo ""

