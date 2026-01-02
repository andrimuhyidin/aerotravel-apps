/**
 * Admin Alert Service
 * Sends critical alerts to admin users for immediate attention
 */

import 'server-only';

import { sendEmail } from '@/lib/integrations/resend';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import { createNotification } from './unified-notifications';

export type AdminAlertType =
  | 'payment_fraud'
  | 'sos_emergency'
  | 'system_error'
  | 'compliance_violation'
  | 'data_validation_failure'
  | 'security_alert';

export type AdminAlertInput = {
  type: AdminAlertType;
  title: string;
  message: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
};

const ALERT_CONFIG: Record<AdminAlertType, { icon: string; priority: number }> = {
  payment_fraud: { icon: '🚨', priority: 1 },
  sos_emergency: { icon: '🆘', priority: 1 },
  security_alert: { icon: '🔐', priority: 1 },
  system_error: { icon: '⚠️', priority: 2 },
  compliance_violation: { icon: '📋', priority: 2 },
  data_validation_failure: { icon: '❌', priority: 3 },
};

/**
 * Send alert to all admin users
 */
export async function sendAdminAlert(input: AdminAlertInput): Promise<void> {
  const supabase = await createAdminClient();
  const config = ALERT_CONFIG[input.type];
  const severity = input.severity || 'medium';

  try {
    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('role', ['admin', 'super_admin'])
      .eq('is_active', true);

    if (adminError) {
      logger.error('[AdminAlert] Failed to fetch admin users', adminError);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      logger.warn('[AdminAlert] No admin users found');
      return;
    }

    const fullTitle = `${config.icon} ${input.title}`;
    const fullMessage = input.orderId
      ? `${input.message}\n\nOrder ID: ${input.orderId}`
      : input.message;

    // Create in-app notifications for all admins
    const notificationPromises = adminUsers.map((admin) =>
      createNotification({
        user_id: admin.id,
        app: 'admin',
        type: 'system.announcement',
        title: fullTitle,
        message: fullMessage,
        metadata: {
          alertType: input.type,
          severity,
          orderId: input.orderId,
          ...input.metadata,
        },
      })
    );

    await Promise.allSettled(notificationPromises);

    // For high/critical severity, also send email
    if (severity === 'high' || severity === 'critical') {
      const adminEmails = adminUsers
        .filter((admin) => admin.email)
        .map((admin) => admin.email as string);

      if (adminEmails.length > 0) {
        try {
          await sendEmail({
            to: adminEmails,
            subject: `[${severity.toUpperCase()}] ${fullTitle} - Aero Travel Admin`,
            html: buildAlertEmailHtml(input, config),
          });
          logger.info('[AdminAlert] Email sent to admins', { 
            type: input.type, 
            recipientCount: adminEmails.length 
          });
        } catch (emailError) {
          logger.error('[AdminAlert] Failed to send email', emailError);
          // Don't fail the overall alert for email errors
        }
      }
    }

    logger.info('[AdminAlert] Alert sent', {
      type: input.type,
      severity,
      adminCount: adminUsers.length,
      orderId: input.orderId,
    });
  } catch (error) {
    logger.error('[AdminAlert] Failed to send alert', error, input);
  }
}

function buildAlertEmailHtml(
  input: AdminAlertInput,
  config: { icon: string; priority: number }
): string {
  const severity = input.severity || 'medium';
  const severityColors: Record<string, string> = {
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="background: ${severityColors[severity]}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">${config.icon} Admin Alert</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Severity: ${severity.toUpperCase()}</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #333;">${input.title}</h2>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">${input.message}</p>
          
          ${input.orderId ? `
          <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">
              <strong>Order ID:</strong> ${input.orderId}
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://admin.myaerotravel.id/console" 
               style="background: ${severityColors[severity]}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View in Admin Console
            </a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">This is an automated alert from Aero Travel Admin System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

