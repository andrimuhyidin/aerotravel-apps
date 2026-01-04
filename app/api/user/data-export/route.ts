/**
 * API: Data Export Requests
 * Route: /api/user/data-export
 * Purpose: Handle user data portability requests (UU PDP 2022 - Right to Data Export)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  createDataExportRequest,
  getUserExportRequests,
  processDataExport,
} from '@/lib/pdp/data-exporter';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createExportSchema = z.object({
  exportFormat: z.enum(['json', 'csv', 'pdf']).default('json'),
});

/**
 * GET /api/user/data-export
 * Get user's export request history
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requests = await getUserExportRequests(user.id);

  return NextResponse.json({ requests });
});

/**
 * POST /api/user/data-export
 * Create new data export request
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // #region agent log
  await fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'data-export/route.ts:46',message:'POST /api/user/data-export started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // #region agent log
  await fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'data-export/route.ts:52',message:'User auth check',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createExportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { exportFormat } = parsed.data;

  // Create export request
  const exportRequest = await createDataExportRequest(user.id, exportFormat);

  if (!exportRequest) {
    return NextResponse.json({ error: 'Failed to create export request' }, { status: 500 });
  }

  logger.info('Data export request created via API', { userId: user.id, requestId: exportRequest.id });

  // Process export asynchronously (in background)
  // In production, this should be handled by a queue/worker
  processDataExport(exportRequest.id).catch((error) => {
    logger.error('Failed to process export in background', error, { requestId: exportRequest.id });
  });

  return NextResponse.json({
    success: true,
    request: exportRequest,
    message: 'Export request created. You will be notified when it is ready.',
  });
});
