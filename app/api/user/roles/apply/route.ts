/**
 * Role Application API
 * POST /api/user/roles/apply - Apply for new role
 * GET /api/user/roles/applications - Get user's applications
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getUserRoles, verifyUserHasRole } from '@/lib/session/active-role';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

// Internal roles cannot be applied for
const INTERNAL_ROLES: UserRole[] = [
  'super_admin',
  'investor',
  'finance_manager',
  'marketing',
  'ops_admin',
];

// Roles that auto-approve
const AUTO_APPROVE_ROLES: UserRole[] = ['customer'];

// Max roles per user (soft limit)
const MAX_ROLES_PER_USER = 5;

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role, message, companyData, legalDocuments } = body as {
      role: UserRole;
      message?: string;
      companyData?: Record<string, unknown>;
      legalDocuments?: string[];
    };

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    // Check if role is internal (cannot be applied)
    if (INTERNAL_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'This role cannot be applied for' },
        { status: 403 }
      );
    }

    // Check if user already has this role
    const hasRole = await verifyUserHasRole(user.id, role);
    if (hasRole) {
      return NextResponse.json(
        { error: 'You already have this role' },
        { status: 400 }
      );
    }

    // Check role limit
    const currentRoles = await getUserRoles(user.id);
    if (currentRoles.length >= MAX_ROLES_PER_USER) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ROLES_PER_USER} roles per user` },
        { status: 400 }
      );
    }

    // Check if there's already a pending application
    const { data: existingApp } = await (supabase as any)
      .from('role_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('requested_role', role)
      .eq('status', 'pending')
      .single();

    if (existingApp) {
      return NextResponse.json(
        { error: 'You already have a pending application for this role' },
        { status: 400 }
      );
    }

    // Create application with company data for partner role
    const applicationData: Record<string, unknown> = {
      user_id: user.id,
      requested_role: role,
      status: 'pending',
      message: message || null,
    };

    // Add partner-specific data if provided
    if (role === 'mitra' && companyData) {
      applicationData.company_data = companyData;
      applicationData.legal_documents = legalDocuments || [];
      applicationData.application_status = 'pending_review';
    }

    const { data: application, error: insertError } = await (supabase as any)
      .from('role_applications')
      .insert(applicationData)
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create role application', insertError, {
        userId: user.id,
        role,
      });
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Auto-approve for certain roles
    if (AUTO_APPROVE_ROLES.includes(role)) {
      // Auto-approve logic
      const { error: approveError } = await (supabase as any)
        .from('role_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id, // System auto-approval
        })
        .eq('id', application.id);

      if (!approveError) {
        // Create user_role entry
        const { error: roleError } = await (supabase as any).from('user_roles').insert({
          user_id: user.id,
          role,
          status: 'active',
          is_primary: currentRoles.length === 0, // First role is primary
          applied_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });

        if (roleError) {
          logger.error('Failed to create user role after auto-approval', roleError, {
            userId: user.id,
            role,
          });
        }

        logger.info('Role application auto-approved', {
          userId: user.id,
          role,
        });

        return NextResponse.json({
          success: true,
          application: {
            ...application,
            status: 'approved',
          },
          autoApproved: true,
        });
      }
    }

    logger.info('Role application created', {
      userId: user.id,
      role,
      applicationId: application.id,
    });

    return NextResponse.json({
      success: true,
      application,
      autoApproved: false,
    });
  } catch (error) {
    logger.error('Error in POST /api/user/roles/apply', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: applications, error } = await (supabase as any)
      .from('role_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch role applications', error, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      applications: applications || [],
    });
  } catch (error) {
    logger.error('Error in GET /api/user/roles/applications', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

