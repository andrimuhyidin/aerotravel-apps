#!/bin/bash

# Auto-generate Supabase types script
# This script will automatically generate types once SUPABASE_ACCESS_TOKEN is available

set -e

PROJECT_ID="mjzukilsgkdqmcusjdut"
TYPES_FILE="types/supabase.ts"

echo "🔄 Checking for Supabase access token..."

# Load .env.local if exists
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep SUPABASE_ACCESS_TOKEN | xargs)
fi

# Check if access token is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "⚠️  SUPABASE_ACCESS_TOKEN not found"
  echo ""
  echo "📝 To generate types, please add access token to .env.local:"
  echo "   1. Go to: https://app.supabase.com/account/tokens"
  echo "   2. Create a new Personal Access Token"
  echo "   3. Add to .env.local:"
  echo "      SUPABASE_ACCESS_TOKEN=your_token_here"
  echo "   4. Run this script again: npm run update-types"
  echo ""
  exit 1
fi

echo "✅ Access token found, generating types..."
echo ""

# Generate types
npx supabase gen types typescript --project-id "$PROJECT_ID" > "$TYPES_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Types generated successfully!"
  echo "📝 File saved to: $TYPES_FILE"
  echo ""
  echo "💡 Next steps:"
  echo "   1. Review the generated types"
  echo "   2. Run: npm run type-check"
  echo "   3. Remove temporary type assertions from code"
else
  echo "❌ Failed to generate types"
  cat "$TYPES_FILE"
  exit 1
fi

