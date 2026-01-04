/**
 * API: Guide Directory
 * GET /api/guide/crew/directory - Search and filter guide directory
 * Query params: branch, role, skill, availability, search
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/guide/crew/directory');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only guides and ops/admin can access directory
  const { data: userProfile } = await (supabase as unknown as any)
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide' && userProfile?.role !== 'ops_admin' && userProfile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);
  const { searchParams } = new URL(request.url);
  const client = supabase as unknown as any;

  // Query parameters
  const branch = searchParams.get('branch');
  const role = searchParams.get('role'); // 'lead' | 'support' | null (all)
  const skill = searchParams.get('skill'); // Skill name to filter
  const availability = searchParams.get('availability'); // 'available', 'on_duty', 'on_trip', 'not_available'
  const search = searchParams.get('search'); // Text search for name
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build query
  let directoryQuery = client
    .from('guide_profiles_public_internal')
    .select(`
      user_id,
      branch_id,
      display_name,
      photo_url,
      badges,
      skills,
      current_availability,
      last_status_update,
      contact_enabled,
      is_active,
      branch:branches(
        id,
        code,
        name
      )
    `)
    .eq('is_active', true)
    .order('display_name', { ascending: true })
    .range(offset, offset + limit - 1);

  // Branch filter
  if (!branchContext.isSuperAdmin) {
    if (branchContext.branchId) {
      directoryQuery = directoryQuery.eq('branch_id', branchContext.branchId);
    }
  } else if (branch) {
    directoryQuery = directoryQuery.eq('branch_id', branch);
  }

  // Availability filter
  if (availability) {
    directoryQuery = directoryQuery.eq('current_availability', availability);
  }

  // Text search (name)
  if (search) {
    directoryQuery = directoryQuery.ilike('display_name', `%${search}%`);
  }

  const { data: crewProfiles, error } = await directoryQuery;

  if (error) {
    logger.error('Failed to fetch guide directory', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch directory' }, { status: 500 });
  }

  // Filter by skill if provided (client-side filter for JSONB)
  let filteredProfiles = crewProfiles ?? [];
  
  // Ensure branch info is properly structured (Supabase might return it as array)
  filteredProfiles = filteredProfiles.map((profile: {
    branch?: unknown[] | { id: string; code: string; name: string };
    [key: string]: unknown;
  }) => {
    // If branch is an array, take the first element
    if (Array.isArray(profile.branch) && profile.branch.length > 0) {
      profile.branch = profile.branch[0] as { id: string; code: string; name: string };
    }
    return profile;
  });

  if (skill) {
    filteredProfiles = filteredProfiles.filter((profile: {
      skills?: Array<{ name?: string }> | null;
    }) => {
      if (!profile.skills || !Array.isArray(profile.skills)) return false;
      return profile.skills.some((s: { name?: string }) => 
        s.name?.toLowerCase().includes(skill.toLowerCase())
      );
    });
  }

  // Get current user's trip crew (for "My Trip Crew" section)
  // Check both trip_crews (new) and trip_guides (existing)
  
  // From trip_crews (if any)
  const { data: myTripsCrews } = await client
    .from('trip_crews')
    .select('trip_id, role')
    .eq('guide_id', user.id)
    .in('status', ['assigned', 'confirmed']);

  // From trip_guides (existing system)
  const { data: myTripsGuides } = await client
    .from('trip_guides')
    .select('trip_id, guide_role')
    .eq('guide_id', user.id)
    .in('assignment_status', ['confirmed', 'pending_confirmation']);

  // Combine trip IDs
  const myTripIds = Array.from(new Set([
    ...(myTripsCrews?.map((t: { trip_id: string }) => t.trip_id) ?? []),
    ...(myTripsGuides?.map((t: { trip_id: string }) => t.trip_id) ?? []),
  ]));

  let myCrewMembers: unknown[] = [];

  if (myTripIds.length > 0) {
    // Get crew from trip_crews
    const { data: myCrewFromCrews } = await client
      .from('trip_crews')
      .select(`
        guide_id,
        role,
        trip_id,
        trip:trips(
          trip_code,
          trip_date
        )
      `)
      .in('trip_id', myTripIds)
      .neq('guide_id', user.id)
      .in('status', ['assigned', 'confirmed']);

    // Get crew from trip_guides (existing)
    const { data: myCrewFromGuides } = await client
      .from('trip_guides')
      .select(`
        guide_id,
        guide_role,
        trip_id,
        trip:trips(
          trip_code,
          trip_date
        )
      `)
      .in('trip_id', myTripIds)
      .neq('guide_id', user.id)
      .in('assignment_status', ['confirmed', 'pending_confirmation']);

    // Combine and map
    const allCrew = [
      ...(myCrewFromCrews ?? []).map((c: { guide_id: string; role: string; trip: unknown }) => ({
        guide_id: c.guide_id,
        role: c.role,
        trip: c.trip,
      })),
      ...(myCrewFromGuides ?? []).map((c: { guide_id: string; guide_role: string; trip: unknown }) => ({
        guide_id: c.guide_id,
        role: c.guide_role === 'lead' ? 'lead' : 'support',
        trip: c.trip,
      })),
    ];

    const uniqueGuideIds = Array.from(
      new Set(allCrew.map((c: { guide_id: string }) => c.guide_id))
    );

    if (uniqueGuideIds.length > 0) {
      const { data: myCrewProfiles } = await client
        .from('guide_profiles_public_internal')
        .select(`
          user_id,
          branch_id,
          display_name,
          photo_url,
          badges,
          skills,
          current_availability,
          last_status_update,
          contact_enabled,
          is_active,
          branch:branches(
            id,
            code,
            name
          )
        `)
        .in('user_id', uniqueGuideIds)
        .eq('is_active', true);

      // Enrich with trip info
      myCrewMembers = (myCrewProfiles ?? []).map((profile: { user_id: string }) => {
        const crewInfo = allCrew.find((c: { guide_id: string }) => c.guide_id === profile.user_id);
        return {
          ...profile,
          trip_role: crewInfo?.role,
          trip_info: crewInfo?.trip,
        };
      });
    }
  }

  logger.info('Crew directory response', {
    myCrewCount: myCrewMembers.length,
    directoryCount: filteredProfiles.length,
    guideId: user.id,
  });

  return NextResponse.json({
    myCrew: myCrewMembers,
    directory: filteredProfiles,
    total: filteredProfiles.length,
    limit,
    offset,
  });
});
