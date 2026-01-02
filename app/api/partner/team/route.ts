/**
 * API: Partner Team Management
 * GET /api/partner/team - List team members
 * POST /api/partner/team - Create/invite team member
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeRequestBody, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createTeamMemberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10).optional().nullable(),
  role: z.enum(['admin', 'staff', 'viewer']),
  permissions: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access using helper
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ teamMembers: [] });
  }

  const client = supabase as unknown as any;

  try {
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

  // Verify partner access - only main partner can add team members
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = createTeamMemberSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  // Sanitize validated data
  const sanitizedData = sanitizeRequestBody(validation.data, {
    strings: ['name'],
    emails: ['email'],
    phones: ['phone'],
  });

  const { name, email, phone, role, permissions } = sanitizedData;

  const client = supabase as unknown as any;

  // Check if user is owner (only owner can add team members)
  // Main partner (mitra) is owner by default
  const { data: partnerUser } = await client
    .from('users')
    .select('id, role')
    .eq('id', partnerId)
    .eq('role', 'mitra')
    .single();

  if (!partnerUser) {
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

    // Create team member using verified partnerId
    const { data: teamMember, error } = await client
      .from('partner_users')
      .insert({
        partner_id: partnerId,
        name,
        email,
        phone: phone || null,
        role,
        permissions: permissions || [],
        created_by: partnerId, // Use verified partnerId
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

