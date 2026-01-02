/**
 * Compliance Notifications Service
 * Sends notifications for compliance alerts via multiple channels
 */

import { sendEmail } from '@/lib/integrations/resend';
import { sendTextMessage as sendWhatsAppMessage } from '@/lib/integrations/whatsapp';
import { sendPushNotification as sendWebPush } from '@/lib/push/web-push';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import { type ComplianceAlert } from './alert-generator';
import { getLicenseTypeDisplayName, type LicenseType } from './license-checker';

export type NotificationChannel = 'email' | 'whatsapp' | 'push';

export type NotificationResult = {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
};

export type AlertNotificationResult = {
  alertId: string;
  results: NotificationResult[];
};

/**
 * Get admin contacts for notifications
 */
async function getAdminContacts(): Promise<{
  emails: string[];
  phones: string[];
}> {
  const supabase = await createClient();
  
  // Get super_admin and ops_admin users
  const { data: admins, error } = await supabase
    .from('users')
    .select('email, phone')
    .in('role', ['super_admin', 'ops_admin']);
  
  if (error) {
    logger.error('Failed to fetch admin contacts', error);
    return { emails: [], phones: [] };
  }
  
  const emails: string[] = [];
  const phones: string[] = [];
  
  (admins || []).forEach((admin) => {
    const a = admin as { email: string | null; phone: string | null };
    if (a.email) emails.push(a.email);
    if (a.phone) phones.push(a.phone);
  });
  
  return { emails, phones };
}

/**
 * Generate HTML email content for compliance alert
 */
function generateAlertEmailHtml(alert: ComplianceAlert, licenseType?: LicenseType): string {
  const severityColors = {
    info: '#3B82F6',
    warning: '#F59E0B',
    critical: '#EF4444',
  };
  
  const severityLabels = {
    info: 'Informasi',
    warning: 'Peringatan',
    critical: 'KRITIS',
  };
  
  const color = severityColors[alert.severity];
  const label = severityLabels[alert.severity];
  const licenseTypeName = licenseType ? getLicenseTypeDisplayName(licenseType) : 'Izin Usaha';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compliance Alert - MyAeroTravel</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Compliance Alert</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">MyAeroTravel ID</p>
  </div>
  
  <div style="background: white; border: 1px solid #E5E7EB; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
    <div style="background: ${color}15; border-left: 4px solid ${color}; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
      <span style="color: ${color}; font-weight: bold; font-size: 14px;">${label}</span>
    </div>
    
    <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1F2937;">
      ${licenseTypeName}
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #4B5563;">
      ${alert.message}
    </p>
    
    ${alert.license ? `
    <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        <strong>Nama Izin:</strong> ${alert.license.name}<br>
        <strong>Nomor:</strong> ${alert.license.number}<br>
        <strong>Jenis:</strong> ${getLicenseTypeDisplayName(alert.license.type)}
      </p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://myaerotravel.id'}/console/compliance" 
         style="background: #1E3A8A; color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 500; display: inline-block;">
        Lihat Detail di Dashboard
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 0;">
      Email ini dikirim otomatis oleh sistem MyAeroTravel ID.<br>
      Jangan balas email ini.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Send email notification for compliance alert
 */
async function sendEmailNotification(alert: ComplianceAlert, emails: string[]): Promise<NotificationResult> {
  if (emails.length === 0) {
    return { channel: 'email', success: false, error: 'No email recipients' };
  }
  
  const severityLabels = {
    info: 'Info',
    warning: '⚠️ Peringatan',
    critical: '🚨 KRITIS',
  };
  
  const subject = `[${severityLabels[alert.severity]}] Compliance Alert - ${alert.license?.name || 'Izin Usaha'}`;
  const html = generateAlertEmailHtml(alert, alert.license?.type);
  
  try {
    await sendEmail({
      to: emails,
      subject,
      html,
    });
    
    logger.info('Email notification sent', { alertId: alert.id, recipients: emails.length });
    return { channel: 'email', success: true };
  } catch (error) {
    logger.error('Failed to send email notification', error);
    return { channel: 'email', success: false, error: String(error) };
  }
}

/**
 * Send WhatsApp notification for compliance alert
 */
async function sendWhatsAppNotification(alert: ComplianceAlert, phones: string[]): Promise<NotificationResult> {
  if (phones.length === 0) {
    return { channel: 'whatsapp', success: false, error: 'No WhatsApp recipients' };
  }
  
  const severityEmojis = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
  };
  
  const message = `${severityEmojis[alert.severity]} *Compliance Alert - MyAeroTravel*

${alert.message}

${alert.license ? `📋 *Detail Izin:*
• Nama: ${alert.license.name}
• Nomor: ${alert.license.number}
• Jenis: ${getLicenseTypeDisplayName(alert.license.type)}` : ''}

🔗 Lihat detail: ${process.env.NEXT_PUBLIC_APP_URL || 'https://myaerotravel.id'}/console/compliance`;
  
  let successCount = 0;
  let lastError: string | undefined;
  
  for (const phone of phones) {
    try {
      await sendWhatsAppMessage(phone, message);
      successCount++;
    } catch (error) {
      logger.error('Failed to send WhatsApp to phone', { phone, error });
      lastError = String(error);
    }
  }
  
  if (successCount > 0) {
    logger.info('WhatsApp notifications sent', { alertId: alert.id, sent: successCount, total: phones.length });
    return { channel: 'whatsapp', success: true };
  }
  
  return { channel: 'whatsapp', success: false, error: lastError || 'All sends failed' };
}

/**
 * Send push notification for compliance alert
 */
async function sendPushNotification(alert: ComplianceAlert): Promise<NotificationResult> {
  logger.info('Push notification requested', { alertId: alert.id });
  
  try {
    const supabase = await createClient();
    
    // Get admin push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('admin_push_subscriptions')
      .select('endpoint, p256dh_key, auth_key, user_id')
      .eq('active', true);
    
    if (error) {
      logger.error('Failed to fetch admin push subscriptions', error);
      return { channel: 'push', success: false, error: error.message };
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      logger.debug('No admin push subscriptions found');
      return { channel: 'push', success: false, error: 'No subscriptions found' };
    }
    
    const severityIcons: Record<string, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
    };
    
    const payload = {
      title: `${severityIcons[alert.severity] || '🔔'} Compliance Alert`,
      body: alert.message,
      data: {
        alertId: alert.id,
        severity: alert.severity,
        type: 'compliance_alert',
        url: '/console/compliance/alerts',
      },
    };
    
    let successCount = 0;
    for (const sub of subscriptions) {
      const success = await sendWebPush(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        },
        payload
      );
      if (success) successCount++;
    }
    
    if (successCount > 0) {
      logger.info('Push notifications sent for compliance alert', { 
        alertId: alert.id, 
        sent: successCount, 
        total: subscriptions.length 
      });
      return { channel: 'push', success: true };
    }
    
    return { channel: 'push', success: false, error: 'All push sends failed' };
  } catch (error) {
    logger.error('Failed to send push notification', error, { alertId: alert.id });
    return { channel: 'push', success: false, error: String(error) };
  }
}

/**
 * Send notifications for a compliance alert via all channels
 */
export async function sendAlertNotifications(
  alert: ComplianceAlert,
  channels: NotificationChannel[] = ['email', 'whatsapp', 'push']
): Promise<AlertNotificationResult> {
  logger.info('Sending alert notifications', { alertId: alert.id, channels });
  
  const { emails, phones } = await getAdminContacts();
  const results: NotificationResult[] = [];
  
  // Send notifications in parallel
  const promises: Promise<NotificationResult>[] = [];
  
  if (channels.includes('email')) {
    promises.push(sendEmailNotification(alert, emails));
  }
  
  if (channels.includes('whatsapp')) {
    promises.push(sendWhatsAppNotification(alert, phones));
  }
  
  if (channels.includes('push')) {
    promises.push(sendPushNotification(alert));
  }
  
  const notificationResults = await Promise.all(promises);
  results.push(...notificationResults);
  
  // Update alert with notification status
  const supabase = await createClient();
  const updateData: Record<string, boolean | string> = {};
  
  for (const result of results) {
    if (result.success) {
      updateData[`${result.channel}_sent`] = true;
      updateData[`${result.channel}_sent_at`] = new Date().toISOString();
    }
  }
  
  if (Object.keys(updateData).length > 0) {
    await supabase
      .from('compliance_alerts')
      .update(updateData)
      .eq('id', alert.id);
  }
  
  return { alertId: alert.id, results };
}

/**
 * Send notifications for multiple alerts
 */
export async function sendBatchAlertNotifications(
  alerts: ComplianceAlert[],
  channels: NotificationChannel[] = ['email', 'whatsapp', 'push']
): Promise<AlertNotificationResult[]> {
  const results: AlertNotificationResult[] = [];
  
  // Send notifications sequentially to avoid rate limiting
  for (const alert of alerts) {
    const result = await sendAlertNotifications(alert, channels);
    results.push(result);
    
    // Small delay between notifications
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  
  return results;
}

/**
 * Send a summary notification of all compliance issues
 */
export async function sendComplianceSummaryNotification(): Promise<void> {
  const supabase = await createClient();
  
  // Get compliance stats
  const { data: licenses } = await supabase
    .from('business_licenses')
    .select('status');
  
  if (!licenses || licenses.length === 0) {
    logger.info('No licenses to report');
    return;
  }
  
  const stats = {
    total: licenses.length,
    valid: 0,
    warning: 0,
    critical: 0,
    expired: 0,
  };
  
  licenses.forEach((l) => {
    const license = l as { status: string };
    if (stats[license.status as keyof typeof stats] !== undefined) {
      stats[license.status as keyof typeof stats]++;
    }
  });
  
  // Only send summary if there are issues
  if (stats.expired === 0 && stats.critical === 0 && stats.warning === 0) {
    logger.info('All licenses valid, no summary needed');
    return;
  }
  
  const { emails, phones } = await getAdminContacts();
  
  const summaryMessage = `📊 *Ringkasan Compliance Harian - MyAeroTravel*

📋 Total Izin: ${stats.total}
✅ Valid: ${stats.valid}
⚠️ Warning (30 hari): ${stats.warning}
🚨 Critical (7 hari): ${stats.critical}
❌ Expired: ${stats.expired}

📈 Skor Compliance: ${Math.round((stats.valid / stats.total) * 100)}%

${stats.expired > 0 || stats.critical > 0 ? '⚠️ *Perhatian:* Ada izin yang membutuhkan tindakan segera!' : ''}

🔗 Detail: ${process.env.NEXT_PUBLIC_APP_URL || 'https://myaerotravel.id'}/console/compliance`;
  
  // Send to all admin phones
  for (const phone of phones) {
    try {
      await sendWhatsAppMessage(phone, summaryMessage);
    } catch (error) {
      logger.error('Failed to send summary to phone', { phone, error });
    }
  }
  
  logger.info('Compliance summary sent', { recipients: phones.length });
}

