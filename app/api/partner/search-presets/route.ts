/**
 * API: Partner Search Presets
 * CRUD operations for saved search presets
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createPresetSchema = z.object({
  name: z.string().min(1).max(200),
  filters: z.record(z.unknown()),
});

const updatePresetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  filters: z.record(z.unknown()).optional(),
});

// GET - List all presets for current partner
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  try {
    const { data: presets, error } = await supabase
      .from('partner_search_presets')
      .select('id, name, filters, created_at, updated_at')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch search presets', error, {
        userId: user.id,
      });
      throw error;
    }

    return NextResponse.json({ presets: presets || [] });
  } catch (error) {
    logger.error('Failed to fetch search presets', error, {
      userId: user.id,
    });
    throw error;
  }
});

// POST - Create new preset
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const sanitizedBody = sanitizeRequestBody(body, { strings: ['name'] });
    const validated = createPresetSchema.parse(sanitizedBody);

    const { data: preset, error } = await supabase
      .from('partner_search_presets')
      .insert({
        partner_id: partnerId,
        name: validated.name,
        filters: validated.filters,
      })
      .select('id, name, filters, created_at, updated_at')
      .single();

    if (error) {
      logger.error('Failed to create search preset', error, {
        userId: user.id,
        name: validated.name,
      });
      throw error;
    }

    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', issues: error.issues },
        { status: 400 }
      );
    }

    logger.error('Failed to create search preset', error, {
      userId: user.id,
    });
    throw error;
  }
});

