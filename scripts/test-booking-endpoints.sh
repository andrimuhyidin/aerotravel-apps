#!/bin/bash
# Test Booking & Order Management Endpoints
# Usage: ./scripts/test-booking-endpoints.sh

set -e

echo "🧪 Testing Booking & Order Management Endpoints"
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

BASE_URL="${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-test-secret}"

echo "📡 Base URL: $BASE_URL"
echo "🔑 Using CRON_SECRET: ${CRON_SECRET:0:10}..."
echo ""

# Test 1: Booking Reminders Cron
echo "1️⃣  Testing Booking Reminders Cron..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/cron/booking-reminders" \
  -H "Authorization: Bearer ${CRON_SECRET}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Booking reminders endpoint working"
  echo "   Response: $BODY" | head -c 200
  echo "..."
else
  echo "   ❌ Booking reminders endpoint failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

# Test 2: Draft Cleanup Cron
echo "2️⃣  Testing Draft Cleanup Cron..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/cron/booking-draft-cleanup" \
  -H "Authorization: Bearer ${CRON_SECRET}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Draft cleanup endpoint working"
  echo "   Response: $BODY" | head -c 200
  echo "..."
else
  echo "   ❌ Draft cleanup endpoint failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

# Test 3: Unauthorized access (should fail)
echo "3️⃣  Testing Unauthorized Access..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/cron/booking-reminders")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
  echo "   ✅ Unauthorized access correctly rejected"
else
  echo "   ⚠️  Unauthorized access returned HTTP $HTTP_CODE (expected 401)"
fi
echo ""

echo "✅ Endpoint testing complete!"
echo ""
echo "💡 Note: These tests require:"
echo "   - Server running on $BASE_URL"
echo "   - CRON_SECRET set in environment"
echo "   - Database migrations applied"

