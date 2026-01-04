/**
 * API: Waste Logging
 * POST /api/guide/trips/[id]/waste-log - Create waste log entry
 * GET /api/guide/trips/[id]/waste-log - Get waste logs for trip
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  getBranchContext,
  withBranchFilter,
} from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const wasteLogSchema = z.object({
  waste_type: z.enum(['plastic', 'organic', 'glass', 'hazmat']),
  quantity: z
    .number()
    .positive({ message: 'Jumlah harus lebih dari 0' })
    .max(100000, { message: 'Jumlah terlalu besar (max 100,000)' }),
  unit: z.enum(['kg', 'pieces']),
  disposal_method: z.enum(['landfill', 'recycling', 'incineration', 'ocean']),
  notes: z
    .string()
    .max(1000, { message: 'Catatan terlalu panjang (max 1000 karakter)' })
    .optional(),
  photos: z
    .array(
      z.object({
        photo_url: z.string().url({ message: 'URL foto tidak valid' }),
        photo_gps: z
          .object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
            accuracy: z.number().positive().optional(),
          })
          .nullable()
          .optional(),
        captured_at: z.string().datetime().optional(),
      })
    )
    .max(10, { message: 'Maksimal 10 foto' })
    .optional(),
});

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const supabase = await createClient();
    const { id: tripId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchContext = await getBranchContext(user.id);
    const client = supabase as unknown as any;

    // Verify trip belongs to guide
    const { data: trip } = await client
      .from('trips')
      .select('id, guide_id')
      .eq('id', tripId)
      .single();

    if (!trip || trip.guide_id !== user.id) {
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 404 }
      );
    }

    // Get waste logs for this trip
    const { data: wasteLogs, error } = await withBranchFilter(
      client.from('waste_logs'),
      branchContext
    )
      .select(
        `
      *,
      logged_by_user:users!logged_by(id, full_name, email),
      photos:waste_log_photos(*)
    `
      )
      .eq('trip_id', tripId)
      .order('logged_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch waste logs', error, {
        tripId,
        guideId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch waste logs' },
        { status: 500 }
      );
    }

    // Fetch lookup data separately (since they're not foreign keys)
    const wasteTypeValues = [
      ...new Set((wasteLogs || []).map((log: any) => log.waste_type)),
    ];
    const disposalMethodValues = [
      ...new Set((wasteLogs || []).map((log: any) => log.disposal_method)),
    ];

    // Fetch waste types lookup
    const { data: wasteTypesLookup } =
      wasteTypeValues.length > 0
        ? await client
            .from('waste_types_lookup')
            .select('value, label_id, label_en, description')
            .in('value', wasteTypeValues)
            .eq('is_active', true)
        : { data: [] };

    // Fetch disposal methods lookup
    const { data: disposalMethodsLookup } =
      disposalMethodValues.length > 0
        ? await client
            .from('disposal_methods_lookup')
            .select('value, label_id, label_en, description')
            .in('value', disposalMethodValues)
            .eq('is_active', true)
        : { data: [] };

    // Create lookup maps
    const wasteTypeMap = (wasteTypesLookup || []).reduce(
      (acc: Record<string, any>, item: any) => {
        acc[item.value] = item;
        return acc;
      },
      {} as Record<string, any>
    );

    const disposalMethodMap = (disposalMethodsLookup || []).reduce(
      (acc: Record<string, any>, item: any) => {
        acc[item.value] = item;
        return acc;
      },
      {} as Record<string, any>
    );

    // Transform response to include computed fields and labels
    const enrichedLogs = (wasteLogs || []).map((log: any) => {
      // Calculate quantity_kg (convert pieces to kg if needed, using average weight estimates)
      let quantity_kg = log.quantity;
      if (log.unit === 'pieces') {
        // Average weight estimates per piece (can be configured later)
        const pieceWeights: Record<string, number> = {
          plastic: 0.02, // ~20g per plastic piece
          organic: 0.1, // ~100g per organic piece
          glass: 0.3, // ~300g per glass piece
          hazmat: 0.05, // ~50g per hazmat piece
        };
        const weightPerPiece = pieceWeights[log.waste_type] || 0.02;
        quantity_kg = Number((log.quantity * weightPerPiece).toFixed(2));
      }

      const wasteTypeLookup = wasteTypeMap[log.waste_type];
      const disposalMethodLookup = disposalMethodMap[log.disposal_method];

      return {
        ...log,
        quantity_kg,
        waste_type_label: wasteTypeLookup?.label_id || log.waste_type,
        waste_type_description: wasteTypeLookup?.description || null,
        disposal_method_label:
          disposalMethodLookup?.label_id || log.disposal_method,
        disposal_method_description: disposalMethodLookup?.description || null,
        logged_by: log.logged_by_user
          ? {
              id: log.logged_by_user.id,
              name: log.logged_by_user.full_name || 'Unknown',
              email: log.logged_by_user.email || null,
            }
          : null,
        // Clean up nested objects
        logged_by_user: undefined,
      };
    });

    return NextResponse.json({ waste_logs: enrichedLogs });
  }
);

export const POST = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const supabase = await createClient();
    const { id: tripId } = await params;

    let payload;
    try {
      payload = wasteLogSchema.parse(await request.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        logger.warn('Waste log validation failed', {
          issues: error.issues,
          tripId,
        });
        return NextResponse.json(
          {
            error: firstError?.message || 'Data tidak valid',
            details: error.issues,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchContext = await getBranchContext(user.id);

    if (!branchContext.branchId && !branchContext.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Branch context required' },
        { status: 400 }
      );
    }

    const client = supabase as unknown as any;

    // Verify trip belongs to guide
    const { data: trip } = await client
      .from('trips')
      .select('id, guide_id')
      .eq('id', tripId)
      .single();

    if (!trip || trip.guide_id !== user.id) {
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 404 }
      );
    }

    // Create waste log entry
    const { data: wasteLog, error } = await withBranchFilter(
      client.from('waste_logs'),
      branchContext
    )
      .insert({
        trip_id: tripId,
        branch_id: branchContext.branchId,
        waste_type: payload.waste_type,
        quantity: payload.quantity,
        unit: payload.unit,
        disposal_method: payload.disposal_method,
        logged_by: user.id,
        logged_at: new Date().toISOString(),
        notes: payload.notes || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create waste log', error, {
        tripId,
        guideId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to create waste log' },
        { status: 500 }
      );
    }

    // If photos provided, create photo records with GPS data
    if (payload.photos && payload.photos.length > 0) {
      const photoInserts = payload.photos.map((photo) => ({
        waste_log_id: wasteLog.id,
        photo_url: photo.photo_url,
        photo_gps: photo.photo_gps
          ? {
              latitude: photo.photo_gps.latitude,
              longitude: photo.photo_gps.longitude,
              accuracy: photo.photo_gps.accuracy || null,
            }
          : null,
        captured_at: photo.captured_at || new Date().toISOString(),
      }));

      const { error: photosError } = await client
        .from('waste_log_photos')
        .insert(photoInserts);

      if (photosError) {
        logger.warn('Failed to create waste log photos', {
          error: photosError,
          wasteLogId: wasteLog.id,
        });
        // Don't fail the whole request if photos fail
      }
    }

    logger.info('Waste log created', {
      wasteLogId: wasteLog.id,
      tripId,
      guideId: user.id,
    });

    return NextResponse.json({ waste_log: wasteLog });
  }
);
