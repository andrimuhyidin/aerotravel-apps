/**
 * API: Download Data Export
 * Route: /api/user/data-export/[id]
 * Purpose: Download completed data export file
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/user/data-export/[id]
 * Download export file
 */
export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  // Get export request
  const { data: exportRequest, error } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns this request
    .single();

  if (error || !exportRequest) {
    return NextResponse.json({ error: 'Export request not found' }, { status: 404 });
  }

  // Check if export is completed
  if (exportRequest.status !== 'completed') {
    return NextResponse.json(
      {
        error: 'Export is not ready yet',
        status: exportRequest.status,
      },
      { status: 400 }
    );
  }

  // Check if export has expired
  if (exportRequest.expires_at) {
    const expiresAt = new Date(exportRequest.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Export file has expired. Please create a new export request.' },
        { status: 410 }
      );
    }
  }

  if (!exportRequest.file_url) {
    return NextResponse.json({ error: 'Export file not found' }, { status: 404 });
  }

  logger.info('User downloading data export', { userId: user.id, requestId: id });

  // Return redirect to file URL
  return NextResponse.json({
    success: true,
    fileUrl: exportRequest.file_url,
    fileSizeBytes: exportRequest.file_size_bytes,
    expiresAt: exportRequest.expires_at,
  });
});

