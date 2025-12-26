/**
 * API: User Profile Management
 * PUT /api/user/profile - Update user profile
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  phone: z.string().min(10, 'Nomor telepon tidak valid').optional(),
  email: z.string().email('Email tidak valid').optional(),
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const client = supabase as unknown as any;

    // Update users table
    const updateData: Record<string, string> = {};
    if (validatedData.fullName !== undefined) {
      updateData.full_name = validatedData.fullName;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await client
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        logger.error('Failed to update user profile', updateError, {
          userId: user.id,
        });
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }
    }

    // Update email in auth if provided
    if (validatedData.email && validatedData.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: validatedData.email,
      });

      if (emailError) {
        logger.error('Failed to update email', emailError, {
          userId: user.id,
        });
        return NextResponse.json(
          { error: 'Failed to update email. Email mungkin sudah digunakan.' },
          { status: 400 }
        );
      }
    }

    logger.info('User profile updated', {
      userId: user.id,
      fields: Object.keys(validatedData),
    });

    return NextResponse.json({
      success: true,
      message: 'Profile berhasil diperbarui',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    logger.error('Failed to update profile', error, {
      userId: user.id,
    });
    throw error;
  }
});

