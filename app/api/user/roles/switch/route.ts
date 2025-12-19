/**
 * Role Switch API
 * POST /api/user/roles/switch - Switch active role
 * 
 * Security:
 * - Rate limiting (5 requests per minute)
 * - Verify user has role before switching
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
    getActiveRole,
    setActiveRole,
    verifyUserHasRole,
} from '@/lib/session/active-role';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

// Internal roles cannot switch to other roles (security & separation of duties)
// Internal roles should remain single role only
const INTERNAL_ROLES: UserRole[] = [
  'super_admin',
  'investor',
  'finance_manager',
  'marketing',
  'ops_admin',
];

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const record = rateLimitMap.get(userId);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { role } = body as { role: UserRole };

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    // Get current active role
    const currentActiveRole = await getActiveRole(user.id);
    
    // Internal roles cannot switch to other roles (security & separation of duties)
    // This prevents privilege escalation and maintains security boundaries
    if (currentActiveRole && INTERNAL_ROLES.includes(currentActiveRole)) {
      logger.warn('Internal role attempted to switch', {
        userId: user.id,
        currentRole: currentActiveRole,
        attemptedRole: role,
      });
      return NextResponse.json(
        { error: 'Internal roles cannot switch to other roles for security reasons' },
        { status: 403 }
      );
    }
    
    // Also prevent switching TO internal roles (unless user is already internal)
    // This prevents non-internal users from switching to internal roles
    if (INTERNAL_ROLES.includes(role) && (!currentActiveRole || !INTERNAL_ROLES.includes(currentActiveRole))) {
      logger.warn('User attempted to switch to internal role', {
        userId: user.id,
        currentRole: currentActiveRole,
        attemptedRole: role,
      });
      return NextResponse.json(
        { error: 'You cannot switch to internal roles' },
        { status: 403 }
      );
    }

    // Verify user has this role
    const hasRole = await verifyUserHasRole(user.id, role);
    if (!hasRole) {
      logger.warn('User attempted to switch to role they do not have', {
        userId: user.id,
        role,
      });
      return NextResponse.json(
        { error: 'You do not have this role' },
        { status: 403 }
      );
    }

    // Get current active role for audit
    const previousRole = await getActiveRole(user.id);

    // Switch role
    const success = await setActiveRole(user.id, role);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to switch role' },
        { status: 500 }
      );
    }

    // Audit log (skip if schema doesn't match)
    try {
      await supabase.from('audit_logs').insert({
        action: 'update' as const,
        description: `Role switch from ${previousRole} to ${role}`,
        user_role: role,
      } as any);
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      logger.error('Failed to log role switch', auditError, {
        userId: user.id,
        role,
      });
    }

    logger.info('Role switched successfully', {
      userId: user.id,
      fromRole: previousRole,
      toRole: role,
    });

    return NextResponse.json({
      success: true,
      activeRole: role,
      previousRole,
    });
  } catch (error) {
    logger.error('Error in POST /api/user/roles/switch', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

