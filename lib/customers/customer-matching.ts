/**
 * Customer Matching Algorithm
 * Match customers across different apps by email, phone, or name combination
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type CustomerMatch = {
  customerId: string;
  source: 'partner' | 'customer' | 'corporate';
  email: string | null;
  phone: string | null;
  name: string;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
};

/**
 * Normalize phone number untuk matching
 */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Remove leading 0 or country code (62)
  if (digits.startsWith('62')) {
    return digits.substring(2);
  }
  if (digits.startsWith('0')) {
    return digits.substring(1);
  }
  return digits;
}

/**
 * Normalize email untuk matching
 */
function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

/**
 * Match customer by email (exact match)
 */
async function matchByEmail(email: string): Promise<CustomerMatch[]> {
  const supabase = await createClient();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return [];

  const matches: CustomerMatch[] = [];

  try {
    // Check partner_customers
    const { data: partnerCustomers } = await supabase
      .from('partner_customers')
      .select('id, name, email, phone, partner_id')
      .eq('email', normalizedEmail)
      .limit(10);

    if (partnerCustomers) {
      partnerCustomers.forEach((pc) => {
        matches.push({
          customerId: pc.id,
          source: 'partner',
          email: pc.email,
          phone: pc.phone,
          name: pc.name,
          confidence: 'high',
          matchReason: 'Exact email match in partner customers',
        });
      });
    }

    // Check bookings (customer_name, customer_email, customer_phone)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('customer_email, customer_name, customer_phone, customer_id')
      .eq('customer_email', normalizedEmail)
      .limit(10);

    if (bookings) {
      bookings.forEach((booking) => {
        if (booking.customer_id) {
          matches.push({
            customerId: booking.customer_id as string,
            source: 'customer',
            email: booking.customer_email as string,
            phone: booking.customer_phone as string,
            name: booking.customer_name || 'Unknown',
            confidence: 'high',
            matchReason: 'Exact email match in bookings',
          });
        }
      });
    }
  } catch (error) {
    logger.error('[Customer Matching] Failed to match by email', error, { email });
  }

  return matches;
}

/**
 * Match customer by phone (normalized)
 */
async function matchByPhone(phone: string): Promise<CustomerMatch[]> {
  const supabase = await createClient();
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) return [];

  const matches: CustomerMatch[] = [];

  try {
    // Check partner_customers
    const { data: partnerCustomers } = await supabase
      .from('partner_customers')
      .select('id, name, email, phone, partner_id')
      .limit(100); // Get all and filter in memory (phone normalization needed)

    if (partnerCustomers) {
      partnerCustomers.forEach((pc) => {
        const pcPhone = normalizePhone(pc.phone);
        if (pcPhone === normalizedPhone) {
          matches.push({
            customerId: pc.id,
            source: 'partner',
            email: pc.email,
            phone: pc.phone,
            name: pc.name,
            confidence: 'high',
            matchReason: 'Exact phone match in partner customers',
          });
        }
      });
    }

    // Check bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('customer_email, customer_name, customer_phone, customer_id')
      .limit(100);

    if (bookings) {
      bookings.forEach((booking) => {
        const bookingPhone = normalizePhone(booking.customer_phone as string);
        if (bookingPhone === normalizedPhone && booking.customer_id) {
          matches.push({
            customerId: booking.customer_id as string,
            source: 'customer',
            email: booking.customer_email as string,
            phone: booking.customer_phone as string,
            name: booking.customer_name || 'Unknown',
            confidence: 'high',
            matchReason: 'Exact phone match in bookings',
          });
        }
      });
    }
  } catch (error) {
    logger.error('[Customer Matching] Failed to match by phone', error, { phone });
  }

  return matches;
}

/**
 * Match customer by name + email/phone combination
 */
async function matchByNameAndContact(
  name: string,
  email?: string | null,
  phone?: string | null
): Promise<CustomerMatch[]> {
  const supabase = await createClient();
  const matches: CustomerMatch[] = [];

  try {
    // Normalize name (lowercase, trim)
    const normalizedName = name.toLowerCase().trim();

    // Check partner_customers
    const { data: partnerCustomers } = await supabase
      .from('partner_customers')
      .select('id, name, email, phone, partner_id')
      .ilike('name', `%${normalizedName}%`)
      .limit(20);

    if (partnerCustomers) {
      partnerCustomers.forEach((pc) => {
        let confidence: 'high' | 'medium' | 'low' = 'low';
        let matchReason = 'Name match in partner customers';

        // Check email match
        if (email && pc.email) {
          const pcEmail = normalizeEmail(pc.email);
          const searchEmail = normalizeEmail(email);
          if (pcEmail === searchEmail) {
            confidence = 'high';
            matchReason = 'Name + email match in partner customers';
          }
        }

        // Check phone match
        if (phone && pc.phone) {
          const pcPhone = normalizePhone(pc.phone);
          const searchPhone = normalizePhone(phone);
          if (pcPhone === searchPhone) {
            confidence = confidence === 'high' ? 'high' : 'medium';
            matchReason = 'Name + phone match in partner customers';
          }
        }

        matches.push({
          customerId: pc.id,
          source: 'partner',
          email: pc.email,
          phone: pc.phone,
          name: pc.name,
          confidence,
          matchReason,
        });
      });
    }

    // Check bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('customer_email, customer_name, customer_phone, customer_id')
      .ilike('customer_name', `%${normalizedName}%`)
      .limit(20);

    if (bookings) {
      bookings.forEach((booking) => {
        if (!booking.customer_id) return;

        let confidence: 'high' | 'medium' | 'low' = 'low';
        let matchReason = 'Name match in bookings';

        // Check email match
        if (email && booking.customer_email) {
          const bookingEmail = normalizeEmail(booking.customer_email as string);
          const searchEmail = normalizeEmail(email);
          if (bookingEmail === searchEmail) {
            confidence = 'high';
            matchReason = 'Name + email match in bookings';
          }
        }

        // Check phone match
        if (phone && booking.customer_phone) {
          const bookingPhone = normalizePhone(booking.customer_phone as string);
          const searchPhone = normalizePhone(phone);
          if (bookingPhone === searchPhone) {
            confidence = confidence === 'high' ? 'high' : 'medium';
            matchReason = 'Name + phone match in bookings';
          }
        }

        matches.push({
          customerId: booking.customer_id as string,
          source: 'customer',
          email: booking.customer_email as string,
          phone: booking.customer_phone as string,
          name: booking.customer_name || 'Unknown',
          confidence,
          matchReason,
        });
      });
    }
  } catch (error) {
    logger.error('[Customer Matching] Failed to match by name and contact', error, {
      name,
      email,
      phone,
    });
  }

  return matches;
}

/**
 * Find matching customers
 * Returns all potential matches dengan confidence levels
 */
export async function findCustomerMatches(
  identifier: {
    email?: string | null;
    phone?: string | null;
    name?: string | null;
  }
): Promise<CustomerMatch[]> {
  const matches: CustomerMatch[] = [];
  const seenIds = new Set<string>();

  try {
    // Match by email (highest confidence)
    if (identifier.email) {
      const emailMatches = await matchByEmail(identifier.email);
      emailMatches.forEach((match) => {
        if (!seenIds.has(match.customerId)) {
          matches.push(match);
          seenIds.add(match.customerId);
        }
      });
    }

    // Match by phone (high confidence)
    if (identifier.phone) {
      const phoneMatches = await matchByPhone(identifier.phone);
      phoneMatches.forEach((match) => {
        if (!seenIds.has(match.customerId)) {
          matches.push(match);
          seenIds.add(match.customerId);
        }
      });
    }

    // Match by name + email/phone (medium/low confidence)
    if (identifier.name && (identifier.email || identifier.phone)) {
      const nameMatches = await matchByNameAndContact(
        identifier.name,
        identifier.email,
        identifier.phone
      );
      nameMatches.forEach((match) => {
        if (!seenIds.has(match.customerId)) {
          matches.push(match);
          seenIds.add(match.customerId);
        }
      });
    }

    // Sort by confidence (high -> medium -> low)
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    matches.sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence]);

    return matches;
  } catch (error) {
    logger.error('[Customer Matching] Failed to find matches', error, { identifier });
    return [];
  }
}

