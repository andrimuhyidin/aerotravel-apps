/**
 * Server-side Realtime Utilities
 * Utilities untuk server-side Realtime operations
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Broadcast message to all subscribers of a channel
 * Useful untuk server-side notifications
 */
export async function broadcastToChannel(
  channelName: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    const channel = supabase.channel(channelName);

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });

    logger.debug('[Realtime] Broadcast sent', { channelName, event });
  } catch (error) {
    logger.error('[Realtime] Broadcast failed', error, { channelName, event });
    throw error;
  }
}

/**
 * Check if Realtime is enabled for a table
 * Note: This requires checking Supabase configuration
 * For now, we assume tables are enabled if they exist
 */
export async function isRealtimeEnabled(tableName: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    // Try to query the table to verify it exists
    const { error } = await supabase.from(tableName).select('id').limit(1);

    // If table exists, assume Realtime is available
    // In production, you might want to check Supabase configuration
    return !error;
  } catch (error) {
    logger.error('[Realtime] Failed to check table', error, { tableName });
    return false;
  }
}

/**
 * Get Realtime connection status
 * Returns connection metrics (for monitoring)
 */
export async function getRealtimeStatus(): Promise<{
  enabled: boolean;
  tables: string[];
}> {
  // List of tables that should have Realtime enabled
  const realtimeTables = [
    'bookings',
    'trips',
    'mitra_wallet_transactions',
    'guide_wallet_transactions',
    'packages',
    'partner_notifications',
    'unified_notifications',
  ];

  const enabledTables: string[] = [];

  for (const table of realtimeTables) {
    const enabled = await isRealtimeEnabled(table);
    if (enabled) {
      enabledTables.push(table);
    }
  }

  return {
    enabled: enabledTables.length > 0,
    tables: enabledTables,
  };
}

