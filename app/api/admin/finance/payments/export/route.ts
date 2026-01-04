/**
 * API: Admin - Export Payments
 * GET /api/admin/finance/payments/export - Export payments to Excel
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createAdminClient } from '@/lib/supabase/server';
import { ReportExporter } from '@/lib/excel/export';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get('status') || 'all';
  const verificationStatus = searchParams.get('verificationStatus') || 'all';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    let query = supabase
      .from('payments')
      .select(`
        id,
        booking_id,
        amount,
        payment_method,
        status,
        verification_status,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status as 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'expired');
    }

    if (verificationStatus !== 'all') {
      query = query.eq('verification_status', verificationStatus);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: payments, error } = await query;

    if (error) {
      logger.error('Failed to fetch payments for export', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    // Fetch bookings separately
    const bookingIds = [...new Set((payments || []).map(p => p.booking_id).filter(Boolean))];
    let bookingsMap: Record<string, { booking_code: string; customer_name: string }> = {};
    
    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, booking_code, customer_name')
        .in('id', bookingIds);
      
      if (bookings) {
        bookingsMap = Object.fromEntries(
          bookings.map(b => [b.id, { booking_code: b.booking_code, customer_name: b.customer_name }])
        );
      }
    }

    const exportData = (payments || []).map(payment => {
      const booking = payment.booking_id ? bookingsMap[payment.booking_id] : null;
      return {
        booking_code: booking?.booking_code || '-',
        customer_name: booking?.customer_name || '-',
        amount: payment.amount,
        payment_method: payment.payment_method || '-',
        status: payment.status,
        verification_status: payment.verification_status || 'pending',
        created_at: payment.created_at,
      };
    });

    const buffer = await ReportExporter.payments(exportData);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    logger.error('Export payments error', error);
    return NextResponse.json(
      { error: 'Failed to export payments' },
      { status: 500 }
    );
  }
});

