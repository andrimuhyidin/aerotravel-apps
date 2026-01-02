/**
 * API: Allocate Budget to Employee
 * POST /api/partner/corporate/employees/[id]/allocate
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getCorporateClient, updateEmployeeAllocation } from '@/lib/corporate';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const allocateSchema = z.object({
  amount: z.number().min(0, 'Jumlah harus positif'),
});

export const POST = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id: employeeId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const corporate = await getCorporateClient(user.id);

      if (!corporate) {
        return NextResponse.json(
          { error: 'No corporate access' },
          { status: 403 }
        );
      }

      // Check if user is PIC
      if (corporate.picId !== user.id) {
        return NextResponse.json(
          { error: 'Only PIC can allocate budget' },
          { status: 403 }
        );
      }

      // Verify employee belongs to this corporate
      const { data: employee } = await supabase
        .from('corporate_employees')
        .select('id, corporate_id')
        .eq('id', employeeId)
        .single();

      if (
        !employee ||
        (employee as { corporate_id: string }).corporate_id !== corporate.id
      ) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      const body = await request.json();
      const parsed = allocateSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid amount', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const success = await updateEmployeeAllocation(
        employeeId,
        parsed.data.amount
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update allocation' },
          { status: 500 }
        );
      }

      logger.info('Employee allocation updated', {
        corporateId: corporate.id,
        employeeId,
        amount: parsed.data.amount,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        allocatedAmount: parsed.data.amount,
      });
    } catch (error) {
      logger.error('Failed to allocate budget', error, { employeeId });
      return NextResponse.json(
        { error: 'Failed to allocate budget' },
        { status: 500 }
      );
    }
  }
);

