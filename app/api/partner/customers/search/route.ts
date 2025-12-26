/**
 * API: Smart Customer Search
 * GET /api/partner/customers/search?q={phone/name}
 * 
 * Features:
 * - Fuzzy search by phone or name
 * - Returns customer history and auto-fill suggestions
 * - Optimized for fast lookup
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  try {
    // Search in customer_booking_history first (fast, indexed)
    const { data: historyResults, error: historyError } = await client
      .from('customer_booking_history')
      .select('*')
      .eq('partner_id', user.id)
      .or(
        `customer_phone.ilike.%${query}%,customer_name.ilike.%${query}%`
      )
      .order('last_booking_date', { ascending: false })
      .limit(limit);

    if (historyError) {
      logger.warn('Failed to search customer history', historyError, {
        userId: user.id,
        query,
      });
    }

    // Also search in customers table (if exists)
    const { data: customerResults, error: customerError } = await client
      .from('customers')
      .select(`
        id,
        name,
        phone,
        email,
        created_at
      `)
      .or(`phone.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(limit);

    if (customerError) {
      logger.warn('Failed to search customers', customerError, {
        userId: user.id,
        query,
      });
    }

    // Merge and deduplicate results
    const results = [];
    const seenPhones = new Set<string>();

    // Priority 1: History results (partner-specific)
    if (historyResults) {
      for (const history of historyResults) {
        if (history.customer_phone && !seenPhones.has(history.customer_phone)) {
          results.push({
            source: 'history',
            id: history.id,
            customerId: null,
            customerName: history.customer_name,
            customerPhone: history.customer_phone,
            customerEmail: history.customer_email,
            bookingCount: history.booking_count,
            lastBookingDate: history.last_booking_date,
            avgPaxCount: history.avg_pax_count,
            preferredPackageTypes: history.preferred_package_types,
            // Auto-fill suggestions
            suggestedPax: Math.round(history.avg_pax_count || 2),
          });
          seenPhones.add(history.customer_phone);
        }
      }
    }

    // Priority 2: Customer table results
    if (customerResults) {
      for (const customer of customerResults) {
        if (customer.phone && !seenPhones.has(customer.phone)) {
          results.push({
            source: 'customer',
            id: customer.id,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            bookingCount: 0,
            lastBookingDate: null,
            avgPaxCount: null,
            preferredPackageTypes: null,
            suggestedPax: 2, // Default
          });
          seenPhones.add(customer.phone);
        }
      }
    }

    logger.info('Customer search completed', {
      userId: user.id,
      query,
      resultCount: results.length,
    });

    return NextResponse.json({ results });
  } catch (error) {
    logger.error('Failed to search customers', error, { userId: user.id, query });
    throw error;
  }
});

