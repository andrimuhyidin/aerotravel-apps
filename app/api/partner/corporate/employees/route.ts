/**
 * API: Corporate Employees
 * GET /api/partner/corporate/employees - List employees
 * POST /api/partner/corporate/employees - Add employee
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import {
  addEmployee,
  getCorporateClient,
  getEmployees,
} from '@/lib/corporate';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const addEmployeeSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional(),
  department: z.string().optional(),
  employeeIdNumber: z.string().optional(),
  allocatedAmount: z.number().min(0).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
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

    // Sanitize search params
    const searchParams = sanitizeSearchParams(request);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || undefined;
    const department = searchParams.get('department') || undefined;
    const status = searchParams.get('status') as
      | 'active'
      | 'inactive'
      | 'invited'
      | undefined;

    const result = await getEmployees(corporate.id, {
      limit: Math.min(Math.max(1, limit), 100),
      offset: Math.max(0, offset),
      search,
      department,
      status,
    });

    return NextResponse.json({
      employees: result.employees,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.employees.length < result.total,
      },
    });
  } catch (error) {
    logger.error('Failed to get employees', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to get employees' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
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

    // Check if user is PIC (only PIC can add employees)
    if (corporate.picId !== user.id) {
      return NextResponse.json(
        { error: 'Only PIC can add employees' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Sanitize input
    const sanitizedBody = sanitizeRequestBody(body, {
      strings: ['fullName', 'department', 'employeeIdNumber'],
      emails: ['email'],
      phones: ['phone'],
    });
    
    const parsed = addEmployeeSchema.safeParse(sanitizedBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await addEmployee(corporate.id, parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to add employee' },
        { status: 400 }
      );
    }

    logger.info('Employee added via API', {
      corporateId: corporate.id,
      employeeId: result.employeeId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      employeeId: result.employeeId,
    });
  } catch (error) {
    logger.error('Failed to add employee', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to add employee' },
      { status: 500 }
    );
  }
});

