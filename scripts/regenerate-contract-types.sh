#!/bin/bash

# Regenerate Supabase Types for Contract Tables
# This script regenerates types to include guide_contract_resignations and guide_contract_sanctions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Regenerating Supabase Types for Contract Tables...${NC}\n"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}⚠️  .env.local not found${NC}"
  echo -e "${YELLOW}   Creating from env.example.txt...${NC}"
  if [ -f env.example.txt ]; then
    cp env.example.txt .env.local
    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo -e "${YELLOW}   Please update SUPABASE_PROJECT_ID or SUPABASE_ACCESS_TOKEN in .env.local${NC}\n"
  else
    echo -e "${RED}❌ env.example.txt not found${NC}"
    exit 1
  fi
fi

# Load .env.local
export $(grep -v '^#' .env.local | grep -E 'SUPABASE_PROJECT_ID|SUPABASE_ACCESS_TOKEN' | xargs)

# Check for project ID or access token
if [ -z "$SUPABASE_PROJECT_ID" ] && [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ SUPABASE_PROJECT_ID or SUPABASE_ACCESS_TOKEN not found in .env.local${NC}\n"
  echo -e "${YELLOW}📝 Please add one of the following to .env.local:${NC}"
  echo -e "   ${BLUE}SUPABASE_PROJECT_ID=your-project-id${NC}"
  echo -e "   ${BLUE}# OR${NC}"
  echo -e "   ${BLUE}SUPABASE_ACCESS_TOKEN=your-access-token${NC}\n"
  echo -e "${YELLOW}💡 Get access token from: https://app.supabase.com/account/tokens${NC}\n"
  exit 1
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null && ! command -v npx &> /dev/null; then
  echo -e "${RED}❌ Supabase CLI not found${NC}"
  echo -e "${YELLOW}   Install: npm install -g supabase${NC}"
  echo -e "${YELLOW}   Or use npx: npx supabase${NC}\n"
  exit 1
fi

# Generate types
echo -e "${BLUE}📝 Generating types...${NC}\n"

if [ ! -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✅ Using access token method${NC}\n"
  export SUPABASE_ACCESS_TOKEN
  if command -v supabase &> /dev/null; then
    supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/supabase.ts 2>&1 || {
      # Try with access token in env
      SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/supabase.ts 2>&1
    }
  else
    SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/supabase.ts 2>&1
  fi
elif [ ! -z "$SUPABASE_PROJECT_ID" ]; then
  echo -e "${GREEN}✅ Using project ID method${NC}\n"
  if command -v supabase &> /dev/null; then
    supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/supabase.ts 2>&1
  else
    npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/supabase.ts 2>&1
  fi
fi

# Check if generation was successful
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Types generated successfully!${NC}\n"
  
  # Verify guide_contract_resignations is in types
  if grep -q "guide_contract_resignations" types/supabase.ts; then
    echo -e "${GREEN}✅ Verified: guide_contract_resignations found in types${NC}"
  else
    echo -e "${YELLOW}⚠️  Warning: guide_contract_resignations not found in types${NC}"
    echo -e "${YELLOW}   Make sure migration 042-guide-contract-sanctions-resign.sql is executed${NC}\n"
  fi
  
  # Verify guide_contract_sanctions is in types
  if grep -q "guide_contract_sanctions" types/supabase.ts; then
    echo -e "${GREEN}✅ Verified: guide_contract_sanctions found in types${NC}"
  else
    echo -e "${YELLOW}⚠️  Warning: guide_contract_sanctions not found in types${NC}"
    echo -e "${YELLOW}   Make sure migration 042-guide-contract-sanctions-resign.sql is executed${NC}\n"
  fi
  
  echo -e "\n${BLUE}📋 Next steps:${NC}"
  echo -e "   1. Run: ${GREEN}pnpm type-check${NC} to verify no errors"
  echo -e "   2. Update code to remove ${YELLOW}as unknown as any${NC} type assertions"
  echo -e "   3. Test contract features to ensure everything works\n"
  
else
  echo -e "\n${RED}❌ Failed to generate types${NC}\n"
  echo -e "${YELLOW}💡 Troubleshooting:${NC}"
  echo -e "   1. Verify SUPABASE_PROJECT_ID is correct"
  echo -e "   2. Or get new access token from: https://app.supabase.com/account/tokens"
  echo -e "   3. Check migration is executed: SELECT * FROM guide_contract_resignations LIMIT 1;\n"
  exit 1
fi

echo -e "${GREEN}✨ Done!${NC}\n"
