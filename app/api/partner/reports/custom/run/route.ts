/**
 * API: Run Custom Report
 * POST /api/partner/reports/custom/run - Execute and export report
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { exportToExcel } from '@/lib/excel/export';

const runReportSchema = z.object({
  dataSource: z.enum(['bookings', 'customers', 'packages', 'finance']),
  columns: z.array(z.string()),
  filters: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const validation = runReportSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const { dataSource, columns, filters } = validation.data;

  try {
    let data: Record<string, unknown>[] = [];

    switch (dataSource) {
      case 'bookings': {
        let query = client
          .from('bookings')
          .select(`
            id,
            booking_code,
            customer_name,
            trip_date,
            total_amount,
            nta_total,
            status,
            adult_pax,
            child_pax,
            infant_pax,
            created_at,
            package:packages(name)
          `)
          .eq('mitra_id', partnerId)
          .is('deleted_at', null);

        if (filters?.dateFrom) {
          query = query.gte('trip_date', filters.dateFrom);
        }
        if (filters?.dateTo) {
          query = query.lte('trip_date', filters.dateTo);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        const { data: bookings, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        data = (bookings || []).map((b: any) => ({
          booking_code: b.booking_code,
          customer_name: b.customer_name,
          package_name: b.package?.name || '',
          trip_date: b.trip_date,
          total_amount: Number(b.total_amount),
          nta_total: Number(b.nta_total),
          margin: Number(b.total_amount) - Number(b.nta_total),
          status: b.status,
          pax_count: b.adult_pax + b.child_pax + b.infant_pax,
          created_at: b.created_at,
        }));
        break;
      }

      case 'customers': {
        const { data: customers, error } = await client
          .from('partner_customers')
          .select(`
            id,
            name,
            phone,
            email,
            segment,
            created_at
          `)
          .eq('partner_id', partnerId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get booking aggregates for each customer
        const customerIds = (customers || []).map((c: any) => c.id);
        const { data: bookingAggs } = await client
          .from('bookings')
          .select('customer_id, total_amount, created_at')
          .in('customer_id', customerIds)
          .in('status', ['confirmed', 'completed', 'paid']);

        const aggsByCustomer = (bookingAggs || []).reduce((acc: Record<string, any>, b: any) => {
          if (!acc[b.customer_id]) {
            acc[b.customer_id] = { count: 0, total: 0, lastDate: null };
          }
          acc[b.customer_id].count++;
          acc[b.customer_id].total += Number(b.total_amount);
          if (!acc[b.customer_id].lastDate || b.created_at > acc[b.customer_id].lastDate) {
            acc[b.customer_id].lastDate = b.created_at;
          }
          return acc;
        }, {});

        data = (customers || []).map((c: any) => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          segment: c.segment,
          total_bookings: aggsByCustomer[c.id]?.count || 0,
          total_spent: aggsByCustomer[c.id]?.total || 0,
          last_booking_date: aggsByCustomer[c.id]?.lastDate,
          created_at: c.created_at,
        }));
        break;
      }

      case 'packages': {
        const { data: packages, error } = await client
          .from('packages')
          .select(`
            id,
            name,
            destination,
            duration_days,
            duration_nights,
            prices:package_prices(price_nta, price_publish)
          `)
          .eq('status', 'published')
          .is('deleted_at', null);

        if (error) throw error;

        // Get booking aggregates
        const packageIds = (packages || []).map((p: any) => p.id);
        const { data: bookingAggs } = await client
          .from('bookings')
          .select('package_id, total_amount')
          .eq('mitra_id', partnerId)
          .in('package_id', packageIds)
          .in('status', ['confirmed', 'completed', 'paid']);

        const aggsByPackage = (bookingAggs || []).reduce((acc: Record<string, any>, b: any) => {
          if (!acc[b.package_id]) {
            acc[b.package_id] = { count: 0, revenue: 0 };
          }
          acc[b.package_id].count++;
          acc[b.package_id].revenue += Number(b.total_amount);
          return acc;
        }, {});

        data = (packages || []).map((p: any) => {
          const price = p.prices?.[0];
          return {
            name: p.name,
            destination: p.destination,
            duration: `${p.duration_days}D${p.duration_nights}N`,
            price_nta: price?.price_nta || 0,
            price_publish: price?.price_publish || 0,
            total_bookings: aggsByPackage[p.id]?.count || 0,
            revenue: aggsByPackage[p.id]?.revenue || 0,
          };
        });
        break;
      }

      case 'finance': {
        const { data: wallet } = await client
          .from('mitra_wallets')
          .select('id')
          .eq('mitra_id', partnerId)
          .single();

        if (!wallet) {
          data = [];
          break;
        }

        let query = client
          .from('mitra_wallet_transactions')
          .select('*')
          .eq('wallet_id', wallet.id);

        if (filters?.dateFrom) {
          query = query.gte('created_at', filters.dateFrom);
        }
        if (filters?.dateTo) {
          query = query.lte('created_at', filters.dateTo);
        }

        const { data: transactions, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        data = (transactions || []).map((t: any) => ({
          date: t.created_at,
          type: t.transaction_type,
          description: t.description,
          amount: Number(t.amount),
          balance: Number(t.balance_after),
          booking_code: t.booking_id ? 'See booking' : '',
        }));
        break;
      }
    }

    // Filter columns
    const filteredData = data.map((row) => {
      const filtered: Record<string, unknown> = {};
      columns.forEach((col) => {
        if (col in row) {
          filtered[col] = row[col];
        }
      });
      return filtered;
    });

    logger.info('Custom report generated', {
      userId: user.id,
      partnerId,
      dataSource,
      rowCount: filteredData.length,
    });

    return NextResponse.json({
      success: true,
      rowCount: filteredData.length,
      data: filteredData.slice(0, 100), // Return first 100 rows for preview
    });
  } catch (error) {
    logger.error('Failed to run custom report', error, { userId: user.id, partnerId, dataSource });
    throw error;
  }
});

