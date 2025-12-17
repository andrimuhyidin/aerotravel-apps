#!/bin/bash

# Supabase Type Generation Script
# Automatically generates TypeScript types from Supabase database schema

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Generating Supabase types...${NC}"

# Check if SUPABASE_PROJECT_ID is set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo -e "${YELLOW}⚠️  SUPABASE_PROJECT_ID not set.${NC}"
  echo -e "${YELLOW}   Using Supabase CLI with linked project...${NC}"
  
  # Try using Supabase CLI (requires project to be linked)
  if command -v supabase &> /dev/null; then
    supabase gen types typescript --linked > types/supabase.ts
    echo -e "${GREEN}✅ Types generated successfully!${NC}"
  else
    echo -e "${RED}❌ Supabase CLI not found.${NC}"
    echo -e "${YELLOW}   Install: npm install -g supabase${NC}"
    echo -e "${YELLOW}   Or set SUPABASE_PROJECT_ID env var and use: pnpm update-types${NC}"
    exit 1
  fi
else
  # Use project ID from env
  supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/supabase.ts
  echo -e "${GREEN}✅ Types generated successfully!${NC}"
fi

echo -e "${GREEN}📝 Types saved to types/supabase.ts${NC}"
echo -e "${YELLOW}💡 Remember to commit this file after schema changes!${NC}"

