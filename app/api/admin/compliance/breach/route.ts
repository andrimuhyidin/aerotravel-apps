/**
 * API: Data Breach Management
 * Route: /api/admin/compliance/breach
 * Purpose: Manage data breach incidents (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  getBreachIncidents,
  notifyAffectedUsers,
} from '@/lib/pdp/breach-notifier';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createBreachSchema = z.object({
  incidentDate: z.string(),
  detectedAt: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affectedDataTypes: z.array(z.string()).min(1),
  affectedUsersCount: z.number().optional(),
  affectedUserIds: z.array(z.string()).optional(),
  title: z.string().min(1),
  description: z.string().min(10),
  rootCause: z.string().optional(),
  attackVector: z.string().optional(),
  remediationSteps: z.string().optional(),
});

/**
 * GET /api/admin/compliance/breach
 * Get list of breach incidents
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!profile || !['super_admin', 'ops_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const incidents = await getBreachIncidents();

  return NextResponse.json({ incidents });
});

/**
 * POST /api/admin/compliance/breach
 * Report new breach incident
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!profile || !['super_admin', 'ops_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createBreachSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Create breach incident
  const { data: incident, error } = await supabase
    .from('data_breach_incidents')
    .insert({
      incident_date: data.incidentDate,
      detected_at: data.detectedAt || new Date().toISOString(),
      severity: data.severity,
      affected_data_types: data.affectedDataTypes,
      affected_users_count: data.affectedUsersCount || null,
      affected_user_ids: data.affectedUserIds || null,
      title: data.title,
      description: data.description,
      root_cause: data.rootCause || null,
      attack_vector: data.attackVector || null,
      remediation_steps: data.remediationSteps || null,
      status: 'investigating',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create breach incident', error);
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }

  logger.info('Breach incident created', { incidentId: incident.id, severity: data.severity });

  // If severity is high or critical, auto-notify affected users
  if (['high', 'critical'].includes(data.severity) && data.affectedUserIds && data.affectedUserIds.length > 0) {
    notifyAffectedUsers(incident.id, data.affectedUserIds).catch((err) => {
      logger.error('Failed to notify affected users', err, { incidentId: incident.id });
    });
  }

  return NextResponse.json({
    success: true,
    incident: {
      id: incident.id,
      severity: incident.severity,
      title: incident.title,
    },
    message: 'Breach incident reported successfully',
  });
});

