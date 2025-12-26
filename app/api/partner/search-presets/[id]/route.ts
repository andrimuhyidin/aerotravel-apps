/**
 * API: Partner Search Preset Detail
 * Update and delete operations for a specific preset
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type Params = Promise<{ id: string }>;

const updatePresetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  filters: z.record(z.unknown()).optional(),
});

// PUT - Update preset
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const supabase = await createClient();
  const { id: presetId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = updatePresetSchema.parse(body);

    // Check if preset exists and belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('partner_search_presets')
      .select('id, partner_id')
      .eq('id', presetId)
      .eq('partner_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    const { data: preset, error } = await supabase
      .from('partner_search_presets')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', presetId)
      .eq('partner_id', user.id)
      .select('id, name, filters, created_at, updated_at')
      .single();

    if (error) {
      logger.error('Failed to update search preset', error, {
        userId: user.id,
        presetId,
      });
      throw error;
    }

    return NextResponse.json({ preset });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', issues: error.issues },
        { status: 400 }
      );
    }

    logger.error('Failed to update search preset', error, {
      userId: user.id,
      presetId,
    });
    throw error;
  }
});

// DELETE - Delete preset
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const supabase = await createClient();
  const { id: presetId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if preset exists and belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('partner_search_presets')
      .select('id, partner_id')
      .eq('id', presetId)
      .eq('partner_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('partner_search_presets')
      .delete()
      .eq('id', presetId)
      .eq('partner_id', user.id);

    if (error) {
      logger.error('Failed to delete search preset', error, {
        userId: user.id,
        presetId,
      });
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete search preset', error, {
      userId: user.id,
      presetId,
    });
    throw error;
  }
});

