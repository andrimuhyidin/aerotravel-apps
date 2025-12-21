/**
 * Audit Logger Utility
 * Helper function to create audit log entries in database
 * Uses database function log_audit() for consistency
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'unmask' | 'approve' | 'reject';

export type AuditLogParams = {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  description?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Log audit event to database
 * Uses database function log_audit() for consistency and security
 */
export async function logAudit(params: AuditLogParams): Promise<string | null> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as any;

    // Call database function log_audit()
    const { data, error } = await client.rpc('log_audit', {
      p_user_id: params.userId,
      p_action: params.action,
      p_entity_type: params.entityType,
      p_entity_id: params.entityId || null,
      p_description: params.description || null,
      p_old_values: params.oldValues ? (params.oldValues as unknown) : null,
      p_new_values: params.newValues ? (params.newValues as unknown) : null,
    });

    if (error) {
      logger.error('Failed to create audit log', error, {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
      });
      return null;
    }

    // If IP address and user agent provided, update the audit log
    if (params.ipAddress || params.userAgent) {
      const { error: updateError } = await client
        .from('audit_logs')
        .update({
          ip_address: params.ipAddress || null,
          user_agent: params.userAgent || null,
        })
        .eq('id', data);

      if (updateError) {
        logger.warn('Failed to update audit log with IP/UA', {
          auditLogId: data,
          error: updateError instanceof Error ? {
            message: updateError.message,
            stack: updateError.stack,
          } : updateError,
        });
      }
    }

    logger.info('Audit log created', {
      auditLogId: data,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
    });

    return data;
  } catch (error) {
    logger.error('Exception creating audit log', error, {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
    });
    return null;
  }
}

/**
 * Log profile update with old and new values
 */
export async function logProfileUpdate(
  userId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  changedBy: 'guide' | 'admin' = 'guide'
): Promise<string | null> {
  return logAudit({
    userId,
    action: 'update',
    entityType: 'user_profile',
    entityId: userId,
    description: `Profile updated by ${changedBy}`,
    oldValues,
    newValues,
  });
}

