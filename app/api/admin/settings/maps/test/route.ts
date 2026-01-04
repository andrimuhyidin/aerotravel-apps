/**
 * Maps Settings Test API Route
 * Test connection to Maps provider
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/settings/maps/test');

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
  const { provider, api_key } = body;

  if (!api_key) {
    return NextResponse.json(
      { success: false, message: 'API key is required' },
      { status: 400 }
    );
  }

  try {
    if (provider === 'google') {
      // Test Google Maps Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Jakarta&key=${api_key}`
      );

      const data = await response.json();

      if (data.status === 'REQUEST_DENIED') {
        throw new Error(data.error_message || 'Invalid Google Maps API key');
      }

      if (data.status === 'OK') {
        return NextResponse.json({ success: true, provider: 'google' });
      }

      throw new Error(`API returned status: ${data.status}`);
    }

    if (provider === 'mapbox') {
      // Test Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/Jakarta.json?access_token=${api_key}`
      );

      if (!response.ok) {
        throw new Error('Invalid Mapbox access token');
      }

      return NextResponse.json({ success: true, provider: 'mapbox' });
    }

    return NextResponse.json(
      { success: false, message: 'Unknown provider' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Maps connection test failed', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 400 }
    );
  }
});

