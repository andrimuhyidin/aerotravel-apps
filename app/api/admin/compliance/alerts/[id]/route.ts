/**
 * API: Compliance Alert Actions
 * PATCH /api/admin/compliance/alerts/:id - Update alert (mark as read/resolved)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

const updateAlertSchema = z.object({
  action: z.enum(['read', 'resolve']),
  resolutionNotes: z.string().max(1000).optional(),
});

/**
 * PATCH /api/admin/compliance/alerts/:id
 * Mark alert as read or resolved
 */
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  // Validate input
  const parsed = updateAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { action, resolutionNotes } = parsed.data;

  logger.info('PATCH /api/admin/compliance/alerts/:id', { id, action, userId: user.id });

  // Check if alert exists
  const { data: existingAlert, error: fetchError } = await supabase
    .from('compliance_alerts')
    .select('id, is_read, is_resolved')
    .eq('id', id)
    .single();

  if (fetchError || !existingAlert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  // Build update based on action
  const updateData: Record<string, unknown> = {};

  if (action === 'read') {
    if (existingAlert.is_read) {
      return NextResponse.json({ message: 'Alert sudah ditandai dibaca' });
    }
    updateData.is_read = true;
    updateData.read_by = user.id;
    updateData.read_at = new Date().toISOString();
  } else if (action === 'resolve') {
    if (existingAlert.is_resolved) {
      return NextResponse.json({ message: 'Alert sudah diselesaikan' });
    }
    updateData.is_resolved = true;
    updateData.resolved_by = user.id;
    updateData.resolved_at = new Date().toISOString();
    updateData.resolution_notes = resolutionNotes || null;
    // Also mark as read if not already
    if (!existingAlert.is_read) {
      updateData.is_read = true;
      updateData.read_by = user.id;
      updateData.read_at = new Date().toISOString();
    }
  }

  const { error: updateError } = await supabase
    .from('compliance_alerts')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    logger.error('Failed to update alert', updateError);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }

  logger.info('Alert updated successfully', { alertId: id, action });

  return NextResponse.json({
    id,
    message: action === 'read' ? 'Alert ditandai dibaca' : 'Alert diselesaikan',
  });
});

