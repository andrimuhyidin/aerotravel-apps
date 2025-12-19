import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { buildItineraryDaysFromJsonb, buildItineraryDaysFromRows } from '@/lib/guide/itinerary';
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

  // First, fetch trip with package linkage (including package itinerary JSONB)
  let tripQuery = client.from('trips')
    .select(
      `
      id,
      package_id,
      package:packages(
        id,
        itinerary
      )
    `,
    )
    .eq('id', tripId);
  
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }
  
  const { data: trip, error: tripError } = await tripQuery.maybeSingle();

  if (tripError || !trip) {
    logger.error('Trip not found for itinerary', tripError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  if (!trip.package_id) {
    return NextResponse.json({ days: [] });
  }

  // Try to fetch from package_itineraries table first (if table exists)
  // If table doesn't exist, fallback to JSONB itinerary from packages table
  let days: Array<{ dayNumber: number; title: string; activities: Array<{ time?: string; label: string }> }> = [];

  // Try package_itineraries table first
  const { data: packageItineraries, error: itinerariesError } = await client
    .from('package_itineraries')
    .select('day_number, title, description')
    .eq('package_id', trip.package_id)
    .order('day_number', { ascending: true });

  if (!itinerariesError && packageItineraries && packageItineraries.length > 0) {
    // Successfully fetched from package_itineraries table
    days = buildItineraryDaysFromRows(
      packageItineraries as Array<{ day_number: number; title: string | null; description: string | null }>,
    );
  } else {
    // Table doesn't exist or error - try JSONB from packages table
    const packageData = trip.package as { id: string; itinerary: unknown } | null | undefined;
    
    if (packageData?.itinerary) {
      logger.info('Using JSONB itinerary from packages table', {
        tripId,
        packageId: trip.package_id,
        guideId: user.id,
      });
      days = buildItineraryDaysFromJsonb(packageData.itinerary);
    } else if (itinerariesError) {
      // Log error but don't fail - return empty array
      const isTableNotFound = 
        itinerariesError.code === 'PGRST205' ||
        itinerariesError.message?.toLowerCase().includes('could not find the table') ||
        itinerariesError.message?.toLowerCase().includes('schema cache');
      
      if (isTableNotFound) {
        logger.info('package_itineraries table not found, using JSONB fallback', {
          tripId,
          packageId: trip.package_id,
          guideId: user.id,
        });
        // Try to fetch package with itinerary JSONB
        let packageQuery = client.from('packages')
          .select('id, itinerary')
          .eq('id', trip.package_id);
        
        if (!branchContext.isSuperAdmin && branchContext.branchId) {
          packageQuery = packageQuery.eq('branch_id', branchContext.branchId);
        }
        
        const { data: packageWithItinerary } = await packageQuery.maybeSingle();
        
        if (packageWithItinerary?.itinerary) {
          days = buildItineraryDaysFromJsonb(packageWithItinerary.itinerary);
        }
      } else {
        logger.error('Failed to fetch package itineraries', itinerariesError, {
          tripId,
          packageId: trip.package_id,
          guideId: user.id,
          errorCode: itinerariesError.code,
          errorMessage: itinerariesError.message,
        });
      }
    }
  }

  return NextResponse.json({ days });
});

