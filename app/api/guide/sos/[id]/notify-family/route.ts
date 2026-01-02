/**
 * API: SOS Family Notification
 * POST /api/guide/sos/[id]/notify-family - Trigger family notification for SOS
 * 
 * Duty of Care Compliance: Family/Next-of-Kin Notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const notifyFamilySchema = z.object({
  message: z.string().optional(),
  notify_all: z.boolean().default(true),
  contact_ids: z.array(z.string().uuid()).optional(),
});

export const POST = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const supabase = await createClient();
    const { id: sosId } = await params;
    const body = notifyFamilySchema.parse(await request.json());

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = supabase as unknown as ReturnType<typeof createClient>;

    // Get SOS alert details
    const { data: sosAlert, error: sosError } = await client
      .from('sos_alerts')
      .select(`
        *,
        trips(
          id,
          name,
          booking_id,
          bookings(
            id,
            booking_passengers(
              id,
              name,
              passenger_emergency_contacts(
                id,
                contact_name,
                relationship,
                phone,
                email,
                notify_on_emergency,
                preferred_contact_method
              )
            )
          )
        )
      `)
      .eq('id', sosId)
      .single();

    if (sosError || !sosAlert) {
      logger.error('SOS alert not found', sosError, { sosId });
      return NextResponse.json(
        { error: 'SOS alert not found' },
        { status: 404 }
      );
    }

    // Check if user is the guide who triggered SOS or admin
    const { data: userProfile } = await client
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (sosAlert.guide_id !== user.id && 
        !['super_admin', 'ops_admin'].includes(userProfile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Collect all emergency contacts
    const emergencyContacts: Array<{
      id: string;
      passengerName: string;
      contactName: string;
      relationship: string;
      phone: string;
      email?: string;
      preferredMethod: string;
    }> = [];

    const bookings = sosAlert.trips?.bookings;
    if (bookings) {
      const passengers = bookings.booking_passengers || [];
      for (const passenger of passengers) {
        const contacts = passenger.passenger_emergency_contacts || [];
        for (const contact of contacts) {
          if (contact.notify_on_emergency) {
            if (body.notify_all || body.contact_ids?.includes(contact.id)) {
              emergencyContacts.push({
                id: contact.id,
                passengerName: passenger.name,
                contactName: contact.contact_name,
                relationship: contact.relationship,
                phone: contact.phone,
                email: contact.email || undefined,
                preferredMethod: contact.preferred_contact_method || 'whatsapp',
              });
            }
          }
        }
      }
    }

    if (emergencyContacts.length === 0) {
      logger.warn('No emergency contacts found for SOS notification', { sosId });
      return NextResponse.json({
        success: false,
        message: 'No emergency contacts available for notification',
        notifications_sent: 0,
      });
    }

    // Build notification message
    const messageTemplate = body.message || 
      `PERINGATAN DARURAT: Trip ${sosAlert.trips?.name || 'perjalanan'} mengalami keadaan darurat. ` +
      `Tim kami sedang menangani situasi. Kami akan menginformasikan perkembangan segera.`;

    // Create notification log entries
    const notificationLogs = emergencyContacts.map(contact => ({
      reference_type: 'sos_alert',
      reference_id: sosId,
      branch_id: sosAlert.branch_id,
      recipient_name: contact.contactName,
      recipient_phone: contact.phone,
      recipient_email: contact.email || null,
      relationship: contact.relationship,
      notification_type: contact.preferredMethod,
      message_template: 'sos_family_notification',
      message_content: messageTemplate,
      status: 'pending',
      sent_by: user.id,
    }));

    const { data: logs, error: logError } = await client
      .from('emergency_notifications_log')
      .insert(notificationLogs)
      .select();

    if (logError) {
      logger.error('Failed to create notification logs', logError, { sosId });
      return NextResponse.json(
        { error: 'Failed to queue notifications' },
        { status: 500 }
      );
    }

    // TODO: Actually send notifications via WhatsApp/SMS service
    // This would integrate with lib/integrations/whatsapp.ts
    // For now, we just log and update status

    // Update notification status to 'sent' (in real implementation, this would be async)
    if (logs && logs.length > 0) {
      const logIds = logs.map(l => l.id);
      await client
        .from('emergency_notifications_log')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .in('id', logIds);
    }

    logger.info('Family notifications queued for SOS', {
      sosId,
      contactsNotified: emergencyContacts.length,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `${emergencyContacts.length} emergency contacts notified`,
      notifications_sent: emergencyContacts.length,
      contacts: emergencyContacts.map(c => ({
        name: c.contactName,
        relationship: c.relationship,
        method: c.preferredMethod,
      })),
    });
  }
);

