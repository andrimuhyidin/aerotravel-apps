/**
 * API Endpoint untuk PWA Sync (Offline-First)
 * Sesuai PRD 2.8.A - /api/v1/* untuk System Integration
 * PRD 2.4.A - Re-Sync saat online kembali
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mutations } = body; // Array of pending mutations dari IndexedDB

    const supabase = await createClient();

    // Process each mutation
    const results = [];
    for (const mutation of mutations) {
      try {
        let result;

        switch (mutation.type) {
          case 'attendance':
            // Sync attendance data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await (supabase as any)
              .from('attendances')
              .insert(mutation.data);
            break;

          case 'documentation':
            // Sync documentation upload
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await (supabase as any)
              .from('trip_documentations')
              .insert(mutation.data);
            break;

          default:
            console.warn('Unknown mutation type:', mutation.type);
            result = { error: { message: 'Unknown mutation type' } };
        }

        if (result) {
          results.push({
            id: mutation.id,
            success: !result.error,
            error: result.error?.message,
          });
        }
      } catch (error) {
        results.push({
          id: mutation.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}

