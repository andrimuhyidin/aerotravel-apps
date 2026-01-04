/**
 * Rate Limit Settings Test API Route
 * Test connection to Redis
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/settings/rate-limit/test');

  const supabase = await createClient();

  // Verify user is super_admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('active_role')
    .eq('user_id', user.id)
    .single();

  if (profile?.active_role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { redis_url, redis_token } = body;

  if (!redis_url || !redis_token) {
    return NextResponse.json(
      { success: false, message: 'Redis URL and Token are required' },
      { status: 400 }
    );
  }

  try {
    const startTime = Date.now();

    // Test Redis connection using Upstash REST API
    const response = await fetch(`${redis_url}/ping`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redis_token}`,
      },
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      throw new Error('Failed to connect to Redis');
    }

    const data = await response.json();

    if (data.result === 'PONG') {
      return NextResponse.json({
        success: true,
        latency: latency,
      });
    }

    throw new Error('Unexpected Redis response');
  } catch (error) {
    logger.error('Redis connection test failed', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 400 }
    );
  }
});

