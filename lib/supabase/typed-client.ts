/**
 * Typed Supabase Client Helper
 * Temporary solution until types are fully generated from Supabase
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Convert untyped Supabase client to typed client
 * Use this when types are incomplete
 */
export function getTypedClient(client: SupabaseClient<any>): SupabaseClient<Database> {
  return client as unknown as SupabaseClient<Database>;
}
