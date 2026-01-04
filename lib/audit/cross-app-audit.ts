/**
 * Cross-App Audit Trail Service
 * Centralized audit logging untuk all apps
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { emitEvent } from '@/lib/events/event-bus';

import type { AppType } from '@/lib/events/event-types';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'refund'
  | 'payment'
  | 'assign'
  | 'unassign'
  | 'custom';

export type AuditLog = {
  id: string;
  app?: AppType; // Optional karena existing table mungkin tidak punya
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>; // Optional - use old_values/new_values if not available
  oldValues?: Record<string, unknown>; // For existing table structure
  newValues?: Record<string, unknown>; // For existing table structure
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AuditLogFilter = {
  app?: AppType;
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

/**
 * Log audit event
 * Auto-logged via event bus handlers
 */
export async function logAuditEvent(
  app: AppType,
  userId: string | null,
  action: AuditAction,
  entityType: string,
  entityId: string,
  changes: Record<string, unknown> = {},
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  const supabase = await createClient();

  try {
    // Store in audit_logs table
    // Table has both app and changes columns (verified)
    const { error } = await supabase.from('audit_logs').insert({
      app,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes,
      ip_address: metadata?.ipAddress || null,
      user_agent: metadata?.userAgent || null,
    });

    if (error) {
      logger.error('[Audit] Failed to log event', error, {
        app,
        userId,
        action,
        entityType,
        entityId,
      });
    } else {
      logger.debug('[Audit] Event logged', {
        app,
        userId,
        action,
        entityType,
        entityId,
      });
    }

    // Also emit event for event bus (for notifications, etc.)
    if (userId) {
      await emitEvent(
        {
          type: 'custom',
          app,
          userId,
          data: {
            action,
            entityType,
            entityId,
            changes,
          },
        },
        {
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        }
      );
    }
  } catch (error) {
    logger.error('[Audit] Failed to log audit event', error, {
      app,
      userId,
      action,
      entityType,
      entityId,
    });
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  filter: AuditLogFilter = {}
): Promise<{
  logs: AuditLog[];
  total: number;
}> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filter.app) {
      query = query.eq('app', filter.app);
    }

    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }

    if (filter.action) {
      query = query.eq('action', filter.action);
    }

    if (filter.entityType) {
      query = query.eq('entity_type', filter.entityType);
    }

    if (filter.entityId) {
      query = query.eq('entity_id', filter.entityId);
    }

    if (filter.startDate) {
      query = query.gte('created_at', filter.startDate);
    }

    if (filter.endDate) {
      query = query.lte('created_at', filter.endDate);
    }

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      logger.error('[Audit] Failed to get audit logs', error, { filter });
      return { logs: [], total: 0 };
    }

    return {
      logs: (logs || []) as AuditLog[],
      total: count || 0,
    };
  } catch (error) {
    logger.error('[Audit] Failed to get audit logs', error, { filter });
    return { logs: [], total: 0 };
  }
}

/**
 * Get audit log by entity
 * Useful untuk show change history untuk specific entity
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  limit: number = 20
): Promise<AuditLog[]> {
  const { logs } = await getAuditLogs({
    entityType,
    entityId,
    limit,
  });

  return logs;
}

/**
 * Get user audit logs
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const { logs } = await getAuditLogs({
    userId,
    limit,
  });

  return logs;
}

