/**
 * API: Admin - Payment Detail
 * GET /api/admin/finance/payments/[id] - Get payment detail with booking info
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = await createAdminClient();

  try {
    // Get payment with booking details
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        id,
        booking_id,
        amount,
        payment_method,
        status,
        proof_url,
        verification_status,
        verified_by,
        verified_at,
        verification_notes,
        paid_at,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Failed to fetch payment detail', error);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Fetch booking separately
    let booking = null;
    if (payment.booking_id) {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          customer_name,
          customer_email,
          customer_phone,
          trip_date,
          adult_pax,
          child_pax,
          infant_pax,
          total_amount,
          status,
          created_at,
          package_id
        `)
        .eq('id', payment.booking_id)
        .single();
      
      if (bookingData) {
        // Fetch package info
        let packageInfo = null;
        if (bookingData.package_id) {
          const { data: pkgData } = await supabase
            .from('packages')
            .select('id, name, destination')
            .eq('id', bookingData.package_id)
            .single();
          packageInfo = pkgData;
        }
        booking = { ...bookingData, packages: packageInfo };
      }
    }

    // Get verifier info if exists
    let verifier = null;
    if (payment.verified_by) {
      const { data: verifierData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', payment.verified_by)
        .single();
      verifier = verifierData;
    }

    // Get verification history
    const { data: verificationLogs } = await supabase
      .from('payment_verification_logs')
      .select(`
        id,
        action,
        previous_status,
        new_status,
        notes,
        rejection_reason,
        performed_at,
        performed_by
      `)
      .eq('payment_id', id)
      .order('performed_at', { ascending: false });

    // Get performer details for logs
    const performerIds = [...new Set((verificationLogs || [])
      .map(log => log.performed_by)
      .filter(Boolean))];

    let performersMap: Record<string, { full_name: string }> = {};
    if (performerIds.length > 0) {
      const { data: performers } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', performerIds);

      if (performers) {
        performersMap = Object.fromEntries(
          performers.map(p => [p.id, { full_name: p.full_name }])
        );
      }
    }

    const logsWithPerformer = (verificationLogs || []).map(log => ({
      ...log,
      performer: log.performed_by ? performersMap[log.performed_by] || null : null,
    }));

    return NextResponse.json({
      payment: {
        ...payment,
        booking,
        verifier,
      },
      verificationLogs: logsWithPerformer,
    });
  } catch (error) {
    logger.error('Unexpected error in payment detail API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

