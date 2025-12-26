/**
 * API: Get Current User
 * GET /api/user/me - Get current authenticated user info
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user profile
    const client = supabase as unknown as any;
    const { data: profile, error: profileError } = await client
      .from('users')
      .select('id, email, full_name, phone, role, branch_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Failed to fetch user profile', profileError, {
        userId: user.id,
      });
      // Return basic auth user if profile fetch fails
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
          },
          profile: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email || profile?.email,
        },
        profile: {
          id: profile?.id,
          email: profile?.email || user.email,
          fullName: profile?.full_name,
          phone: profile?.phone,
          role: profile?.role,
          branchId: profile?.branch_id,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get current user', error, {
      userId: user.id,
    });
    throw error;
  }
});

