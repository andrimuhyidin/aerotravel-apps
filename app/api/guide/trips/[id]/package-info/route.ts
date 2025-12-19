/**
 * API: Trip Package Information
 * GET /api/guide/trips/[id]/package-info
 * 
 * Returns package inclusions and add-ons for a trip
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import {
    getDefaultTemplate,
    mergeFacilities,
    type FacilityDisplayItem,
} from '@/lib/guide/facilities';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get trip with package info (including package_type and destination for template)
  let tripQuery = client.from('trips')
    .select(`
      id,
      package_id,
      package:packages(
        id,
        name,
        package_type,
        destination,
        inclusions,
        exclusions
      )
    `)
    .eq('id', tripId);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip, error: tripError } = await tripQuery.single();

  if (tripError || !trip) {
    logger.error('Trip not found for package info', tripError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const packageData = trip.package as {
    id?: string;
    name?: string | null;
    package_type?: string | null;
    destination?: string | null;
    inclusions?: string[] | null;
    exclusions?: string[] | null;
  } | null;

  // Get package type for template selection
  const packageType = packageData?.package_type || null;
  
  // Try to detect trip type (boat_trip vs land_trip)
  // package_type is 'open_trip' | 'private_trip' etc, not boat_trip/land_trip
  // So we need to detect from destination or name
  let detectedTripType: string | null = null;
  
  // Detection logic: check destination and name for keywords
  const destination = packageData?.destination || '';
  const packageName = packageData?.name || '';
  const searchText = `${destination} ${packageName}`.toLowerCase();
  
  if (searchText.includes('boat') || searchText.includes('kapal') || 
      searchText.includes('island') || searchText.includes('pulau') ||
      searchText.includes('snorkel') || searchText.includes('diving') ||
      searchText.includes('karimun') || searchText.includes('derawan') ||
      searchText.includes('raja ampat') || searchText.includes('komodo') ||
      searchText.includes('pahawang') || searchText.includes('kiluan')) {
    detectedTripType = 'boat_trip';
  } else if (searchText.includes('land') || searchText.includes('darat') || 
             searchText.includes('gunung') || searchText.includes('mountain') ||
             searchText.includes('hiking') || searchText.includes('tracking')) {
    detectedTripType = 'land_trip';
  }

  // Get default template based on detected trip type
  const defaultTemplate = getDefaultTemplate(detectedTripType || undefined);
  
  // Get package inclusions and exclusions
  const packageInclusions = packageData?.inclusions || [];
  const packageExclusions = packageData?.exclusions || [];

  // Merge default template with package overrides
  // Hasil akan termasuk BAIK facilities yang included MAUPUN excluded
  // Excluded facilities akan muncul dengan status 'excluded' untuk ditampilkan di UI
  const mergedFacilities: FacilityDisplayItem[] = mergeFacilities(
    defaultTemplate,
    packageInclusions,
    packageExclusions
  );

  // Log untuk debugging (akan dihapus di production jika perlu)
  if (packageExclusions.length > 0) {
    const includedCount = mergedFacilities.filter((f) => f.status === 'included').length;
    const excludedCount = mergedFacilities.filter((f) => f.status === 'excluded').length;
    logger.info('Merged facilities with exclusions', {
      tripId,
      packageId: trip.package_id,
      totalFacilities: mergedFacilities.length,
      includedCount,
      excludedCount,
      packageExclusionsCount: packageExclusions.length,
      excludedFacilities: mergedFacilities
        .filter((f) => f.status === 'excluded')
        .map((f) => f.name),
    });
  }

  // Also try to fetch from package_inclusions table (for backward compatibility)
  let detailedInclusions: Array<{ type: string; description: string }> = [];
  if (trip.package_id) {
    try {
      const { data: inclusionsData } = await client
        .from('package_inclusions')
        .select('inclusion_type, description')
        .eq('package_id', trip.package_id)
        .eq('is_included', true);

      if (inclusionsData && inclusionsData.length > 0) {
        detailedInclusions = inclusionsData.map((item: { inclusion_type: string; description: string | null }) => ({
          type: item.inclusion_type,
          description: item.description || '',
        }));
      }
    } catch {
      // Table might not exist, use array from packages table
      logger.info('package_inclusions table not available, using array from packages', {
        tripId,
        packageId: trip.package_id,
      });
    }
  }

  // Get add-ons from bookings for this trip
  let addOns: Array<{ name: string; quantity?: number; description?: string }> = [];
  try {
    // Get trip bookings
    const { data: tripBookings } = await client
      .from('trip_bookings')
      .select('booking_id')
      .eq('trip_id', tripId);

    if (tripBookings && tripBookings.length > 0) {
      const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);

      // Check if booking_addons table exists
      try {
        const { data: addonsData } = await client
          .from('booking_addons')
          .select('addon_name, quantity, description')
          .in('booking_id', bookingIds);

        if (addonsData && addonsData.length > 0) {
          // Group by addon_name and sum quantities
          const addonsMap = new Map<string, { quantity: number; description?: string }>();
          addonsData.forEach((item: { addon_name: string; quantity?: number; description?: string | null }) => {
            const existing = addonsMap.get(item.addon_name) || { quantity: 0, description: item.description || undefined };
            addonsMap.set(item.addon_name, {
              quantity: existing.quantity + (item.quantity || 1),
              description: existing.description || item.description || undefined,
            });
          });

          addOns = Array.from(addonsMap.entries()).map(([name, data]) => ({
            name,
            quantity: data.quantity > 1 ? data.quantity : undefined,
            description: data.description,
          }));
        }
      } catch {
        // booking_addons table might not exist, check special_requests in bookings
        logger.info('booking_addons table not available, checking special_requests', {
          tripId,
          bookingIdsCount: bookingIds.length,
        });

        const { data: bookings } = await client
          .from('bookings')
          .select('special_requests')
          .in('id', bookingIds)
          .not('special_requests', 'is', null);

        if (bookings && bookings.length > 0) {
          // Extract add-ons from special_requests (if formatted as add-ons)
          const specialRequests = bookings
            .map((b: { special_requests?: string | null }) => b.special_requests)
            .filter((sr: string | null | undefined): sr is string => !!sr);

          if (specialRequests.length > 0) {
            // Try to parse add-ons from special requests
            // This is a fallback - ideally add-ons should be in a dedicated table
            addOns = specialRequests.map((sr: string) => ({
              name: sr,
              description: 'Dari special request',
            }));
          }
        }
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch add-ons', { tripId, error: err });
    }

  // Get special notes from bookings (internal_notes or special_requests)
  let specialNotes: string | null = null;
  try {
    const { data: tripBookings } = await client
      .from('trip_bookings')
      .select('booking_id')
      .eq('trip_id', tripId);

    if (tripBookings && tripBookings.length > 0) {
      const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);
      
      const { data: bookings } = await client
        .from('bookings')
        .select('internal_notes, special_requests')
        .in('id', bookingIds);

      if (bookings && bookings.length > 0) {
        // Collect all notes (prioritize internal_notes, fallback to special_requests)
        const notes = bookings
          .map((b: { internal_notes?: string | null; special_requests?: string | null }) => {
            return b.internal_notes || b.special_requests || null;
          })
          .filter((note: string | null | undefined): note is string => !!note && note.trim().length > 0);

        if (notes.length > 0) {
          specialNotes = notes.join('\n\n');
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to fetch special notes', { tripId, error });
  }

  return NextResponse.json({
    package: {
      name: packageData?.name || null,
      package_type: packageType || null,
      // Legacy format (for backward compatibility)
      inclusions: detailedInclusions.length > 0
        ? detailedInclusions.map((i) => i.description || i.type)
        : packageData?.inclusions || [],
      exclusions: packageData?.exclusions || [],
      detailedInclusions: detailedInclusions.length > 0 ? detailedInclusions : null,
      // New merged facilities format
      facilities: mergedFacilities,
      defaultTemplate: defaultTemplate,
    },
    addOns,
    specialNotes,
  });
});
