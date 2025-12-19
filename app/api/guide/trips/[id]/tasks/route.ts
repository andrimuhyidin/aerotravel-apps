/**
 * API: Trip Tasks
 * GET /api/guide/trips/[id]/tasks - Get tasks for a trip
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  // Get trip with package info (including itinerary JSONB and package_id for package_itineraries)
  let tripQuery = client.from('trips')
    .select(
      `
      id,
      package_id,
      package:packages(
        id,
        itinerary,
        duration_days
      )
    `,
    )
    .eq('id', tripId);
  
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }
  
  const { data: trip, error: tripError } = await tripQuery.single();

  if (tripError || !trip) {
    logger.error('Trip not found', tripError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Get or create tasks for this trip
  let tasksQuery = client.from('trip_tasks')
    .select('*')
    .eq('trip_id', tripId);
  
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tasksQuery = tasksQuery.eq('branch_id', branchContext.branchId);
  }
  
  const { data: existingTasks, error: tasksError } = await tasksQuery
    .order('order_index', { ascending: true });

  if (tasksError) {
    logger.error('Failed to fetch trip tasks', tasksError, { tripId });
  }

  // If no tasks exist, generate from package template
  if (!existingTasks || existingTasks.length === 0) {
    const packageId = trip.package_id;
    const tasks = await generateTasksFromPackage(
      packageId,
      trip.package?.itinerary,
      trip.package?.duration_days,
      client,
      branchContext,
    );
    
    // Insert tasks
    if (tasks.length > 0) {
      const { error: insertError } = await client.from('trip_tasks').insert(
        tasks.map((task, index) => ({
          trip_id: tripId,
          branch_id: branchContext.branchId,
          label: task.label,
          required: task.required,
          category: task.category,
          order_index: index,
        })),
      );

      if (insertError) {
        logger.error('Failed to create trip tasks', insertError, { tripId });
      }
    }

    // Fetch again after creation
    let newTasksQuery = client.from('trip_tasks')
      .select('*')
      .eq('trip_id', tripId);
    
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      newTasksQuery = newTasksQuery.eq('branch_id', branchContext.branchId);
    }
    
    const { data: newTasks } = await newTasksQuery
      .order('order_index', { ascending: true });

    return NextResponse.json({
      tasks:
        newTasks?.map((t: { id: string; label: string; required: boolean; completed: boolean | null; completed_at: string | null; category: string | null }) => ({
          id: t.id,
          label: t.label,
          required: t.required,
          completed: t.completed || false,
          completedAt: t.completed_at,
          category: t.category,
        })) || [],
    });
  }

  return NextResponse.json({
    tasks: existingTasks.map((t: { id: string; label: string; required: boolean; completed: boolean | null; completed_at: string | null; category: string | null }) => ({
      id: t.id,
      label: t.label,
      required: t.required,
      completed: t.completed || false,
      completedAt: t.completed_at,
      category: t.category,
    })),
  });
});

/**
 * Generate tasks from package itinerary recipe
 * Tries to fetch from package_itineraries table first, then falls back to JSONB itinerary
 */
async function generateTasksFromPackage(
  packageId: string | undefined,
  itineraryJsonb: unknown,
  durationDays: number | undefined,
  client: unknown,
  branchContext: unknown,
): Promise<Array<{
  label: string;
  required: boolean;
  category?: string;
}>> {
  const tasks: Array<{ label: string; required: boolean; category?: string }> = [];

  // Try to fetch from package_itineraries table first
  // Note: package_itineraries is master data, no branch filter needed
  if (packageId && client) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabaseClient = client as any;
      const { data: packageItineraries, error: packageItinerariesError } = await supabaseClient
        .from('package_itineraries')
        .select('day_number, title, description')
        .eq('package_id', packageId)
        .order('day_number', { ascending: true });

      if (packageItinerariesError) {
        // Check if it's an RLS/permission error
        const isRlsError = packageItinerariesError.code === 'PGRST301' || 
                           packageItinerariesError.message?.includes('permission') ||
                           packageItinerariesError.message?.includes('policy') ||
                           packageItinerariesError.message?.includes('row-level security');
        
        logger.warn('Failed to fetch package itineraries for tasks', {
          packageId,
          error: packageItinerariesError,
          errorCode: packageItinerariesError.code,
          errorMessage: packageItinerariesError.message,
          isRlsError,
        });
        // Continue without package itineraries - will fall back to JSONB or default template
      }

      if (packageItineraries && packageItineraries.length > 0) {
        // Parse activities from itinerary descriptions
        for (const dayItinerary of packageItineraries) {
          const dayNum = (dayItinerary as { day_number: number }).day_number;
          const description = (dayItinerary as { description: string | null }).description || '';

          // Always add briefing for first day
          if (dayNum === 1) {
            tasks.push({
              label: 'Briefing kepada peserta',
              required: true,
              category: 'Persiapan',
            });
            tasks.push({
              label: 'Check-in di dermaga/lokasi',
              required: true,
              category: 'Persiapan',
            });
            tasks.push({
              label: 'Foto keberangkatan',
              required: true,
              category: 'Dokumentasi',
            });
          }

          // Extract activities from description (timeline format: HH:MM Activity)
          const lines = description.split('\n').filter((line: string) => line.trim());
          for (const line of lines) {
            const trimmed = line.trim();
            // Skip empty lines
            if (!trimmed) continue;

            // Extract activity (remove time prefix if exists)
            const timeMatch = trimmed.match(/^\d{1,2}:\d{2}\s+(.+)$/);
            const activity = timeMatch ? timeMatch[1] : trimmed;

            // Skip if too generic or just time
            if (!activity || activity.length < 3) continue;

            // Determine category based on keywords
            let category = 'Aktivitas';
            let required = true;

            const activityLower = activity.toLowerCase();

            if (
              activityLower.includes('briefing') ||
              activityLower.includes('check-in') ||
              activityLower.includes('check in') ||
              activityLower.includes('kumpul') ||
              activityLower.includes('meeting point')
            ) {
              category = 'Persiapan';
            } else if (
              activityLower.includes('foto') ||
              activityLower.includes('photo') ||
              activityLower.includes('dokumentasi') ||
              activityLower.includes('closing')
            ) {
              category = 'Dokumentasi';
            } else if (
              activityLower.includes('makan') ||
              activityLower.includes('sarapan') ||
              activityLower.includes('lunch') ||
              activityLower.includes('dinner') ||
              activityLower.includes('bbq')
            ) {
              category = 'Aktivitas';
              required = false; // Meals are usually optional tasks
            } else if (
              activityLower.includes('pulang') ||
              activityLower.includes('kembali') ||
              activityLower.includes('check-out') ||
              activityLower.includes('check out') ||
              activityLower.includes('sampai')
            ) {
              category = 'Penutup';
            }

            // Add task
            tasks.push({
              label: activity,
              required,
              category,
            });
          }

          // Add closing tasks for last day
          if (dayNum === (durationDays || packageItineraries.length)) {
            tasks.push({
              label: 'Foto closing/closing ceremony',
              required: true,
              category: 'Dokumentasi',
            });
            tasks.push({
              label: 'Check-out dan kembali ke dermaga/lokasi',
              required: true,
              category: 'Penutup',
            });
          }
        }

        if (tasks.length > 0) {
          return tasks;
        }
      }
    } catch (error) {
      logger.error('Failed to fetch package_itineraries', error, { packageId });
      // Continue to try JSONB parsing
    }
  }

  // Fallback: Try to parse from JSONB itinerary
  if (itineraryJsonb) {
    try {
      // Handle different JSONB structures
      let itineraryData: unknown = null;

      if (typeof itineraryJsonb === 'string') {
        itineraryData = JSON.parse(itineraryJsonb);
      } else if (typeof itineraryJsonb === 'object' && itineraryJsonb !== null) {
        itineraryData = itineraryJsonb;
      }

      if (itineraryData && Array.isArray(itineraryData)) {
        // Array of days
        for (const day of itineraryData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dayObj = day as any;
          if (dayObj?.activities && Array.isArray(dayObj.activities)) {
            for (const activity of dayObj.activities) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const act = activity as any;
              tasks.push({
                label: typeof activity === 'string' ? activity : act.label || act.name || 'Aktivitas',
                required: act.required !== false,
                category: act.category || 'Aktivitas',
              });
            }
          }
        }

        if (tasks.length > 0) {
          return tasks;
        }
      }
    } catch (error) {
      logger.error('Failed to parse JSONB itinerary', error, { packageId });
      // Continue to standard template
    }
  }

  // Final fallback: Standard task template
  return [
    { label: 'Briefing kepada peserta', required: true, category: 'Persiapan' },
    { label: 'Check-in di dermaga', required: true, category: 'Persiapan' },
    { label: 'Foto keberangkatan', required: true, category: 'Dokumentasi' },
    { label: 'Aktivitas utama (Snorkeling/Wisata)', required: true, category: 'Aktivitas' },
    { label: 'Makan siang', required: false, category: 'Aktivitas' },
    { label: 'Aktivitas tambahan', required: false, category: 'Aktivitas' },
    { label: 'Foto closing/closing ceremony', required: true, category: 'Dokumentasi' },
    { label: 'Check-out dan kembali ke dermaga', required: true, category: 'Penutup' },
  ];
}
