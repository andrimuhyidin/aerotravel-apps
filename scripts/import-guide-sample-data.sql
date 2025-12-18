-- Import Guide Sample Data
-- Run this script to import comprehensive sample data for Guide App

\set ON_ERROR_STOP on

BEGIN;

-- Run migrations first
\i supabase/migrations/20251219000000_021-guide-ui-config.sql
\i supabase/migrations/20251219000001_022-guide-sample-data.sql
\i supabase/migrations/20251219000002_023-guide-comprehensive-sample.sql

COMMIT;

