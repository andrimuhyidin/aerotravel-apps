/**
 * Split Bill API dengan Feature Flag
 * Sesuai PRD 2.5.C - Feature Flagging
 * PRD 5.1.A - Split Bill (Patungan Digital)
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/feature-flags/posthog-flags';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bookingId, totalPax } = body;

    // Check feature flag
    const splitBillEnabled = isFeatureEnabled('split-bill', userId);
    if (!splitBillEnabled) {
      return NextResponse.json(
        { error: 'Fitur Split Bill sedang tidak tersedia' },
        { status: 503 }
      );
    }

    // TODO: Implement split bill logic
    // - Generate multiple payment links
    // - Create split_bill record
    // - Return payment links

    return NextResponse.json({
      success: true,
      message: 'Split bill feature akan di-implement',
    });
  } catch (error) {
    console.error('Split bill error:', error);
    return NextResponse.json(
      { error: 'Split bill processing failed' },
      { status: 500 }
    );
  }
}

