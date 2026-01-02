/**
 * API: Corporate Bookings
 * GET /api/partner/corporate/bookings - List bookings
 * POST /api/partner/corporate/bookings - Create booking with approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createApprovalRequest, getCorporateClient } from '@/lib/corporate';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Schema for passenger data
const passengerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  type: z.enum(['adult', 'child', 'infant']),
  dateOfBirth: z.string().optional(),
  idNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  specialRequests: z.string().optional(),
});

// Schema for creating corporate booking
const createBookingSchema = z.object({
  packageId: z.string().uuid('Package ID tidak valid'),
  tripDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  passengers: z.array(passengerSchema).min(1, 'Minimal 1 penumpang'),
  notes: z.string().optional(),
  requestNotes: z.string().optional(),
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') || undefined;

    // Get employees for this corporate
    const { data: employees } = await supabase
      .from('corporate_employees')
      .select('user_id')
      .eq('corporate_id', corporate.id);

    const employeeUserIds = (employees || [])
      .map((e: { user_id: string | null }) => e.user_id)
      .filter(Boolean);

    if (employeeUserIds.length === 0) {
      return NextResponse.json({
        bookings: [],
        pagination: { total: 0, limit, offset, hasMore: false },
      });
    }

    // Get bookings for these employees
    let query = supabase
      .from('bookings')
      .select(
        `
        id,
        booking_code,
        trip_date,
        adult_pax,
        child_pax,
        infant_pax,
        nta_total,
        status,
        created_by,
        created_at,
        packages (
          name,
          destination
        )
      `,
        { count: 'exact' }
      )
      .in('created_by', employeeUserIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: bookings, count, error } = await query;

    if (error) {
      logger.error('Failed to get corporate bookings', error, {
        corporateId: corporate.id,
      });
      return NextResponse.json(
        { error: 'Failed to get bookings' },
        { status: 500 }
      );
    }

    // Get employee names
    const { data: employeeData } = await supabase
      .from('corporate_employees')
      .select('user_id, full_name, department')
      .eq('corporate_id', corporate.id);

    const employeeMap = new Map(
      (employeeData || []).map((e: { user_id: string; full_name: string; department: string | null }) => [
        e.user_id,
        { name: e.full_name, department: e.department },
      ])
    );

    const formattedBookings = (bookings || []).map((b) => {
      const booking = b as {
        id: string;
        booking_code: string;
        trip_date: string;
        adult_pax: number;
        child_pax: number;
        infant_pax: number;
        nta_total: number;
        status: string;
        created_by: string;
        created_at: string;
        packages: { name: string; destination: string } | null;
      };
      const employee = employeeMap.get(booking.created_by);

      return {
        id: booking.id,
        bookingCode: booking.booking_code,
        packageName: booking.packages?.name || 'Unknown',
        destination: booking.packages?.destination || 'Unknown',
        tripDate: booking.trip_date,
        employeeName: employee?.name || 'Unknown',
        employeeDepartment: employee?.department,
        totalPax:
          booking.adult_pax + booking.child_pax + booking.infant_pax,
        totalAmount: Number(booking.nta_total),
        status: booking.status,
        approvalStatus: null, // Would come from corporate_booking_approvals table
        createdAt: booking.created_at,
      };
    });

    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + formattedBookings.length < (count || 0),
      },
    });
  } catch (error) {
    logger.error('Failed to get corporate bookings', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to get bookings' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/partner/corporate/bookings
 * Create a new booking with approval request
 */
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

    // Get employee info for current user
    const { data: employee } = await supabase
      .from('corporate_employees')
      .select('id, user_id, allocated_amount, used_amount')
      .eq('corporate_id', corporate.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: 'Anda tidak terdaftar sebagai karyawan corporate' },
        { status: 403 }
      );
    }

    const employeeData = employee as {
      id: string;
      user_id: string;
      allocated_amount: number;
      used_amount: number;
    };

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = sanitizeRequestBody(body, {
      strings: ['notes', 'requestNotes'],
    });
    const parsed = createBookingSchema.safeParse(sanitizedBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { packageId, tripDate, passengers, notes, requestNotes } = parsed.data;

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('id, name, branch_id, nta_price_per_adult, nta_price_per_child, price_per_adult, price_per_child, min_pax, max_pax, is_active')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (packageError || !packageData) {
      return NextResponse.json(
        { error: 'Paket tidak ditemukan atau tidak aktif' },
        { status: 404 }
      );
    }

    const pkg = packageData as {
      id: string;
      name: string;
      branch_id: string;
      nta_price_per_adult: number;
      nta_price_per_child: number;
      price_per_adult: number;
      price_per_child: number;
      min_pax: number;
      max_pax: number;
    };

    // Count passengers by type
    const adultCount = passengers.filter((p) => p.type === 'adult').length;
    const childCount = passengers.filter((p) => p.type === 'child').length;
    const infantCount = passengers.filter((p) => p.type === 'infant').length;
    const totalPax = adultCount + childCount + infantCount;

    // Validate pax count
    if (totalPax < pkg.min_pax || totalPax > pkg.max_pax) {
      return NextResponse.json(
        { error: `Jumlah penumpang harus antara ${pkg.min_pax} - ${pkg.max_pax}` },
        { status: 400 }
      );
    }

    // Calculate total price (using NTA price)
    const pricePerAdult = Number(pkg.nta_price_per_adult || pkg.price_per_adult);
    const pricePerChild = Number(pkg.nta_price_per_child || pkg.price_per_child);
    const subtotal = pricePerAdult * adultCount + pricePerChild * childCount;
    const totalAmount = subtotal; // Could add tax here if needed

    // Check remaining budget
    const remainingBudget = Number(employeeData.allocated_amount) - Number(employeeData.used_amount);
    if (totalAmount > remainingBudget) {
      logger.warn('Booking amount exceeds remaining budget', {
        totalAmount,
        remainingBudget,
        employeeId: employeeData.id,
      });
      // Don't reject - let it go through approval process
    }

    // Generate booking code
    const bookingCode = `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create booking with pending_approval status
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        branch_id: pkg.branch_id,
        package_id: packageId,
        booking_code: bookingCode,
        booking_date: new Date().toISOString().split('T')[0],
        trip_date: tripDate,
        source: 'corporate',
        adult_pax: adultCount,
        child_pax: childCount,
        infant_pax: infantCount,
        price_per_adult: pricePerAdult,
        price_per_child: pricePerChild,
        subtotal: subtotal,
        total_amount: totalAmount,
        nta_price_per_adult: pricePerAdult,
        nta_total: totalAmount,
        status: 'pending_approval',
        notes: notes,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (bookingError) {
      logger.error('Failed to create booking', bookingError, {
        corporateId: corporate.id,
        employeeId: employeeData.id,
      });
      return NextResponse.json(
        { error: 'Gagal membuat booking' },
        { status: 500 }
      );
    }

    const bookingId = (newBooking as { id: string }).id;

    // Create booking passengers
    const passengersToInsert = passengers.map((p, index) => ({
      booking_id: bookingId,
      name: p.name,
      passenger_type: p.type,
      date_of_birth: p.dateOfBirth || null,
      id_number: p.idNumber || null,
      phone: p.phone || null,
      email: p.email || null,
      special_requests: p.specialRequests || null,
      sort_order: index,
    }));

    const { error: passengersError } = await supabase
      .from('booking_passengers')
      .insert(passengersToInsert);

    if (passengersError) {
      logger.warn('Failed to insert passengers', passengersError, { bookingId });
      // Don't fail the whole booking, passengers can be added later
    }

    // Create approval request
    const approvalResult = await createApprovalRequest(
      corporate.id,
      bookingId,
      employeeData.id,
      totalAmount,
      requestNotes
    );

    if (!approvalResult.success) {
      logger.error('Failed to create approval request', new Error(approvalResult.error), {
        bookingId,
        employeeId: employeeData.id,
      });
      // Don't fail - booking is created, approval can be created manually
    }

    logger.info('Corporate booking created', {
      bookingId,
      bookingCode,
      corporateId: corporate.id,
      employeeId: employeeData.id,
      approvalId: approvalResult.approvalId,
      totalAmount,
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
        bookingCode,
        packageName: pkg.name,
        tripDate,
        totalPax,
        totalAmount,
        status: 'pending_approval',
      },
      approvalId: approvalResult.approvalId,
      message: 'Booking berhasil dibuat dan menunggu persetujuan PIC',
    });
  } catch (error) {
    logger.error('Failed to create corporate booking', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal membuat booking' },
      { status: 500 }
    );
  }
});

