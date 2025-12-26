/**
 * API: Change Password
 * PUT /api/user/password - Change user password
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password baru dan konfirmasi password tidak sama',
  path: ['confirmPassword'],
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
    const validatedData = changePasswordSchema.parse(body);

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validatedData.currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Password saat ini tidak benar' },
        { status: 401 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (updateError) {
      logger.error('Failed to update password', updateError, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Gagal mengubah password. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    logger.info('Password changed successfully', {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    logger.error('Failed to change password', error, {
      userId: user.id,
    });
    throw error;
  }
});

