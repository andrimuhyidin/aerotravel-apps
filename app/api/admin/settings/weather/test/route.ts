/**
 * Weather Settings Test API Route
 * Test connection to Weather API
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/settings/weather/test');

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
  const { api_key } = body;

  if (!api_key) {
    return NextResponse.json(
      { success: false, message: 'API key is required' },
      { status: 400 }
    );
  }

  try {
    // Test OpenWeatherMap API with Jakarta coordinates
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=-6.2088&lon=106.8456&appid=${api_key}&units=metric`
    );

    const data = await response.json();

    if (data.cod === 401) {
      throw new Error('Invalid API key');
    }

    if (data.cod === 200) {
      return NextResponse.json({
        success: true,
        data: {
          temp: data.main?.temp,
          weather: data.weather?.[0]?.main,
          location: data.name,
        },
      });
    }

    throw new Error(data.message || 'Failed to fetch weather data');
  } catch (error) {
    logger.error('Weather connection test failed', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 400 }
    );
  }
});

