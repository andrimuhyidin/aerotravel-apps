/**
 * API: SOS Emergency
 * POST /api/guide/sos - Trigger SOS alert
 * PRD 6.1.A: Panic Button (SOS Alert System)
 * 
 * Features:
 * - GPS location capture
 * - Push notification to admin
 * - WhatsApp message to internal group
 * - Auto-notify emergency contacts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { sendEmail } from '@/lib/integrations/resend';
import { sendTextMessage } from '@/lib/integrations/whatsapp';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const sosSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notify_nearby_crew: z.boolean().default(false),
  message: z.string().optional(),
  incident_type: z.enum(['medical', 'security', 'weather', 'accident', 'other']).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = await request.json();
  const payload = sosSchema.parse(body);
  
  // Handle both alertType (from lib/guide/sos.ts) and incident_type
  const incidentType = payload.incident_type || (body as { alertType?: string }).alertType || null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get user profile
  const { data: userProfile } = await client
    .from('users')
    .select('full_name, phone, email')
    .eq('id', user.id)
    .single();

  // Get active trip
  const { data: activeTrip } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext,
  )
    .select('trip_id, trips(code, name, departure_date)')
    .eq('guide_id', user.id)
    .eq('status', 'confirmed')
    .is('check_out_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const tripName = activeTrip?.trips?.name || activeTrip?.trips?.code || 'Unknown Trip';
  const guideName = userProfile?.full_name || 'Unknown Guide';

  // Create SOS record
  const { data: sosRecord, error: sosError } = await withBranchFilter(
    client.from('sos_alerts'),
    branchContext,
  ).insert({
    guide_id: user.id,
    trip_id: activeTrip?.trip_id || null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    message: payload.message || null,
    incident_type: incidentType || null,
    status: 'active',
    created_at: new Date().toISOString(),
  } as never).select().single();

  if (sosError) {
    logger.error('Failed to create SOS record', sosError, { guideId: user.id });
  }

  // Build Google Maps link
  const mapsLink =
    payload.latitude && payload.longitude
      ? `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`
      : 'Lokasi tidak tersedia';

  // Build WhatsApp message with templates based on incident type
  const incidentTypeLabels: Record<string, string> = {
    medical: 'Medis',
    security: 'Keamanan',
    weather: 'Cuaca',
    accident: 'Kecelakaan',
    other: 'Lainnya',
  };

  const incidentLabel = incidentType ? incidentTypeLabels[incidentType] || 'Darurat' : 'Darurat';
  
  const whatsappMessage = `🚨 *PERINGATAN: Sinyal SOS Diterima*

*Jenis Insiden:* ${incidentLabel}
*Trip:* ${tripName}
*Guide:* ${guideName}
*Lokasi:* ${mapsLink}
${payload.message ? `*Pesan:* ${payload.message}` : ''}

*Waktu:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

Segera hubungi guide atau kirim bantuan!`;

  // Helper function to send WhatsApp with retry logic
  const sendWhatsAppWithRetry = async (
    to: string,
    message: string,
    maxRetries = 3
  ): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await sendTextMessage(to, message);
        return true;
      } catch (error) {
        logger.warn(`WhatsApp send attempt ${attempt} failed`, {
          to,
          attempt,
          maxRetries,
          error: error instanceof Error ? error.message : String(error),
        });
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          logger.error('WhatsApp send failed after all retries', {
            to,
            maxRetries,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    return false;
  };

  // Send WhatsApp to internal group
  let whatsappGroupSent = false;
  const whatsappGroupId = process.env.WHATSAPP_SOS_GROUP_ID;
  if (whatsappGroupId) {
    whatsappGroupSent = await sendWhatsAppWithRetry(whatsappGroupId, whatsappMessage);
    if (whatsappGroupSent) {
      logger.info('SOS WhatsApp sent to group', {
        guideId: user.id,
        groupId: whatsappGroupId,
      });
    }
  } else {
    logger.warn('WHATSAPP_SOS_GROUP_ID not configured, skipping WhatsApp notification');
  }

  // Send WhatsApp to Ops Admin
  let whatsappAdminSent = false;
  const opsPhone = process.env.WHATSAPP_OPS_PHONE;
  if (opsPhone) {
    whatsappAdminSent = await sendWhatsAppWithRetry(opsPhone, whatsappMessage);
    if (whatsappAdminSent) {
      logger.info('SOS WhatsApp sent to Ops Admin', {
        guideId: user.id,
        phone: opsPhone,
      });
    }
  }

  // Email fallback for admin notifications (if WhatsApp failed or as additional notification)
  const adminEmail = process.env.ADMIN_EMAIL || process.env.OPS_EMAIL;
  if (adminEmail) {
    try {
      const emailSubject = `🚨 SOS Alert - ${guideName} - ${tripName}`;
      const emailBody = `
        <h2>🚨 PERINGATAN: Sinyal SOS Diterima</h2>
        <p><strong>Trip:</strong> ${tripName}</p>
        <p><strong>Guide:</strong> ${guideName}</p>
        <p><strong>Lokasi:</strong> <a href="${mapsLink}">${mapsLink}</a></p>
        ${payload.message ? `<p><strong>Pesan:</strong> ${payload.message}</p>` : ''}
        <p><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
        <p><em>Segera hubungi guide atau kirim bantuan!</em></p>
        ${!whatsappGroupSent && !whatsappAdminSent ? '<p style="color: red;"><strong>Note: WhatsApp notifications failed. This is the primary notification.</strong></p>' : ''}
      `;

      await sendEmail({
        to: adminEmail,
        subject: emailSubject,
        html: emailBody,
      });
      logger.info('SOS email sent to admin', {
        guideId: user.id,
        email: adminEmail,
      });
    } catch (error) {
      logger.error('Failed to send SOS email to admin', error, {
        guideId: user.id,
        email: adminEmail,
      });
    }
  }

  // Notify nearby crew if requested
  if (payload.notify_nearby_crew && payload.latitude && payload.longitude) {
    try {
      const nearbyRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/guide/crew/directory/nearby?lat=${payload.latitude}&lng=${payload.longitude}&radius=10000`,
      );

      if (nearbyRes.ok) {
        const nearbyData = await nearbyRes.json();
        const nearbyCrew = nearbyData.nearby || [];

        // Send notifications to nearby crew
        for (const crew of nearbyCrew) {
          if (crew.phone && crew.phone !== userProfile?.phone) {
            try {
              await sendTextMessage(
                crew.phone,
                `🚨 *SOS Alert - Guide Memerlukan Bantuan*\n\nGuide ${guideName} memerlukan bantuan di lokasi:\n${mapsLink}\n\nJika Anda berada di dekat lokasi, mohon bantuannya.`
              );
            } catch (error) {
              logger.error('Failed to notify nearby crew', error, { crewId: crew.id });
            }
          }
        }

        logger.info('SOS: Notified nearby crew', {
          guideId: user.id,
          nearbyCount: nearbyCrew.length,
        });
      }
    } catch (error) {
      logger.error('Failed to notify nearby crew', error);
    }
  }

  // Auto-notify emergency contacts
  const { data: emergencyContacts } = await client
    .from('guide_emergency_contacts')
    .select('name, phone, auto_notify_on_sos')
    .eq('guide_id', user.id)
    .eq('auto_notify_on_sos', true);

  if (emergencyContacts && emergencyContacts.length > 0) {
    for (const contact of emergencyContacts) {
      if (contact.phone) {
        try {
          await sendTextMessage(
            contact.phone,
            `🚨 *SOS Alert - ${guideName}*\n\n${guideName} memerlukan bantuan darurat di lokasi:\n${mapsLink}\n\nMohon segera hubungi atau kirim bantuan.`
          );
          logger.info('SOS: Notified emergency contact', {
            guideId: user.id,
            contactName: contact.name,
          });
        } catch (error) {
          logger.error('Failed to notify emergency contact', error, {
            guideId: user.id,
            contactName: contact.name,
          });
        }
      }
    }
  }

  // Notify insurance company if trip has insurance
  if (activeTrip?.trip_id) {
    try {
      // Get trip insurance information
      const { data: tripData } = await client
        .from('trips')
        .select('insurance_company_id, insurance_companies(email, name)')
        .eq('id', activeTrip.trip_id)
        .single();

      const insuranceCompany = tripData?.insurance_companies;
      if (insuranceCompany?.email) {
        try {
          const insuranceSubject = `🚨 SOS Alert - Trip ${tripName}`;
          const insuranceBody = `
            <h2>🚨 SOS Alert Notification</h2>
            <p>This is to inform you that a SOS alert has been triggered for a trip covered by your insurance.</p>
            <p><strong>Trip:</strong> ${tripName}</p>
            <p><strong>Guide:</strong> ${guideName}</p>
            <p><strong>Location:</strong> <a href="${mapsLink}">${mapsLink}</a></p>
            ${payload.message ? `<p><strong>Message:</strong> ${payload.message}</p>` : ''}
            <p><strong>Time:</strong> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
            <p>Please coordinate with our operations team for further assistance.</p>
          `;

          await sendEmail({
            to: insuranceCompany.email,
            subject: insuranceSubject,
            html: insuranceBody,
          });
          logger.info('SOS email sent to insurance', {
            guideId: user.id,
            tripId: activeTrip.trip_id,
            insuranceEmail: insuranceCompany.email,
          });
        } catch (error) {
          logger.error('Failed to send SOS email to insurance', error, {
            guideId: user.id,
            tripId: activeTrip.trip_id,
            insuranceEmail: insuranceCompany.email,
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to check trip insurance for SOS notification', {
        error: error instanceof Error ? error.message : String(error),
        guideId: user.id,
        tripId: activeTrip?.trip_id,
      });
    }
  }

  logger.error('SOS ALERT TRIGGERED', {
    guideId: user.id,
    guideName,
    tripName,
    location: payload.latitude && payload.longitude ? { lat: payload.latitude, lng: payload.longitude } : null,
    message: payload.message,
    sosRecordId: sosRecord?.id,
  });

  // Start streaming if location is available
  if (sosRecord?.id && payload.latitude && payload.longitude) {
    try {
      await client.rpc('start_sos_streaming', { p_sos_alert_id: sosRecord.id });
    } catch (error) {
      logger.warn('Failed to start SOS streaming', { error, sosRecordId: sosRecord.id });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'SOS alert sent',
    location: payload.latitude && payload.longitude ? { lat: payload.latitude, lng: payload.longitude } : null,
    sosRecordId: sosRecord?.id,
  });
});
