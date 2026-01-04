/**
 * API: Guide Profile Update
 * PATCH /api/guide/profile - Update guide profile with server-side validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logProfileUpdate } from '@/lib/audit/audit-logger';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInput, sanitizePhone } from '@/lib/utils/sanitize';
import { logger } from '@/lib/utils/logger';

// Server-side validation schema (same as client)
const profileUpdateSchema = z.object({
  name: z.string().min(3, 'Nama harus antara 3-200 karakter').max(200, 'Nama harus antara 3-200 karakter'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || sanitizePhone(val) !== null,
      'Nomor telepon tidak valid. Format: 08xxxxxxxxxx atau +628xxxxxxxxxx'
    ),
  nik: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        if (val.length !== 16 || !/^\d+$/.test(val)) return false;
        const datePart = val.substring(0, 6);
        const year = parseInt(datePart.substring(0, 2), 10);
        const month = parseInt(datePart.substring(2, 4), 10);
        const day = parseInt(datePart.substring(4, 6), 10);
        if (month < 1 || month > 12 || day < 1 || day > 31) return false;
        return true;
      },
      'NIK harus berupa 16 digit angka dengan format valid. Contoh: 3201010101010001'
    ),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse and validate request body
  const body = await request.json();
  const validationResult = profileUpdateSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: validationResult.error.issues,
      },
      { status: 400 }
    );
  }

  const validated = validationResult.data;

  // Get current profile for audit log
  const { data: currentProfile } = await client
    .from('users')
    .select('full_name, phone, nik, address')
    .eq('id', user.id)
    .single();

  if (!currentProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Sanitize inputs
  const updateData: Record<string, unknown> = {
    full_name: sanitizeInput(validated.name.trim()),
    phone: validated.phone?.trim() ? sanitizePhone(validated.phone.trim()) : null,
    nik: validated.nik?.trim() ? sanitizeInput(validated.nik.trim()) : null,
    address: validated.address?.trim() ? sanitizeInput(validated.address.trim()) : null,
    updated_at: new Date().toISOString(),
  };

  // Update profile
  const { data: updatedProfile, error: updateError } = await client
    .from('users')
    .update(updateData)
    .eq('id', user.id)
    .select('full_name, phone, nik, address')
    .single();

  if (updateError) {
    logger.error('Failed to update guide profile', updateError, {
      userId: user.id,
      updateData,
    });
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }

  // Log audit trail
  await logProfileUpdate(
    user.id,
    {
      full_name: currentProfile.full_name,
      phone: currentProfile.phone,
      nik: currentProfile.nik,
      address: currentProfile.address,
    },
    {
      full_name: updateData.full_name,
      phone: updateData.phone,
      nik: updateData.nik,
      address: updateData.address,
    },
    'guide'
  );

  logger.info('Guide profile updated', {
    userId: user.id,
    fields: Object.keys(updateData),
  });

  return NextResponse.json({
    success: true,
    profile: updatedProfile,
  });
});

