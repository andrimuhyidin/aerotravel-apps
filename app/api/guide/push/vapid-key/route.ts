/**
 * API: Get VAPID Public Key
 * GET /api/guide/push/vapid-key
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getVAPIDKeys } from '@/lib/push/web-push';

export const GET = withErrorHandler(async () => {
  const { publicKey } = getVAPIDKeys();

  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID keys not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
});

