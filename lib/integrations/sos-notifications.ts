/**
 * SOS Emergency Notifications Module
 * Handles all SOS-specific notification logic
 * Integrated with WhatsApp Cloud API and Email
 */

import { sendTextMessage, formatPhoneNumber } from './whatsapp';
import { sendEmail } from './resend';
import { logger } from '@/lib/utils/logger';

type SOSAlertData = {
  guideId: string;
  guideName: string;
  guidePhone?: string;
  tripId?: string;
  tripName: string;
  tripCode?: string;
  incidentType: 'medical' | 'security' | 'weather' | 'accident' | 'other' | null;
  latitude?: number;
  longitude?: number;
  message?: string;
  timestamp: Date;
};

type NotificationResult = {
  whatsappGroupSent: boolean;
  whatsappAdminsSent: number;
  whatsappEmergencyContactsSent: number;
  emailSent: boolean;
  errors: string[];
};

const INCIDENT_LABELS: Record<string, string> = {
  medical: '🏥 Medis',
  security: '🔐 Keamanan',
  weather: '⛈️ Cuaca Ekstrem',
  accident: '💥 Kecelakaan',
  other: '⚠️ Darurat',
};

/**
 * Format SOS message for WhatsApp
 */
export function formatSOSMessage(data: SOSAlertData): string {
  const mapsLink = data.latitude && data.longitude
    ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
    : 'Lokasi tidak tersedia';

  const incidentLabel = data.incidentType 
    ? INCIDENT_LABELS[data.incidentType] 
    : '🚨 Darurat';

  const timestamp = data.timestamp.toLocaleString('id-ID', { 
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `🚨 *ALERT SOS DITERIMA* 🚨

*Jenis:* ${incidentLabel}
*Guide:* ${data.guideName}
*Trip:* ${data.tripName}${data.tripCode ? ` (${data.tripCode})` : ''}

📍 *Lokasi:*
${mapsLink}

${data.message ? `💬 *Pesan:*\n${data.message}\n` : ''}
🕐 *Waktu:* ${timestamp}

━━━━━━━━━━━━━━━━━
⚡ SEGERA TINDAK LANJUTI!
📞 Hubungi: ${data.guidePhone || 'N/A'}`;
}

/**
 * Format SOS message for Email
 */
export function formatSOSEmailHTML(data: SOSAlertData): string {
  const mapsLink = data.latitude && data.longitude
    ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
    : null;

  const incidentLabel = data.incidentType 
    ? INCIDENT_LABELS[data.incidentType] 
    : '🚨 Darurat';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .info-row { display: flex; border-bottom: 1px solid #eee; padding: 12px 0; }
    .info-label { font-weight: 600; color: #666; min-width: 100px; }
    .info-value { color: #333; }
    .map-btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
    .message-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-top: 20px; }
    .cta { background: #fee2e2; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; }
    .cta h3 { color: #dc2626; margin: 0 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 ALERT SOS</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">${incidentLabel}</p>
    </div>
    <div class="content">
      <div class="info-row">
        <span class="info-label">Guide</span>
        <span class="info-value">${data.guideName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Trip</span>
        <span class="info-value">${data.tripName}${data.tripCode ? ` (${data.tripCode})` : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Waktu</span>
        <span class="info-value">${data.timestamp.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
      </div>
      ${data.guidePhone ? `
      <div class="info-row">
        <span class="info-label">Telepon</span>
        <span class="info-value"><a href="tel:${data.guidePhone}">${data.guidePhone}</a></span>
      </div>
      ` : ''}
      
      ${mapsLink ? `
      <div style="margin-top: 20px;">
        <strong>📍 Lokasi:</strong><br>
        <a href="${mapsLink}" class="map-btn">Buka di Google Maps →</a>
      </div>
      ` : ''}
      
      ${data.message ? `
      <div class="message-box">
        <strong>💬 Pesan dari Guide:</strong><br>
        ${data.message}
      </div>
      ` : ''}
      
      <div class="cta">
        <h3>⚡ TINDAKAN DIPERLUKAN</h3>
        <p style="margin: 0;">Segera hubungi guide dan kirim bantuan jika diperlukan!</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send WhatsApp notification with retry
 */
async function sendWhatsAppWithRetry(
  to: string,
  message: string,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sendTextMessage(to, message);
      return true;
    } catch (error) {
      logger.warn(`[SOS] WhatsApp attempt ${attempt} failed`, {
        to,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }
  return false;
}

/**
 * Send SOS notifications to all configured channels
 */
export async function sendSOSNotifications(
  data: SOSAlertData
): Promise<NotificationResult> {
  const result: NotificationResult = {
    whatsappGroupSent: false,
    whatsappAdminsSent: 0,
    whatsappEmergencyContactsSent: 0,
    emailSent: false,
    errors: [],
  };

  const message = formatSOSMessage(data);

  // 1. Send to WhatsApp group
  const groupId = process.env.WHATSAPP_SOS_GROUP_ID;
  if (groupId) {
    result.whatsappGroupSent = await sendWhatsAppWithRetry(groupId, message);
    if (result.whatsappGroupSent) {
      logger.info('[SOS] WhatsApp group notified', { guideId: data.guideId });
    } else {
      result.errors.push('Failed to send WhatsApp to SOS group');
    }
  }

  // 2. Send to Ops Admin phones (comma-separated in env)
  const adminPhones = process.env.WHATSAPP_ADMIN_PHONES?.split(',').map(p => p.trim()) || [];
  const opsPhone = process.env.WHATSAPP_OPS_PHONE;
  if (opsPhone && !adminPhones.includes(opsPhone)) {
    adminPhones.unshift(opsPhone);
  }

  for (const phone of adminPhones) {
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      const sent = await sendWhatsAppWithRetry(formattedPhone, message);
      if (sent) {
        result.whatsappAdminsSent++;
      }
    }
  }

  // 3. Send to emergency contacts (from database if configured)
  // This would require additional setup - emergency contacts stored per guide
  // For now, we use the EMERGENCY_CONTACT_PHONES env var
  const emergencyPhones = process.env.EMERGENCY_CONTACT_PHONES?.split(',').map(p => p.trim()) || [];
  for (const phone of emergencyPhones) {
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      const sent = await sendWhatsAppWithRetry(formattedPhone, message);
      if (sent) {
        result.whatsappEmergencyContactsSent++;
      }
    }
  }

  // 4. Send email notification
  const adminEmails = [
    process.env.ADMIN_EMAIL,
    process.env.OPS_EMAIL,
    process.env.EMERGENCY_EMAIL,
  ].filter((e): e is string => !!e);

  if (adminEmails.length > 0) {
    try {
      const htmlContent = formatSOSEmailHTML(data);
      const incidentLabel = data.incidentType 
        ? INCIDENT_LABELS[data.incidentType] 
        : 'Darurat';

      await sendEmail({
        to: adminEmails.join(','),
        subject: `🚨 SOS ALERT - ${data.guideName} - ${data.tripName} [${incidentLabel}]`,
        html: htmlContent,
      });
      result.emailSent = true;
      logger.info('[SOS] Email notification sent', { 
        guideId: data.guideId,
        recipients: adminEmails.length,
      });
    } catch (error) {
      result.errors.push('Failed to send email notification');
      logger.error('[SOS] Failed to send email', error);
    }
  }

  // Log summary
  logger.info('[SOS] Notification summary', {
    guideId: data.guideId,
    tripId: data.tripId,
    ...result,
  });

  return result;
}

/**
 * Send SOS resolution notification
 */
export async function sendSOSResolvedNotification(
  data: SOSAlertData & { resolvedBy: string; resolution: string }
): Promise<boolean> {
  const message = `✅ *SOS RESOLVED*

Alert SOS dari ${data.guideName} telah ditangani.

*Trip:* ${data.tripName}
*Resolved by:* ${data.resolvedBy}
*Resolution:* ${data.resolution}
*Waktu:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

  const groupId = process.env.WHATSAPP_SOS_GROUP_ID;
  if (groupId) {
    return await sendWhatsAppWithRetry(groupId, message);
  }
  return false;
}

