/**
 * Seed Email & Notification Templates
 * Phase 3: Admin Configurable Settings
 */

-- ============================================
-- EMAIL TEMPLATES
-- ============================================

-- Booking Confirmation Email
INSERT INTO email_templates (template_key, name, subject_template, body_html_template, variables) VALUES
('booking_confirmation', 'Konfirmasi Booking', 
'Pembayaran Berhasil - {{booking_code}} | {{company_name}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">✅ Pembayaran Berhasil!</h1>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #333;">Halo <strong>{{customer_name}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Terima kasih atas pembayaran Anda. Booking Anda telah dikonfirmasi.</p>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #0ea5e9;">Detail Booking</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Kode Booking:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">{{booking_code}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Paket:</td>
            <td style="padding: 8px 0; color: #333;">{{package_name}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Tanggal:</td>
            <td style="padding: 8px 0; color: #333;">{{trip_date}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Total:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">{{total_amount}}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 14px; color: #666;">Tim kami akan segera menghubungi Anda untuk konfirmasi detail perjalanan.</p>
      <p style="font-size: 14px; color: #666;">Jika ada pertanyaan, silakan hubungi customer service kami.</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{booking_url}}" style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Lihat Detail Booking
        </a>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #666;">
      <p style="margin: 0;">© {{year}} {{company_name}}. All rights reserved.</p>
      <p style="margin: 5px 0 0 0;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
    </div>
  </div>
</body>
</html>',
'["customer_name", "booking_code", "package_name", "trip_date", "total_amount", "booking_url", "company_name", "year"]'::jsonb
) ON CONFLICT (template_key) DO NOTHING;

-- License Expiry Alert
INSERT INTO email_templates (template_key, name, subject_template, body_html_template, variables) VALUES
('license_expiry_alert', 'Alert Lisensi Expired',
'🚨 License Expiry Alert: {{license_name}} ({{days_until_expiry}} hari lagi)',
'<h2>⚠️ License Expiry Alert</h2>
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
</p>',
'["license_type", "license_name", "license_number", "expiry_date", "days_until_expiry", "dashboard_url"]'::jsonb
) ON CONFLICT (template_key) DO NOTHING;

-- Certification Expiry Alert (to Guide)
INSERT INTO email_templates (template_key, name, subject_template, body_html_template, variables) VALUES
('certification_expiry_alert', 'Alert Sertifikasi Guide',
'{{urgency_level}}: Sertifikasi {{certification_name}} akan kadaluarsa ({{days_until_expiry}} hari)',
'<h2>Hi {{guide_name}},</h2>
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
</p>',
'["guide_name", "guide_email", "certification_type", "certification_name", "expiry_date", "days_until_expiry", "urgency_level", "manage_url", "ops_email", "ops_phone"]'::jsonb
) ON CONFLICT (template_key) DO NOTHING;

-- Data Breach Notification (to Users)
INSERT INTO email_templates (template_key, name, subject_template, body_html_template, variables) VALUES
('data_breach_notification', 'Notifikasi Data Breach ke User',
'PENTING: Pemberitahuan Insiden Keamanan Data - {{incident_title}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>',
'["user_name", "incident_title", "incident_date", "severity", "affected_data_types", "description", "remediation_steps", "privacy_email", "privacy_phone", "company_name"]'::jsonb
) ON CONFLICT (template_key) DO NOTHING;

-- Data Breach Admin Alert
INSERT INTO email_templates (template_key, name, subject_template, body_html_template, variables) VALUES
('data_breach_admin', 'Alert Data Breach ke Admin',
'🚨 URGENT: Data Breach Incident Reported - {{incident_id}}',
'<div style="background-color: #f8d7da; border: 2px solid #dc3545; padding: 20px; margin-bottom: 20px;">
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
</p>',
'["incident_id", "incident_type", "affected_records", "reported_at", "description", "incident_url"]'::jsonb
) ON CONFLICT (template_key) DO NOTHING;

-- Assessment Reminder
INSERT INTO email_templates (template_key, name, subject_template, body_html_template, variables) VALUES
('assessment_reminder', 'Reminder Self-Assessment',
'📋 Reminder: Permenparekraf Self-Assessment Annual',
'<h2>📋 Self-Assessment Reminder</h2>
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
</p>',
'["assessment_url"]'::jsonb
) ON CONFLICT (template_key) DO NOTHING;

-- Invoice Email
INSERT INTO email_templates (template_key, name, subject_template, body_html_template, variables) VALUES
('invoice_email', 'Email Invoice',
'Invoice {{invoice_number}} - {{company_name}}',
'<h1>Terima kasih atas pemesanan Anda!</h1>
<p>Invoice <strong>{{invoice_number}}</strong> terlampir dalam email ini.</p>
<p>Jika ada pertanyaan, silakan hubungi customer service kami di {{company_phone}} atau {{company_email}}.</p>
<p>Hormat kami,<br/>{{company_name}}</p>',
'["invoice_number", "company_name", "company_phone", "company_email"]'::jsonb
) ON CONFLICT (template_key) DO NOTHING;

-- ============================================
-- NOTIFICATION TEMPLATES
-- ============================================

-- SOS Alert to Admin
INSERT INTO notification_templates (template_key, name, message_template, variables, channel) VALUES
('sos_alert', 'SOS Alert ke Admin',
'🚨 *ALERT SOS DITERIMA* 🚨

*Jenis:* {{incident_type}}
*Guide:* {{guide_name}}
*Trip:* {{trip_name}} {{trip_code}}

📍 *Lokasi:*
{{maps_link}}

{{message_section}}
🕐 *Waktu:* {{timestamp}}

━━━━━━━━━━━━━━━━━
⚡ SEGERA TINDAK LANJUTI!
📞 Hubungi: {{guide_phone}}',
'["incident_type", "guide_name", "trip_name", "trip_code", "maps_link", "message_section", "timestamp", "guide_phone"]'::jsonb,
'whatsapp'
) ON CONFLICT (template_key) DO NOTHING;

-- SOS Alert to Family
INSERT INTO notification_templates (template_key, name, message_template, variables, channel) VALUES
('sos_family', 'SOS Notification ke Keluarga',
'🚨 *NOTIFIKASI DARURAT* 🚨

Halo, kami dari {{company_name}}.

{{guide_name}} ({{guide_role}}) telah mengirimkan sinyal darurat:

*Jenis:* {{incident_type}}
*Lokasi:* {{location}}
*Waktu:* {{timestamp}}

{{message_section}}

Tim operasional kami sudah diberitahu dan sedang menangani situasi ini.

Untuk informasi lebih lanjut, hubungi:
📞 {{ops_phone}}

Terima kasih.',
'["company_name", "guide_name", "guide_role", "incident_type", "location", "timestamp", "message_section", "ops_phone"]'::jsonb,
'whatsapp'
) ON CONFLICT (template_key) DO NOTHING;

-- Guide Absence Notification
INSERT INTO notification_templates (template_key, name, message_template, variables, channel) VALUES
('guide_absence', 'Guide Absence Notification',
'⚠️ *GUIDE ABSENT DETECTED* ⚠️

*Guide:* {{guide_name}}
*Trip:* {{trip_code}}
*Meeting Time:* {{meeting_time}}
*Minutes Late:* {{minutes_late}} menit

Guide belum melakukan check-in 15 menit setelah meeting time.

Mohon segera ditindaklanjuti dari dashboard Admin.
Detail: {{trip_url}}',
'["guide_name", "trip_code", "meeting_time", "minutes_late", "trip_url"]'::jsonb,
'whatsapp'
) ON CONFLICT (template_key) DO NOTHING;

-- Booking Confirmation WhatsApp
INSERT INTO notification_templates (template_key, name, message_template, variables, channel) VALUES
('booking_confirmation_wa', 'Konfirmasi Booking WA',
'✅ *BOOKING CONFIRMED* ✅

Halo {{customer_name}},

Booking Anda telah dikonfirmasi:

📋 *Detail Booking*
• Kode: {{booking_code}}
• Paket: {{package_name}}
• Tanggal: {{trip_date}}
• Jumlah: {{pax_count}} pax
• Total: {{total_amount}}

Tim kami akan menghubungi Anda untuk konfirmasi detail perjalanan.

Terima kasih! 🙏
{{company_name}}',
'["customer_name", "booking_code", "package_name", "trip_date", "pax_count", "total_amount", "company_name"]'::jsonb,
'whatsapp'
) ON CONFLICT (template_key) DO NOTHING;

