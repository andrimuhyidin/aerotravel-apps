/**
 * Email Notification Service
 * Purpose: Send email alerts for compliance events
 * Uses database templates with fallback to hardcoded templates
 */

import { Resend } from 'resend';

import { env } from '@/lib/env';
import { processEmailTemplateWithFallback } from '@/lib/templates/email';
import { logger } from '@/lib/utils/logger';

const resend = new Resend(env.RESEND_API_KEY);

type LicenseExpiryAlertData = {
  licenseType: string;
  licenseName: string;
  licenseNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
};

type CertificationExpiryAlertData = {
  guideName: string;
  guideEmail: string;
  guidePhone: string;
  certificationType: string;
  certificationName: string;
  expiryDate: string;
  daysUntilExpiry: number;
};

type DataBreachNotificationData = {
  incidentId: string;
  incidentType: string;
  affectedRecords: number;
  reportedAt: string;
  description: string;
};

/**
 * Send license expiry alert to admin
 */
export async function sendLicenseExpiryAlert(data: LicenseExpiryAlertData): Promise<boolean> {
  try {
    const variables = {
      license_type: data.licenseType.toUpperCase(),
      license_name: data.licenseName,
      license_number: data.licenseNumber,
      expiry_date: new Date(data.expiryDate).toLocaleDateString('id-ID'),
      days_until_expiry: data.daysUntilExpiry,
      dashboard_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/compliance/licenses`,
    };

    const fallbackHtml = `
      <h2>⚠️ License Expiry Alert</h2>
      <p>Lisensi berikut akan kadaluarsa dalam <strong>{{days_until_expiry}} hari</strong>:</p>
      
      <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tipe Lisensi:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{license_type}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Nama Lisensi:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{license_name}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Nomor Lisensi:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{license_number}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tanggal Kadaluarsa:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{expiry_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Hari Tersisa:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd; color: red;"><strong>{{days_until_expiry}} hari</strong></td>
        </tr>
      </table>
      
      <p><strong>Action Required:</strong></p>
      <ul>
        <li>Segera lakukan perpanjangan lisensi</li>
        <li>Siapkan dokumen yang diperlukan</li>
        <li>Update status di sistem setelah perpanjangan</li>
      </ul>
      
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Email otomatis dari sistem compliance.<br/>
        Login ke dashboard untuk detail lengkap: <a href="{{dashboard_url}}">Dashboard Compliance</a>
      </p>
    `;

    const processed = await processEmailTemplateWithFallback(
      'license_expiry_alert',
      variables,
      {
        subject: `🚨 License Expiry Alert: {{license_name}} ({{days_until_expiry}} hari lagi)`,
        html: fallbackHtml,
      }
    );

    const { data: result, error } = await resend.emails.send({
      from: 'Aero Travel Compliance <noreply@aerotravel.com>',
      to: ['ops@aerotravel.com', 'admin@aerotravel.com'],
      subject: processed.subject,
      html: processed.html,
    });

    if (error) {
      logger.error('Failed to send license expiry alert email', error);
      return false;
    }

    logger.info('License expiry alert sent', { emailId: result?.id, licenseType: data.licenseType });
    return true;
  } catch (error) {
    logger.error('Error sending license expiry alert', error);
    return false;
  }
}

/**
 * Send certification expiry alert to guide
 */
export async function sendCertificationExpiryAlert(
  data: CertificationExpiryAlertData
): Promise<boolean> {
  try {
    const urgencyLevel = data.daysUntilExpiry <= 7 ? '🚨 URGENT' : '⚠️ Important';

    const variables = {
      guide_name: data.guideName,
      guide_email: data.guideEmail,
      certification_type: data.certificationType,
      certification_name: data.certificationName,
      expiry_date: new Date(data.expiryDate).toLocaleDateString('id-ID'),
      days_until_expiry: data.daysUntilExpiry,
      urgency_level: urgencyLevel,
      manage_url: `${env.NEXT_PUBLIC_APP_URL}/mobile/guide/certifications`,
      ops_email: 'ops@aerotravel.com',
      ops_phone: '0812-XXXX-XXXX',
    };

    const fallbackHtml = `
      <h2>Hi {{guide_name}},</h2>
      <p>Sertifikasi Anda akan kadaluarsa dalam <strong>{{days_until_expiry}} hari</strong>:</p>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0;">📋 Detail Sertifikasi</h3>
        <table>
          <tr>
            <td><strong>Jenis:</strong></td>
            <td>{{certification_type}}</td>
          </tr>
          <tr>
            <td><strong>Nama:</strong></td>
            <td>{{certification_name}}</td>
          </tr>
          <tr>
            <td><strong>Kadaluarsa:</strong></td>
            <td>{{expiry_date}}</td>
          </tr>
        </table>
      </div>
      
      <p><strong>⚠️ Penting:</strong></p>
      <ul>
        <li>Sertifikasi yang kadaluarsa akan <strong>memblokir Anda dari trip assignment</strong></li>
        <li>Segera lakukan perpanjangan/renewal sertifikasi</li>
        <li>Upload sertifikat baru ke sistem setelah renewal</li>
      </ul>
      
      <p>
        <a href="{{manage_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          Kelola Sertifikasi
        </a>
      </p>
      
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Jika sudah melakukan renewal, silakan upload sertifikat baru via Guide App.<br/>
        Butuh bantuan? Hubungi Operations Team: {{ops_email}} atau WA: {{ops_phone}}
      </p>
    `;

    const processed = await processEmailTemplateWithFallback(
      'certification_expiry_alert',
      variables,
      {
        subject: `{{urgency_level}}: Sertifikasi {{certification_name}} akan kadaluarsa ({{days_until_expiry}} hari)`,
        html: fallbackHtml,
      }
    );

    const { data: result, error } = await resend.emails.send({
      from: 'Aero Travel Operations <operations@aerotravel.com>',
      to: [data.guideEmail],
      cc: ['ops@aerotravel.com'],
      subject: processed.subject,
      html: processed.html,
    });

    if (error) {
      logger.error('Failed to send certification expiry alert email', error);
      return false;
    }

    logger.info('Certification expiry alert sent', {
      emailId: result?.id,
      guideEmail: data.guideEmail,
    });
    return true;
  } catch (error) {
    logger.error('Error sending certification expiry alert', error);
    return false;
  }
}

/**
 * Send data breach notification (UU PDP requirement)
 */
export async function sendDataBreachNotification(
  data: DataBreachNotificationData
): Promise<boolean> {
  try {
    const variables = {
      incident_id: data.incidentId,
      incident_type: data.incidentType,
      affected_records: data.affectedRecords,
      reported_at: new Date(data.reportedAt).toLocaleString('id-ID'),
      description: data.description,
      incident_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/compliance/breach/${data.incidentId}`,
    };

    const fallbackHtml = `
      <div style="background-color: #f8d7da; border: 2px solid #dc3545; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #721c24; margin-top: 0;">🚨 DATA BREACH ALERT</h2>
        <p style="color: #721c24; font-weight: bold;">
          A data breach incident has been reported and requires immediate attention.
        </p>
      </div>
      
      <h3>Incident Details</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Incident ID:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{incident_id}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Incident Type:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{incident_type}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Affected Records:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd; color: red;"><strong>{{affected_records}}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reported At:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{reported_at}}</td>
        </tr>
      </table>
      
      <h3>Description</h3>
      <p>{{description}}</p>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0;">⚠️ UU PDP 2022 Compliance</h3>
        <p><strong>72-Hour Reporting Requirement:</strong></p>
        <ul>
          <li>Report to Kementerian Komunikasi dan Informatika within 72 hours</li>
          <li>Notify affected users as soon as possible</li>
          <li>Document incident response actions</li>
          <li>Implement corrective measures</li>
        </ul>
      </div>
      
      <p>
        <a href="{{incident_url}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          View Incident Details
        </a>
      </p>
    `;

    const processed = await processEmailTemplateWithFallback(
      'data_breach_admin',
      variables,
      {
        subject: `🚨 URGENT: Data Breach Incident Reported - {{incident_id}}`,
        html: fallbackHtml,
      }
    );

    const { data: result, error } = await resend.emails.send({
      from: 'Aero Travel DPO <dpo@aerotravel.com>',
      to: ['dpo@aerotravel.com', 'legal@aerotravel.com', 'cto@aerotravel.com'],
      subject: processed.subject,
      html: processed.html,
    });

    if (error) {
      logger.error('Failed to send data breach notification email', error);
      return false;
    }

    logger.info('Data breach notification sent', { emailId: result?.id, incidentId: data.incidentId });
    return true;
  } catch (error) {
    logger.error('Error sending data breach notification', error);
    return false;
  }
}

/**
 * Send assessment reminder to admin
 */
export async function sendAssessmentReminder(): Promise<boolean> {
  try {
    const variables = {
      assessment_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/compliance/permenparekraf`,
    };

    const fallbackHtml = `
      <h2>📋 Self-Assessment Reminder</h2>
      <p>Ini adalah reminder untuk melakukan self-assessment tahunan sesuai Permenparekraf No.4/2021.</p>
      
      <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Kewajiban Self-Assessment</h3>
        <p>Setiap usaha pariwisata wajib melakukan self-assessment minimal 1 kali setahun untuk memastikan kepatuhan terhadap standar usaha pariwisata.</p>
      </div>
      
      <p><strong>Yang perlu disiapkan:</strong></p>
      <ul>
        <li>Dokumen legalitas terbaru</li>
        <li>Data SDM dan sertifikasi</li>
        <li>Laporan keuangan</li>
        <li>Dokumentasi fasilitas</li>
        <li>Bukti program lingkungan</li>
      </ul>
      
      <p>
        <a href="{{assessment_url}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          Mulai Assessment
        </a>
      </p>
      
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Butuh bantuan? Hubungi compliance team atau lihat panduan self-assessment di dashboard.
      </p>
    `;

    const processed = await processEmailTemplateWithFallback(
      'assessment_reminder',
      variables,
      {
        subject: '📋 Reminder: Permenparekraf Self-Assessment Annual',
        html: fallbackHtml,
      }
    );

    const { data: result, error } = await resend.emails.send({
      from: 'Aero Travel Compliance <compliance@aerotravel.com>',
      to: ['ops@aerotravel.com', 'admin@aerotravel.com'],
      subject: processed.subject,
      html: processed.html,
    });

    if (error) {
      logger.error('Failed to send assessment reminder email', error);
      return false;
    }

    logger.info('Assessment reminder sent', { emailId: result?.id });
    return true;
  } catch (error) {
    logger.error('Error sending assessment reminder', error);
    return false;
  }
}
