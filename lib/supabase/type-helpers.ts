/**
 * Type Helpers for Supabase Queries
 * Temporary solution until types are fully generated from Supabase
 * 
 * Use these helpers to avoid 'never' type errors when types are incomplete
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Get typed Supabase client
 * Use this when you need type-safe queries
 */
export function getTypedClient(client: SupabaseClient<any>): SupabaseClient<Database> {
  return client as unknown as SupabaseClient<Database>;
}

/**
 * Type-safe query result helper
 * Use this to assert query results when types are incomplete
 */
export function typedQueryResult<T>(result: {
  data: T | null;
  error: Error | null;
}): {
  data: T | null;
  error: Error | null;
} {
  return result;
}

/**
 * Type-safe insert helper
 * Use this for insert operations when types are incomplete
 */
export function typedInsert<T extends Record<string, unknown>>(
  values: T
): T {
  return values;
}

/**
 * Type-safe update helper
 * Use this for update operations when types are incomplete
 */
export function typedUpdate<T extends Record<string, unknown>>(
  values: T
): T {
  return values;
}

