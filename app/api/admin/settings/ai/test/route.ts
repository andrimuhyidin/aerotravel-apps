/**
 * AI Settings Test API Route
 * Test connection to AI provider
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/settings/ai/test');

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
  const { provider, api_key, model } = body;

  if (!api_key) {
    return NextResponse.json(
      { success: false, message: 'API key is required' },
      { status: 400 }
    );
  }

  try {
    // Test based on provider
    if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent?key=${api_key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello, respond with just "OK"' }] }],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to connect to Gemini');
      }

      return NextResponse.json({ success: true, provider: 'gemini' });
    }

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${api_key}` },
      });

      if (!response.ok) {
        throw new Error('Invalid OpenAI API key');
      }

      return NextResponse.json({ success: true, provider: 'openai' });
    }

    if (provider === 'anthropic') {
      // Anthropic doesn't have a simple test endpoint, so we just validate key format
      if (!api_key.startsWith('sk-ant-')) {
        throw new Error('Invalid Anthropic API key format');
      }

      return NextResponse.json({ success: true, provider: 'anthropic' });
    }

    return NextResponse.json(
      { success: false, message: 'Unknown provider' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('AI connection test failed', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 400 }
    );
  }
});

