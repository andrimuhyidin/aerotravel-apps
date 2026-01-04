/**
 * Breach Notifier - UU PDP 2022 Compliance
 * Handles data breach notification to users and authorities
 */

import 'server-only';

import { sendEmail } from '@/lib/integrations/resend';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';

export type BreachIncident = {
  id: string;
  incidentDate: string;
  detectedAt: string;
  severity: BreachSeverity;
  affectedDataTypes: string[];
  affectedUsersCount: number | null;
  title: string;
  description: string;
  status: string;
};

/**
 * Notify affected users about a data breach
 */
export async function notifyAffectedUsers(
  incidentId: string,
  userIds: string[]
): Promise<boolean> {
  const supabase = await createClient();

  // Get incident details
  const { data: incident } = await supabase
    .from('data_breach_incidents')
    .select('*')
    .eq('id', incidentId)
    .single();

  if (!incident) {
    logger.error('Breach incident not found', { incidentId });
    return false;
  }

  // Get affected users' emails
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('id', userIds);

  if (!users || users.length === 0) {
    logger.error('No affected users found', { incidentId });
    return false;
  }

  // Get template processor
  const { processEmailTemplateWithFallback } = await import('@/lib/templates/email');

  const fallbackHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Pemberitahuan Insiden Keamanan Data</h2>
      
      <p>Kepada Yth. {{user_name}},</p>
      
      <p>Kami menginformasikan bahwa telah terjadi insiden keamanan data yang mungkin mempengaruhi informasi Anda:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
        <strong>Jenis Insiden:</strong> {{incident_title}}<br/>
        <strong>Tanggal Insiden:</strong> {{incident_date}}<br/>
        <strong>Tingkat Keparahan:</strong> {{severity}}<br/>
        <strong>Data yang Terpengaruh:</strong> {{affected_data_types}}
      </div>
      
      <p><strong>Deskripsi:</strong></p>
      <p>{{description}}</p>
      
      {{#if remediation_steps}}
      <p><strong>Langkah yang Telah Kami Ambil:</strong></p>
      <p>{{remediation_steps}}</p>
      {{/if}}
      
      <p><strong>Apa yang Harus Anda Lakukan:</strong></p>
      <ul>
        <li>Segera ubah password akun Anda</li>
        <li>Aktifkan autentikasi dua faktor (2FA)</li>
        <li>Waspadai email atau pesan mencurigakan</li>
        <li>Pantau aktivitas akun Anda secara berkala</li>
      </ul>
      
      <p>Kami mohon maaf atas ketidaknyamanan ini. Keamanan data Anda adalah prioritas utama kami.</p>
      
      <p>Untuk informasi lebih lanjut atau pertanyaan, silakan hubungi:</p>
      <p><strong>Email:</strong> {{privacy_email}}<br/>
      <strong>Telepon:</strong> {{privacy_phone}}</p>
      
      <p>Hormat kami,<br/>Tim {{company_name}}</p>
      
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;"/>
      <p style="font-size: 12px; color: #666;">
        Pemberitahuan ini dikirimkan sesuai dengan ketentuan UU Perlindungan Data Pribadi No. 27 Tahun 2022.
      </p>
    </div>
  `;

  // Send notification emails
  let sentCount = 0;
  for (const user of users) {
    try {
      const variables = {
        user_name: user.full_name || 'Pelanggan',
        incident_title: incident.title as string,
        incident_date: new Date(incident.incident_date as string).toLocaleDateString('id-ID'),
        severity: (incident.severity as string).toUpperCase(),
        affected_data_types: (incident.affected_data_types as string[]).join(', '),
        description: incident.description as string,
        remediation_steps: incident.remediation_steps as string | undefined,
        privacy_email: 'privacy@aerotravel.co.id',
        privacy_phone: '+62 812 3456 7890',
        company_name: 'Aero Travel',
      };

      const processed = await processEmailTemplateWithFallback(
        'data_breach_notification',
        variables,
        {
          subject: `PENTING: Pemberitahuan Insiden Keamanan Data - {{incident_title}}`,
          html: fallbackHtml,
        }
      );

      await sendEmail({
        to: user.email,
        subject: processed.subject,
        html: processed.html,
      });
      sentCount++;
    } catch (error) {
      logger.error('Failed to send breach notification', error, {
        incidentId,
        userId: user.id,
      });
    }
  }

  // Update incident record
  await supabase
    .from('data_breach_incidents')
    .update({
      notification_sent_at: new Date().toISOString(),
      notification_method: 'email',
    })
    .eq('id', incidentId);

  logger.info('Breach notifications sent', {
    incidentId,
    totalUsers: users.length,
    sentCount,
  });

  return sentCount > 0;
}

/**
 * Generate breach report for authorities
 */
export async function generateBreachReport(incidentId: string): Promise<string> {
  const supabase = await createClient();

  const { data: incident } = await supabase
    .from('data_breach_incidents')
    .select('*')
    .eq('id', incidentId)
    .single();

  if (!incident) {
    throw new Error('Incident not found');
  }

  // Generate comprehensive report
  const report = `
LAPORAN INSIDEN PELANGGARAN DATA PRIBADI
Sesuai UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi

=== INFORMASI DASAR ===
Nomor Laporan: ${incidentId}
Tanggal Insiden: ${new Date(incident.incident_date).toLocaleDateString('id-ID')}
Tanggal Deteksi: ${new Date(incident.detected_at).toLocaleDateString('id-ID')}
Tingkat Keparahan: ${incident.severity.toUpperCase()}

=== DESKRIPSI INSIDEN ===
Judul: ${incident.title}
Deskripsi: ${incident.description}

Jenis Data yang Terpengaruh:
${(incident.affected_data_types as string[]).map((type: string) => `- ${type}`).join('\n')}

Perkiraan Jumlah Subjek Data: ${incident.affected_users_count || 'Belum diketahui'}

=== PENYEBAB DAN VEKTOR SERANGAN ===
${incident.root_cause || 'Masih dalam penyelidikan'}
${incident.attack_vector ? `Vektor Serangan: ${incident.attack_vector}` : ''}

=== TINDAKAN PENANGANAN ===
${incident.remediation_steps || 'Belum ada tindakan yang dilaporkan'}

=== STATUS PEMBERITAHUAN ===
Pemberitahuan ke Subjek Data: ${incident.notification_sent_at ? `Sudah dikirim pada ${new Date(incident.notification_sent_at).toLocaleDateString('id-ID')}` : 'Belum dikirim'}
Metode Pemberitahuan: ${incident.notification_method || '-'}

=== INFORMASI PERUSAHAAN ===
Nama: PT. MyAeroTravel Indonesia
Alamat: Bandar Lampung, Indonesia
Email: privacy@aerotravel.co.id
Telepon: +62 812 3456 7890

Tanggal Laporan: ${new Date().toLocaleDateString('id-ID')}
  `.trim();

  logger.info('Breach report generated', { incidentId });

  return report;
}

/**
 * Get breach incidents for admin
 */
export async function getBreachIncidents(limit: number = 10): Promise<BreachIncident[]> {
  const supabase = await createClient();

  const { data: incidents, error } = await supabase
    .from('data_breach_incidents')
    .select('*')
    .order('incident_date', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch breach incidents', error);
    return [];
  }

  return (incidents || []).map((i) => ({
    id: i.id as string,
    incidentDate: i.incident_date as string,
    detectedAt: i.detected_at as string,
    severity: i.severity as BreachSeverity,
    affectedDataTypes: i.affected_data_types as string[],
    affectedUsersCount: i.affected_users_count as number | null,
    title: i.title as string,
    description: i.description as string,
    status: i.status as string,
  }));
}

