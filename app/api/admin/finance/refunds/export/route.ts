/**
 * API: Admin - Export Refunds
 * GET /api/admin/finance/refunds/export - Export refunds to Excel
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
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    let query = supabase
      .from('refunds')
      .select(`
        id,
        booking_id,
        refund_amount,
        original_amount,
        refund_percent,
        policy_applied,
        refund_to,
        status,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status as 'pending' | 'approved' | 'processing' | 'completed' | 'rejected');
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: refunds, error } = await query;

    if (error) {
      logger.error('Failed to fetch refunds for export', error);
      return NextResponse.json(
        { error: 'Failed to fetch refunds' },
        { status: 500 }
      );
    }

    // Fetch bookings separately
    const bookingIds = [...new Set((refunds || []).map(r => r.booking_id).filter(Boolean))];
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

    const exportData = (refunds || []).map(refund => {
      const booking = refund.booking_id ? bookingsMap[refund.booking_id] : null;
      return {
        booking_code: booking?.booking_code || '-',
        customer_name: booking?.customer_name || '-',
        original_amount: refund.original_amount,
        refund_amount: refund.refund_amount,
        refund_percent: refund.refund_percent,
        policy_applied: refund.policy_applied || '-',
        refund_to: refund.refund_to || '-',
        status: refund.status,
        created_at: refund.created_at,
      };
    });

    const buffer = await ReportExporter.refunds(exportData);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="refunds-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    logger.error('Export refunds error', error);
    return NextResponse.json(
      { error: 'Failed to export refunds' },
      { status: 500 }
    );
  }
});

