/**
 * Unified Customer Profile System
 * Aggregate customer data dari semua apps (partner, customer, corporate)
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { findCustomerMatches } from './customer-matching';

export type PartnerCustomer = {
  id: string;
  partnerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export type UnifiedCustomer = {
  id: string;
  core: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  partnerCustomers: PartnerCustomer[];
  bookings: Array<{
    id: string;
    bookingCode: string;
    tripDate: string;
    status: string;
    totalAmount: number;
    packageName: string;
    createdAt: string;
  }>;
  stats: {
    totalBookings: number;
    totalSpent: number;
    lastTripDate: string | null;
    averageBookingValue: number;
  };
};

/**
 * Get unified customer profile
 * Aggregates data dari partner_customers, bookings, dan other sources
 */
export async function getUnifiedCustomer(
  identifier: { email?: string; phone?: string; customerId?: string }
): Promise<UnifiedCustomer | null> {
  const supabase = await createClient();

  try {
    // Find matching customers
    const matches = await findCustomerMatches(identifier);

    if (matches.length === 0) {
      return null;
    }

    // Use the highest confidence match as primary
    const primaryMatch = matches[0];
    if (!primaryMatch) {
      return null;
    }

    // Get all partner customers for this customer
    const partnerCustomers: PartnerCustomer[] = [];
    const customerIds = new Set<string>([primaryMatch.customerId]);

    // Collect all related customer IDs
    matches.forEach((match) => {
      if (match.source === 'partner') {
        customerIds.add(match.customerId);
      }
    });

    // Fetch partner customers
    for (const customerId of customerIds) {
      const { data: pcData } = await supabase
        .from('partner_customers')
        .select('id, partner_id, name, email, phone, created_at')
        .eq('id', customerId)
        .limit(10);

      if (pcData) {
        pcData.forEach((pc) => {
          partnerCustomers.push({
            id: pc.id,
            partnerId: pc.partner_id as string,
            name: pc.name,
            email: pc.email,
            phone: pc.phone,
            createdAt: pc.created_at,
          });
        });
      }
    }

    // Get all bookings for this customer (by email, phone, or customer_id)
    const bookings: UnifiedCustomer['bookings'] = [];
    let bookingQuery = supabase
      .from('bookings')
      .select(
        'id, booking_code, trip_date, status, total_amount, customer_name, customer_email, customer_phone, customer_id, package:packages(name), created_at'
      )
      .order('created_at', { ascending: false })
      .limit(50);

    // Filter by customer_id if available
    if (primaryMatch.customerId) {
      bookingQuery = bookingQuery.eq('customer_id', primaryMatch.customerId);
    } else if (identifier.email) {
      bookingQuery = bookingQuery.eq('customer_email', identifier.email);
    } else if (identifier.phone) {
      bookingQuery = bookingQuery.eq('customer_phone', identifier.phone);
    }

    const { data: bookingsData } = await bookingQuery;

    if (bookingsData) {
      bookingsData.forEach((booking: any) => {
        bookings.push({
          id: booking.id,
          bookingCode: booking.booking_code,
          tripDate: booking.trip_date,
          status: booking.status,
          totalAmount: booking.total_amount || 0,
          packageName: booking.package?.name || 'Unknown Package',
          createdAt: booking.created_at,
        });
      });
    }

    // Calculate stats
    const totalBookings = bookings.length;
    const totalSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const lastTripDate =
      bookings.length > 0
        ? bookings.sort((a, b) => (b.tripDate > a.tripDate ? 1 : -1))[0]?.tripDate || null
        : null;
    const averageBookingValue = totalBookings > 0 ? totalSpent / totalBookings : 0;

    // Determine core customer info (from primary match)
    const core = {
      name: primaryMatch.name,
      email: primaryMatch.email,
      phone: primaryMatch.phone,
    };

    return {
      id: primaryMatch.customerId,
      core,
      partnerCustomers,
      bookings,
      stats: {
        totalBookings,
        totalSpent,
        lastTripDate,
        averageBookingValue,
      },
    };
  } catch (error) {
    logger.error('[Unified Customer] Failed to get unified customer', error, { identifier });
    return null;
  }
}

/**
 * Create unified customer profile view (database view)
 * This will be created via migration
 */
export async function createUnifiedCustomerView(): Promise<void> {
  // This function is for reference - actual view creation is done via migration
  logger.info('[Unified Customer] View creation should be done via migration');
}

