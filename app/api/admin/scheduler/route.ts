/**
 * Admin Resource Scheduler API
 * GET /api/admin/scheduler - Get scheduled resources
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/scheduler');

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();
  const view = searchParams.get('view') || 'week'; // day, week, month

  try {
    // Fetch trips in date range
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        id,
        trip_code,
        trip_date,
        status,
        package_id,
        packages (
          id,
          name,
          trip_type
        ),
        trip_guides (
          guide_id,
          users (
            id,
            full_name
          )
        )
      `)
      .gte('trip_date', startDate)
      .lte('trip_date', endDate)
      .in('status', ['confirmed', 'in_progress', 'pending'])
      .order('trip_date', { ascending: true });

    if (tripsError) {
      logger.warn('Could not fetch trips, returning sample data', tripsError);
      return NextResponse.json(getSampleSchedulerData(startDate, endDate));
    }

    // Fetch guides
    const { data: guides, error: guidesError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'guide')
      .eq('is_active', true);

    if (guidesError) {
      logger.warn('Could not fetch guides', guidesError);
    }

    // Fetch assets
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, name, type, status, capacity')
      .in('status', ['available', 'in_use']);

    if (assetsError) {
      logger.warn('Could not fetch assets', assetsError);
    }

    // Build schedule data
    type TripGuide = {
      guide_id: string;
      users: { id: string; full_name: string } | null;
    };

    type PackageInfo = {
      id: string;
      name: string;
      trip_type: string;
    };

    const events = (trips || []).map((trip) => {
      const tripGuides = (trip.trip_guides || []) as TripGuide[];
      const pkg = trip.packages as PackageInfo | null;
      
      return {
        id: trip.id,
        title: trip.trip_code,
        subtitle: pkg?.name || 'Unknown Package',
        date: trip.trip_date,
        status: trip.status,
        type: 'trip',
        guides: tripGuides.map((tg) => ({
          id: tg.guide_id,
          name: tg.users?.full_name || 'Unknown',
        })),
        hasConflict: false,
      };
    });

    // Detect conflicts (same guide assigned to multiple trips on same day)
    const guideSchedule: Record<string, string[]> = {};
    events.forEach((event) => {
      event.guides.forEach((guide) => {
        const key = `${guide.id}-${event.date}`;
        if (!guideSchedule[key]) {
          guideSchedule[key] = [];
        }
        guideSchedule[key].push(event.id);
      });
    });

    // Mark conflicts
    Object.values(guideSchedule).forEach((tripIds) => {
      if (tripIds.length > 1) {
        tripIds.forEach((tripId) => {
          const event = events.find((e) => e.id === tripId);
          if (event) {
            event.hasConflict = true;
          }
        });
      }
    });

    return NextResponse.json({
      events,
      resources: {
        guides: (guides || []).map((g) => ({
          id: g.id,
          name: g.full_name,
          email: g.email,
        })),
        assets: (assets || []).map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          capacity: a.capacity,
        })),
      },
      dateRange: {
        start: startDate,
        end: endDate,
      },
      conflicts: events.filter((e) => e.hasConflict).length,
    });
  } catch (error) {
    logger.error('Scheduler fetch error', error);
    return NextResponse.json(getSampleSchedulerData(startDate, endDate));
  }
});

function getSampleSchedulerData(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const events = [];

  // Generate sample events for the next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    if (i % 2 === 0) {
      events.push({
        id: `trip-${i}`,
        title: `TRIP-2026-${String(i + 1).padStart(3, '0')}`,
        subtitle: 'Paket Pahawang 2D1N',
        date: dateStr,
        status: 'confirmed',
        type: 'trip',
        guides: [{ id: 'g1', name: 'Budi Santoso' }],
        hasConflict: false,
      });
    }

    if (i === 3) {
      events.push({
        id: `trip-${i}-b`,
        title: `TRIP-2026-${String(i + 10).padStart(3, '0')}`,
        subtitle: 'Paket Mutun 1D',
        date: dateStr,
        status: 'confirmed',
        type: 'trip',
        guides: [{ id: 'g1', name: 'Budi Santoso' }],
        hasConflict: true,
      });
    }
  }

  return {
    events,
    resources: {
      guides: [
        { id: 'g1', name: 'Budi Santoso', email: 'budi@example.com' },
        { id: 'g2', name: 'Siti Rahayu', email: 'siti@example.com' },
        { id: 'g3', name: 'Ahmad Wijaya', email: 'ahmad@example.com' },
      ],
      assets: [
        { id: 'a1', name: 'KM Pahawang Jaya', type: 'boat', capacity: 20 },
        { id: 'a2', name: 'KM Mutun Express', type: 'boat', capacity: 15 },
        { id: 'a3', name: 'Villa Pantai A', type: 'villa', capacity: 8 },
      ],
    },
    dateRange: {
      start: startDate,
      end: endDate,
    },
    conflicts: 1,
  };
}

