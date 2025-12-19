/**
 * Guide Sync API
 * Receives offline mutations and syncs to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type MutationType =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'UPLOAD_EVIDENCE'
  | 'ADD_EXPENSE'
  | 'TRACK_POSITION'
  | 'UPDATE_MANIFEST'
  | 'UPDATE_MANIFEST_DETAILS';

type QueuedMutation = {
  id: string;
  type: MutationType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
};

const mutationSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'CHECK_IN',
    'CHECK_OUT',
    'UPLOAD_EVIDENCE',
    'ADD_EXPENSE',
    'TRACK_POSITION',
    'UPDATE_MANIFEST',
    'UPDATE_MANIFEST_DETAILS',
  ]),
  payload: z.record(z.string(), z.unknown()),
  timestamp: z.number(),
  retryCount: z.number(),
});

function calculateLatePenalty(now: Date): { isLate: boolean; penalty: number } {
  const threshold = new Date(now);
  threshold.setHours(7, 30, 0, 0);
  const isLate = now.getTime() > threshold.getTime();
  const penalty = isLate ? 25_000 : 0;
  return { isLate, penalty };
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const mutation = mutationSchema.parse((await request.json()) as QueuedMutation);

  logger.info('Processing sync mutation', { type: mutation.type, id: mutation.id });

  // Verify user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    switch (mutation.type) {
      case 'CHECK_IN': {
        const { tripId, latitude, longitude } = mutation.payload as {
          tripId?: string;
          latitude?: number;
          longitude?: number;
        };

        if (!tripId || latitude === undefined || longitude === undefined) {
          throw new Error('Invalid CHECK_IN payload');
        }

        const now = new Date();
        const checkInAt = now.toISOString();
        const { isLate, penalty } = calculateLatePenalty(now);

        const { error: updateError } = await withBranchFilter(
          client.from('trip_guides'),
          branchContext,
        )
          .update({
            check_in_at: checkInAt,
            check_in_lat: latitude,
            check_in_lng: longitude,
            is_late: isLate,
          })
          .eq('trip_id', tripId)
          .eq('guide_id', user.id);

        if (updateError) throw updateError;

        if (isLate && penalty > 0) {
          const { error: deductionError } = await withBranchFilter(
            client.from('salary_deductions'),
            branchContext,
          ).insert({
            guide_id: user.id,
            trip_id: tripId,
            deduction_type: 'late_penalty',
            amount: penalty,
            reason: 'Auto penalty for late check-in (offline sync)',
            is_auto: true,
            created_by: user.id,
          });

          if (deductionError) throw deductionError;
        }

        break;
      }

      case 'CHECK_OUT': {
        const { tripId, latitude, longitude, timestamp } = mutation.payload as {
          tripId?: string;
          latitude?: number;
          longitude?: number;
          timestamp?: string;
        };

        if (!tripId) {
          throw new Error('Invalid CHECK_OUT payload');
        }

        const checkOutAt = timestamp || new Date().toISOString();

        const { error } = await withBranchFilter(
          client.from('trip_guides'),
          branchContext,
        )
          .update({
            check_out_at: checkOutAt,
            check_out_lat: latitude ?? null,
            check_out_lng: longitude ?? null,
          })
          .eq('trip_id', tripId)
          .eq('guide_id', user.id);

        if (error) throw error;

        break;
      }

      case 'UPDATE_MANIFEST': {
        const { tripId, passengerId, checkType } = mutation.payload as {
          tripId?: string;
          passengerId?: string;
          checkType?: 'boarding' | 'return';
        };

        if (!tripId || !passengerId || !checkType) {
          throw new Error('Invalid UPDATE_MANIFEST payload');
        }

        const now = new Date().toISOString();
        const updateData =
          checkType === 'boarding'
            ? { boarded_at: now, boarded_by: user.id }
            : { returned_at: now, returned_by: user.id };

        const { error } = await withBranchFilter(
          client.from('manifest_checks'),
          branchContext,
        ).upsert(
          {
            trip_id: tripId,
            passenger_id: passengerId,
            ...updateData,
          },
          { onConflict: 'trip_id,passenger_id' }
        );

        if (error) throw error;

        break;
      }

      case 'UPDATE_MANIFEST_DETAILS': {
        const {
          tripId,
          passengerId,
          notes,
          allergy,
          seasick,
          specialRequest,
        } = mutation.payload as {
          tripId?: string;
          passengerId?: string;
          notes?: string;
          allergy?: string;
          seasick?: boolean;
          specialRequest?: string;
        };

        if (!tripId || !passengerId) {
          throw new Error('Invalid UPDATE_MANIFEST_DETAILS payload');
        }

        const { error } = await withBranchFilter(
          client.from('manifest_passengers'),
          branchContext,
        )
          .update({
            notes: notes ?? null,
            allergy: allergy ?? null,
            seasick: seasick ?? null,
            special_request: specialRequest ?? null,
          } as never)
          .eq('trip_id', tripId)
          .eq('passenger_id', passengerId);

        if (error) throw error;

        break;
      }

      case 'UPLOAD_EVIDENCE': {
        const { tripId, url } = mutation.payload as {
          tripId?: string;
          url?: string;
        };

        if (!tripId || !url) {
          throw new Error('Invalid UPLOAD_EVIDENCE payload');
        }

        const { error } = await withBranchFilter(
          client.from('trips'),
          branchContext,
        )
          .update({
            documentation_url: url,
            documentation_uploaded_at: new Date().toISOString(),
          })
          .eq('id', tripId);

        if (error) throw error;

        break;
      }

      case 'ADD_EXPENSE': {
        const { tripId, category, description, amount, receiptUrl } = mutation.payload as {
          tripId?: string;
          category?: 'tiket' | 'makan' | 'transport' | 'medis' | 'lainnya';
          description?: string;
          amount?: number;
          receiptUrl?: string;
        };

        if (!tripId || !category || typeof amount !== 'number') {
          throw new Error('Invalid ADD_EXPENSE payload');
        }

        const categoryMap: Record<
          string,
          'fuel' | 'food' | 'ticket' | 'transport' | 'equipment' | 'emergency' | 'other'
        > = {
          tiket: 'ticket',
          makan: 'food',
          transport: 'transport',
          medis: 'emergency',
          lainnya: 'other',
        };

        const dbCategory = categoryMap[category] ?? 'other';

        const { error } = await withBranchFilter(
          client.from('trip_expenses'),
          branchContext,
        ).insert({
          trip_id: tripId,
          vendor_id: null,
          category: dbCategory,
          description: description ?? '',
          quantity: 1,
          unit_price: amount,
          total_amount: amount,
          receipt_url: receiptUrl ?? null,
          created_by: user.id,
        } as never);

        if (error) throw error;

        break;
      }

      case 'TRACK_POSITION': {
        const {
          tripId,
          latitude,
          longitude,
          accuracyMeters,
          altitudeMeters,
          heading,
          speedKmh,
        } = mutation.payload as {
          tripId?: string;
          latitude?: number;
          longitude?: number;
          accuracyMeters?: number;
          altitudeMeters?: number;
          heading?: number;
          speedKmh?: number;
        };

        if (!tripId || latitude === undefined || longitude === undefined) {
          throw new Error('Invalid TRACK_POSITION payload');
        }

        const now = new Date().toISOString();

        // Insert GPS ping history
        const { error: pingError } = await withBranchFilter(
          client.from('gps_pings'),
          branchContext,
        ).insert({
          trip_id: tripId,
          guide_id: user.id,
          latitude,
          longitude,
          accuracy_meters: accuracyMeters ?? null,
          altitude_meters: altitudeMeters ?? null,
          heading: heading ?? null,
          speed_kmh: speedKmh ?? null,
        } as never);

        if (pingError) throw pingError;

        // Update current guide location cache
        const { error: locError } = await withBranchFilter(
          client.from('guide_locations'),
          branchContext,
        )
          .upsert(
            {
              guide_id: user.id,
              trip_id: tripId,
              latitude,
              longitude,
              accuracy_meters: accuracyMeters ?? null,
              is_online: true,
              last_seen_at: now,
            } as never,
            { onConflict: 'guide_id' }
          );

        if (locError) throw locError;

        break;
      }

      default:
        logger.warn('Unknown mutation type', { type: mutation.type });
    }

    logger.info('Sync mutation successful', { type: mutation.type, id: mutation.id });

    return NextResponse.json({ success: true, mutationId: mutation.id });
  } catch (error) {
    logger.error('Sync mutation failed', error, { type: mutation.type, id: mutation.id });
    return NextResponse.json(
      { error: 'Sync failed', details: (error as Error).message },
      { status: 500 }
    );
  }
});
