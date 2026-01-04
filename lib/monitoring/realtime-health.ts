/**
 * Realtime Health Monitoring
 * Track Realtime connection health and metrics
 */

import 'server-only';

import { getRealtimeStatus } from '@/lib/realtime/realtime-server';
import { getSubscriptionCount } from '@/lib/events/event-bus';
import { logger } from '@/lib/utils/logger';

export type RealtimeHealth = {
  enabled: boolean;
  tables: string[];
  activeSubscriptions: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: string;
};

/**
 * Get Realtime health status
 */
export async function getRealtimeHealth(): Promise<RealtimeHealth> {
  try {
    const status = await getRealtimeStatus();
    const activeSubscriptions = getSubscriptionCount();

    // Determine health status
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!status.enabled || status.tables.length === 0) {
      healthStatus = 'unhealthy';
    } else if (status.tables.length < 5) {
      healthStatus = 'degraded';
    }

    return {
      enabled: status.enabled,
      tables: status.tables,
      activeSubscriptions,
      status: healthStatus,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[Realtime Health] Failed to get health', error);
    return {
      enabled: false,
      tables: [],
      activeSubscriptions: 0,
      status: 'unhealthy',
      lastChecked: new Date().toISOString(),
    };
  }
}

