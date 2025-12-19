/**
 * API: Guide Medical Info
 * GET  /api/guide/medical-info - Get medical info
 * PUT  /api/guide/medical-info - Update medical info
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateMedicalInfoSchema = z.object({
  blood_type: z.enum(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']).optional().nullable(),
  allergies: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional(),
  current_medications: z.array(z.string()).optional(),
  emergency_notes: z.string().optional().nullable(),
  insurance_provider: z.string().optional().nullable(),
  insurance_policy_number: z.string().optional().nullable(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { data: medicalInfo, error } = await client
    .from('guide_medical_info')
    .select('*')
    .eq('guide_id', user.id)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch medical info', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch medical info' }, { status: 500 });
  }

  return NextResponse.json({ medicalInfo: medicalInfo || null });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = updateMedicalInfoSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Check if exists
  const { data: existing } = await client
    .from('guide_medical_info')
    .select('id')
    .eq('guide_id', user.id)
    .maybeSingle();

  let medicalInfo;
  if (existing) {
    // Update
    const { data, error } = await client
      .from('guide_medical_info')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update medical info', error, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to update medical info' }, { status: 500 });
    }
    medicalInfo = data;
  } else {
    // Insert
    const { data, error } = await client
      .from('guide_medical_info')
      .insert({
        guide_id: user.id,
        ...payload,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create medical info', error, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to create medical info' }, { status: 500 });
    }
    medicalInfo = data;
  }

  return NextResponse.json({ medicalInfo });
});

