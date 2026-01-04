/**
 * API: Guide Medical Info
 * GET  /api/guide/medical-info - Get medical info
 * PUT  /api/guide/medical-info - Update medical info
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

import { createErrorResponse, createSuccessResponse } from '@/lib/api/response-format';
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
    return createErrorResponse('Unauthorized', undefined, undefined, 401);
  }

  const client = supabase as unknown as any;

  const { data: medicalInfo, error } = await client
    .from('guide_medical_info')
    .select('*')
    .eq('guide_id', user.id)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch medical info', error, { guideId: user.id });
    return createErrorResponse('Failed to fetch medical info', 'DATABASE_ERROR', error, 500);
  }

  return createSuccessResponse({ medicalInfo: medicalInfo || null });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = updateMedicalInfoSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse('Unauthorized', undefined, undefined, 401);
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
      return createErrorResponse('Failed to update medical info', 'DATABASE_ERROR', error, 500);
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
      return createErrorResponse('Failed to create medical info', 'DATABASE_ERROR', error, 500);
    }
    medicalInfo = data;
  }

  return createSuccessResponse({ medicalInfo });
});

