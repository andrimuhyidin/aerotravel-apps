/**
 * API: Partner Team Management
 * GET /api/partner/team - List team members
 * POST /api/partner/team - Create/invite team member
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // Check if user is a partner (mitra) or partner team member
    const { data: userProfile } = await client
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Determine partner_id
    let partnerId = user.id;
    
    // If user is not a mitra, check if they're a team member
    if (userProfile.role !== 'mitra') {
      const { data: partnerUser } = await client
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerUser) {
        partnerId = partnerUser.partner_id;
      } else {
        // User is not a partner or team member
        return NextResponse.json({ teamMembers: [] });
      }
    }

    const { data: teamMembers, error } = await client
      .from('partner_users')
      .select('*')
      .eq('partner_id', partnerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch team members', error, {
        userId: user.id,
        partnerId,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      return NextResponse.json(
        { error: 'Failed to fetch team members', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ teamMembers: teamMembers || [] });
  } catch (error) {
    logger.error('Failed to fetch team members', error, {
      userId: user.id,
    });
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, phone, role, permissions } = body;

  if (!name || !email || !role) {
    return NextResponse.json(
      { error: 'Name, email, and role are required' },
      { status: 400 }
    );
  }

  // Check if user is owner
  const client = supabase as unknown as any;
  
  // Check if user is the main partner (mitra) - they are owner by default
  const { data: partnerUser } = await client
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .eq('role', 'mitra')
    .single();

  // Also check if they have owner role in partner_users
  const { data: currentUser } = await client
    .from('partner_users')
    .select('role')
    .eq('partner_id', user.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  // Main partner (mitra) is owner by default, or if they have owner role in partner_users
  const isOwner = partnerUser || currentUser?.role === 'owner';

  if (!isOwner) {
    return NextResponse.json(
      { error: 'Only owners can invite team members' },
      { status: 403 }
    );
  }

  try {
    // Check if email already exists
    const { data: existing } = await client
      .from('partner_users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Create team member (without auth user for now - invitation flow can be added later)
    const { data: teamMember, error } = await client
      .from('partner_users')
      .insert({
        partner_id: user.id,
        name,
        email,
        phone: phone || null,
        role,
        permissions: permissions || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create team member', error, {
        userId: user.id,
        email,
      });
      return NextResponse.json(
        { error: 'Failed to create team member', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Team member created', {
      userId: user.id,
      teamMemberId: teamMember.id,
      email,
    });

    return NextResponse.json({ teamMember }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create team member', error, {
      userId: user.id,
    });
    throw error;
  }
});

