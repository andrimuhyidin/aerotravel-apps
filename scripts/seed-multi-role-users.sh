#!/bin/bash

# Seed Multi-Role Test Users Script
# This script runs the multi-role test users seed SQL file
#
# Usage:
#   ./scripts/seed-multi-role-users.sh
#   OR
#   pnpm seed:multi-role

set -e

echo "🌱 Seeding multi-role test users..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Please install it first:"
  echo "   npm install -g supabase"
  exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found. Please create it first."
  exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if SUPABASE_PROJECT_ID is set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "❌ SUPABASE_PROJECT_ID not set in .env.local"
  exit 1
fi

# Run the seed SQL file
echo "📝 Running multi-role test users seed..."
supabase db execute --file supabase/seed/multi-role-test-users.sql

echo "✅ Multi-role test users seeded successfully!"
echo ""
echo "📋 Test Users:"
echo "   1. customer-guide@test.com (Customer + Guide)"
echo "   2. customer-mitra@test.com (Customer + Mitra)"
echo "   3. customer-corporate@test.com (Customer + Corporate)"
echo "   4. guide-mitra@test.com (Guide + Mitra)"
echo "   5. customer-guide-mitra@test.com (Customer + Guide + Mitra)"
echo "   6. guide-corporate@test.com (Guide + Corporate)"
echo "   7. mitra-corporate@test.com (Mitra + Corporate)"
echo "   8. customer-guide-corporate@test.com (Customer + Guide + Corporate)"
echo ""
echo "🔑 Password for all users: Test@1234"
echo ""
echo "🧪 You can now test the RoleSwitcher component with these users!"
