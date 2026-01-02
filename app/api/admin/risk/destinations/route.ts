/**
 * API: Destination Risk Profiles Management
 * GET /api/admin/risk/destinations - List all destination risk profiles
 * POST /api/admin/risk/destinations - Create/update risk profile
 * 
 * ISO 31030 Compliance: Travel Risk Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const riskFactorSchema = z.object({
  level: z.enum(['low', 'medium', 'high', 'critical']),
  notes: z.string().optional(),
});

const seasonalRiskSchema = z.record(
  z.string(), // Month 1-12
  z.object({
    level: z.enum(['low', 'medium', 'high', 'critical']),
    notes: z.string().optional(),
  })
);

const destinationRiskSchema = z.object({
  location_name: z.string().min(1, 'Location name is required'),
  location_code: z.string().optional(),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  region: z.string().optional(),
  risk_category: z.enum(['marine', 'land', 'mixed', 'air']).default('marine'),
  threat_level: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  risk_factors: z.object({
    weather: riskFactorSchema.optional(),
    security: riskFactorSchema.optional(),
    health: riskFactorSchema.optional(),
    infrastructure: riskFactorSchema.optional(),
    natural_hazards: riskFactorSchema.optional(),
  }).optional(),
  seasonal_risks: seasonalRiskSchema.optional(),
  mitigation_measures: z.array(z.string()).optional(),
  required_equipment: z.array(z.string()).optional(),
  emergency_procedures: z.array(z.string()).optional(),
  valid_until: z.string().optional(), // ISO date string
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as ReturnType<typeof createClient>;
  const { searchParams } = new URL(request.url);

  const region = searchParams.get('region');
  const threatLevel = searchParams.get('threat_level');
  const activeOnly = searchParams.get('active_only') !== 'false';

  let query = withBranchFilter(
    client.from('destination_risk_profiles'),
    branchContext
  ).select(`
    *,
    assessed_by_user:users!assessed_by(id, full_name),
    created_by_user:users!created_by(id, full_name)
  `);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (region) {
    query = query.eq('region', region);
  }

  if (threatLevel) {
    query = query.eq('threat_level', threatLevel);
  }

  const { data, error } = await query.order('location_name', { ascending: true });

  if (error) {
    logger.error('Failed to fetch destination risk profiles', error);
    return NextResponse.json(
      { error: 'Failed to fetch destination risk profiles' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    destinations: data || [],
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = destinationRiskSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as ReturnType<typeof createClient>;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json(
      { error: 'Forbidden - Admin only' },
      { status: 403 }
    );
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json(
      { error: 'Branch context required' },
      { status: 400 }
    );
  }

  const destinationData = {
    branch_id: branchContext.branchId,
    location_name: body.location_name,
    location_code: body.location_code || body.location_name.toUpperCase().replace(/\s+/g, '_').slice(0, 20),
    description: body.description || null,
    latitude: body.latitude || null,
    longitude: body.longitude || null,
    region: body.region || null,
    risk_category: body.risk_category,
    threat_level: body.threat_level,
    risk_factors: body.risk_factors || {},
    seasonal_risks: body.seasonal_risks || {},
    mitigation_measures: body.mitigation_measures || [],
    required_equipment: body.required_equipment || [],
    emergency_procedures: body.emergency_procedures || [],
    valid_until: body.valid_until || null,
    last_assessed_at: new Date().toISOString(),
    assessed_by: user.id,
    created_by: user.id,
    is_active: true,
  };

  const { data, error } = await client
    .from('destination_risk_profiles')
    .insert(destinationData)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create destination risk profile', error, {
      locationName: body.location_name,
    });
    return NextResponse.json(
      { error: 'Failed to create destination risk profile', details: error.message },
      { status: 500 }
    );
  }

  logger.info('Destination risk profile created', {
    destinationId: data.id,
    locationName: body.location_name,
    threatLevel: body.threat_level,
    userId: user.id,
  });

  return NextResponse.json({
    success: true,
    destination: data,
  });
});

