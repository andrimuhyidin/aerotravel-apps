/**
 * Email Notification Service
 * Purpose: Send email alerts for compliance events
 */

import { Resend } from 'resend';

import { env } from '@/lib/env';
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
    const { data: result, error } = await resend.emails.send({
      from: 'Aero Travel Compliance <noreply@aerotravel.com>',
      to: ['ops@aerotravel.com', 'admin@aerotravel.com'],
      subject: `🚨 License Expiry Alert: ${data.licenseName} (${data.daysUntilExpiry} hari lagi)`,
      html: `
        <h2>⚠️ License Expiry Alert</h2>
        <p>Lisensi berikut akan kadaluarsa dalam <strong>${data.daysUntilExpiry} hari</strong>:</p>
        
        <table style="border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tipe Lisensi:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.licenseType.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Nama Lisensi:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.licenseName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Nomor Lisensi:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.licenseNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tanggal Kadaluarsa:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date(data.expiryDate).toLocaleDateString('id-ID')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Hari Tersisa:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: red;"><strong>${data.daysUntilExpiry} hari</strong></td>
          </tr>
        </table>
        
        <p><strong>Action Required:</strong></p>
        <ul>
          <li>Segera lakukan perpanjangan lisensi</li>
          <li>Siapkan dokumen yang diperlukan</li>
          <li>Update status di sistem setelah perpanjangan</li>
        </ul>
        
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Email otomatis dari sistem compliance Aero Travel.<br/>
          Login ke dashboard untuk detail lengkap: <a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/compliance/licenses">Dashboard Compliance</a>
        </p>
      `,
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
    
    const { data: result, error } = await resend.emails.send({
      from: 'Aero Travel Operations <operations@aerotravel.com>',
      to: [data.guideEmail],
      cc: ['ops@aerotravel.com'],
      subject: `${urgencyLevel}: Sertifikasi ${data.certificationName} akan kadaluarsa (${data.daysUntilExpiry} hari)`,
      html: `
        <h2>Hi ${data.guideName},</h2>
        <p>Sertifikasi Anda akan kadaluarsa dalam <strong>${data.daysUntilExpiry} hari</strong>:</p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📋 Detail Sertifikasi</h3>
          <table>
            <tr>
              <td><strong>Jenis:</strong></td>
              <td>${data.certificationType}</td>
            </tr>
            <tr>
              <td><strong>Nama:</strong></td>
              <td>${data.certificationName}</td>
            </tr>
            <tr>
              <td><strong>Kadaluarsa:</strong></td>
              <td>${new Date(data.expiryDate).toLocaleDateString('id-ID')}</td>
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
          <a href="${env.NEXT_PUBLIC_APP_URL}/mobile/guide/certifications" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            Kelola Sertifikasi
          </a>
        </p>
        
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Jika sudah melakukan renewal, silakan upload sertifikat baru via Guide App.<br/>
          Butuh bantuan? Hubungi Operations Team: ops@aerotravel.com atau WA: 0812-XXXX-XXXX
        </p>
      `,
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
    const { data: result, error } = await resend.emails.send({
      from: 'Aero Travel DPO <dpo@aerotravel.com>',
      to: ['dpo@aerotravel.com', 'legal@aerotravel.com', 'cto@aerotravel.com'],
      subject: `🚨 URGENT: Data Breach Incident Reported - ${data.incidentId}`,
      html: `
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
            <td style="padding: 8px; border: 1px solid #ddd;">${data.incidentId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Incident Type:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.incidentType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Affected Records:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: red;"><strong>${data.affectedRecords}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reported At:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date(data.reportedAt).toLocaleString('id-ID')}</td>
          </tr>
        </table>
        
        <h3>Description</h3>
        <p>${data.description}</p>
        
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
        
        <p><strong>Immediate Actions Required:</strong></p>
        <ol>
          <li>Assess the scope and impact</li>
          <li>Contain the breach</li>
          <li>Preserve evidence</li>
          <li>Notify affected parties</li>
          <li>Report to authorities (within 72h)</li>
          <li>Update incident status in system</li>
        </ol>
        
        <p>
          <a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/compliance/breach/${data.incidentId}" 
             style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            View Incident Details
          </a>
        </p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          This is an automated alert from Aero Travel Compliance System.<br/>
          For immediate assistance, contact the incident response team.
        </p>
      `,
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
    const { data: result, error } = await resend.emails.send({
      from: 'Aero Travel Compliance <compliance@aerotravel.com>',
      to: ['ops@aerotravel.com', 'admin@aerotravel.com'],
      subject: '📋 Reminder: Permenparekraf Self-Assessment Annual',
      html: `
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
          <a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/compliance/permenparekraf" 
             style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            Mulai Assessment
          </a>
        </p>
        
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Butuh bantuan? Hubungi compliance team atau lihat panduan self-assessment di dashboard.
        </p>
      `,
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

