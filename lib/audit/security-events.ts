/**
 * Security Event Logger - ISO 27001 Compliance
 * Track security-related events for threat detection and audit
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { captureSecurityEvent } from '@/lib/observability/sentry';

export type SecurityEventType =
  | 'failed_login'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'unauthorized_access'
  | 'brute_force_detected';

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SecurityEventParams = {
  eventType: SecurityEventType;
  email?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  severity?: SecurityEventSeverity;
};

export type SecurityEventSummary = {
  eventType: string;
  eventCount: number;
  uniqueIps: number;
  uniqueEmails: number;
  severity: SecurityEventSeverity;
};

/**
 * Log a security event to database and Sentry
 */
export async function logSecurityEvent(
  params: SecurityEventParams,
  request?: Request
): Promise<boolean> {
  const supabase = await createClient();

  // Extract IP and user agent from request if not provided
  let ipAddress = params.ipAddress;
  let userAgent = params.userAgent;

  if (request && !ipAddress) {
    ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
  }

  if (request && !userAgent) {
    userAgent = request.headers.get('user-agent') || 'unknown';
  }

  // Determine severity
  const severity = params.severity || getSeverityByEventType(params.eventType);

  try {
    // Insert into database
    const { error } = await supabase.from('security_events').insert({
      event_type: params.eventType,
      email: params.email || null,
      user_id: params.userId || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      metadata: params.metadata || null,
      severity,
    });

    if (error) {
      logger.error('[SecurityEvent] Failed to log event', error, {
        eventType: params.eventType,
        email: params.email,
      });
      return false;
    }

    // Log to application logger
    logger.warn('[SecurityEvent] Security event logged', {
      eventType: params.eventType,
      email: params.email,
      ipAddress,
      severity,
    });

    // Send to Sentry if high or critical severity
    if (severity === 'high' || severity === 'critical') {
      captureSecurityEvent(params.eventType, {
        email: params.email,
        ip: ipAddress,
        reason: params.metadata?.reason as string,
        severity,
      });
    }

    // Check for brute force attack pattern
    if (params.eventType === 'failed_login' && params.email) {
      await checkAndNotifyBruteForce(params.email, ipAddress || 'unknown');
    }

    return true;
  } catch (error) {
    logger.error('[SecurityEvent] Exception logging security event', error, {
      eventType: params.eventType,
    });
    return false;
  }
}

/**
 * Log failed login attempt
 */
export async function logFailedLogin(
  email: string,
  reason: string,
  request?: Request
): Promise<void> {
  await logSecurityEvent(
    {
      eventType: 'failed_login',
      email,
      metadata: { reason },
      severity: 'medium',
    },
    request
  );
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  identifier: string,
  endpoint: string,
  request?: Request
): Promise<void> {
  await logSecurityEvent(
    {
      eventType: 'rate_limit_exceeded',
      email: identifier,
      metadata: { endpoint },
      severity: 'low',
    },
    request
  );
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  userId: string | undefined,
  resource: string,
  request?: Request
): Promise<void> {
  await logSecurityEvent(
    {
      eventType: 'unauthorized_access',
      userId,
      metadata: { resource },
      severity: 'high',
    },
    request
  );
}

/**
 * Check for brute force attack and notify if detected
 */
async function checkAndNotifyBruteForce(
  email: string,
  ipAddress: string
): Promise<void> {
  const supabase = await createClient();

  try {
    const { data: isBruteForce, error } = await supabase.rpc(
      'check_brute_force_attack',
      {
        p_email: email,
        p_ip_address: ipAddress,
        p_time_window_minutes: 5,
        p_threshold: 5,
      }
    );

    if (error) {
      logger.error('[SecurityEvent] Failed to check brute force', error);
      return;
    }

    if (isBruteForce) {
      // Log brute force detection
      await logSecurityEvent({
        eventType: 'brute_force_detected',
        email,
        ipAddress,
        metadata: {
          threshold: 5,
          timeWindow: '5 minutes',
        },
        severity: 'critical',
      });

      logger.error('[SecurityEvent] BRUTE FORCE DETECTED', null, {
        email,
        ipAddress,
      });
    }
  } catch (error) {
    logger.error('[SecurityEvent] Exception checking brute force', error);
  }
}

/**
 * Get security event summary for admin dashboard
 */
export async function getSecurityEventSummary(
  days: number = 7
): Promise<SecurityEventSummary[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('get_security_event_summary', {
      p_days: days,
    });

    if (error) {
      logger.error('[SecurityEvent] Failed to get summary', error);
      return [];
    }

    return (data || []).map((item: {
      event_type: string;
      event_count: number;
      unique_ips: number;
      unique_emails: number;
      severity: string;
    }) => ({
      eventType: item.event_type,
      eventCount: Number(item.event_count),
      uniqueIps: Number(item.unique_ips),
      uniqueEmails: Number(item.unique_emails),
      severity: item.severity as SecurityEventSeverity,
    }));
  } catch (error) {
    logger.error('[SecurityEvent] Exception getting summary', error);
    return [];
  }
}

/**
 * Get recent security events for admin view
 */
export async function getRecentSecurityEvents(
  limit: number = 50
): Promise<Array<{
  id: string;
  eventType: string;
  email: string | null;
  ipAddress: string | null;
  severity: SecurityEventSeverity;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}>> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('[SecurityEvent] Failed to get recent events', error);
      return [];
    }

    return (data || []).map((event) => ({
      id: event.id as string,
      eventType: event.event_type as string,
      email: event.email as string | null,
      ipAddress: event.ip_address as string | null,
      severity: event.severity as SecurityEventSeverity,
      createdAt: event.created_at as string,
      metadata: event.metadata as Record<string, unknown> | null,
    }));
  } catch (error) {
    logger.error('[SecurityEvent] Exception getting recent events', error);
    return [];
  }
}

/**
 * Determine severity level based on event type
 */
function getSeverityByEventType(eventType: SecurityEventType): SecurityEventSeverity {
  switch (eventType) {
    case 'failed_login':
      return 'medium';
    case 'rate_limit_exceeded':
      return 'low';
    case 'suspicious_activity':
      return 'high';
    case 'unauthorized_access':
      return 'high';
    case 'brute_force_detected':
      return 'critical';
    default:
      return 'medium';
  }
}

