-- Initialize database with pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create schema for initial setup
-- Note: Full schema will be managed via Supabase migrations

-- Example: Create a test table to verify connection
CREATE TABLE IF NOT EXISTS test_connection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

