/**
 * API: Admin Package Detail Management
 * GET /api/admin/packages/[id] - Get package detail
 * PUT /api/admin/packages/[id] - Update package
 * DELETE /api/admin/packages/[id] - Delete (soft) package
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updatePackageSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  slug: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  packageType: z.enum(['open_trip', 'private_trip', 'corporate', 'kol_trip']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  destination: z.string().min(2).max(200).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  durationDays: z.number().int().min(1).optional(),
  durationNights: z.number().int().min(0).optional(),
  minPax: z.number().int().min(1).optional(),
  maxPax: z.number().int().min(1).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = supabase as unknown as any;
    
    const { data: packageData, error } = await client
      .from('packages')
      .select(`
        *,
        package_prices (
          id,
          min_pax,
          max_pax,
          price_publish,
          price_nta,
          price_weekend,
          valid_from,
          valid_until,
          is_active
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch package', error, { packageId: id });
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ package: packageData });
  } catch (error) {
    logger.error('Error in GET /api/admin/packages/[id]', error, { packageId: id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = updatePackageSchema.parse(body);

    const client = supabase as unknown as any;

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.shortDescription !== undefined) updateData.short_description = validated.shortDescription;
    if (validated.packageType !== undefined) updateData.package_type = validated.packageType;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.destination !== undefined) updateData.destination = validated.destination;
    if (validated.city !== undefined) updateData.city = validated.city;
    if (validated.province !== undefined) updateData.province = validated.province;
    if (validated.durationDays !== undefined) updateData.duration_days = validated.durationDays;
    if (validated.durationNights !== undefined) updateData.duration_nights = validated.durationNights;
    if (validated.minPax !== undefined) updateData.min_pax = validated.minPax;
    if (validated.maxPax !== undefined) updateData.max_pax = validated.maxPax;
    if (validated.inclusions !== undefined) updateData.inclusions = validated.inclusions;
    if (validated.exclusions !== undefined) updateData.exclusions = validated.exclusions;
    if (validated.thumbnailUrl !== undefined) updateData.thumbnail_url = validated.thumbnailUrl;

    const { data: updated, error } = await client
      .from('packages')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update package', error, { packageId: id });
      return NextResponse.json(
        { error: 'Failed to update package' },
        { status: 500 }
      );
    }

    logger.info('Package updated successfully', { packageId: id, userId: user.id });

    return NextResponse.json({
      success: true,
      package: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error in PUT /api/admin/packages/[id]', error, { packageId: id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = supabase as unknown as any;

    // Soft delete
    const { error } = await client
      .from('packages')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      logger.error('Failed to delete package', error, { packageId: id });
      return NextResponse.json(
        { error: 'Failed to delete package' },
        { status: 500 }
      );
    }

    logger.info('Package deleted successfully', { packageId: id, userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    logger.error('Error in DELETE /api/admin/packages/[id]', error, { packageId: id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

