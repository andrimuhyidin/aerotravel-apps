/**
 * API Route: Check Package Availability
 * GET /api/partner/packages/[id]/availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPackageAvailability, getNextAvailableDates } from '@/lib/availability/availability-service';
import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const availabilityQuerySchema = z.object({
  date: z.string().datetime().optional(),
  adult: z.coerce.number().int().min(0).optional(),
  child: z.coerce.number().int().min(0).optional(),
  infant: z.coerce.number().int().min(0).optional(),
  nextDates: z.coerce.number().int().min(1).max(10).optional(),
});

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id: packageId } = await context.params;
    const { searchParams } = new URL(request.url);

    logger.info('GET /api/partner/packages/[id]/availability', { packageId });

    try {
      // Parse and validate query params
      const queryParams = availabilityQuerySchema.parse({
        date: searchParams.get('date') || undefined,
        adult: searchParams.get('adult') || undefined,
        child: searchParams.get('child') || undefined,
        infant: searchParams.get('infant') || undefined,
        nextDates: searchParams.get('nextDates') || undefined,
      });

      // If requesting next available dates
      if (queryParams.nextDates) {
        const dates = await getNextAvailableDates(packageId, queryParams.nextDates);
        return NextResponse.json({
          success: true,
          data: {
            packageId,
            nextAvailableDates: dates,
          },
        });
      }

      // Check specific date availability
      const targetDate = queryParams.date ? new Date(queryParams.date) : new Date();

      const availability = await checkPackageAvailability({
        packageId,
        date: targetDate,
        paxCount: {
          adult: queryParams.adult || 1,
          child: queryParams.child || 0,
          infant: queryParams.infant || 0,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          packageId,
          requestedDate: targetDate.toISOString(),
          ...availability,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Invalid query parameters', { error: error.errors });
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid query parameters',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      throw error;
    }
  }
);
