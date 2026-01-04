'use client';

/**
 * Change Password Form Component
 * Form untuk mengubah password guide
 */

import { Loader2, Lock, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

type ChangePasswordFormProps = {
  locale: string;
};

export function ChangePasswordForm({ locale }: ChangePasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Semua field harus diisi');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Password baru harus berbeda dengan password lama');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();

        // Verify current password by attempting to sign in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          setError('Sesi Anda telah berakhir. Silakan login kembali.');
          return;
        }

        // Try to sign in with current password to verify
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          setError('Password lama tidak benar');
          logger.error('Password verification failed', signInError);
          return;
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          setError(updateError.message || 'Gagal mengubah password');
          logger.error('Password update failed', updateError);
          return;
        }

        setSuccess(true);
        logger.info('Password updated successfully', { userId: user.id });

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push(`/${locale}/guide/profile`);
        }, 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
        setError(errorMessage);
        logger.error('Change password error', err);
      }
    });
  }

  if (success) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Password Berhasil Diubah</h3>
            <p className="text-sm text-slate-600">
              Password Anda telah berhasil diubah. Mengarahkan ke halaman profil...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">Password Baru</CardTitle>
        <p className="mt-1 text-xs text-slate-500">
          Pastikan password baru Anda kuat dan mudah diingat
        </p>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium">
              Password Lama
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="Masukkan password lama"
                required
                disabled={isPending}
                className="h-11 rounded-lg pl-10"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium">
              Password Baru
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Minimal 8 karakter"
                required
                disabled={isPending}
                className="h-11 rounded-lg pl-10"
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <p className="text-xs text-slate-500">
              Password harus minimal 8 karakter dan berbeda dengan password lama
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Konfirmasi Password Baru
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Ulangi password baru"
                required
                disabled={isPending}
                className="h-11 rounded-lg pl-10"
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengubah Password...
              </>
            ) : (
              'Ubah Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
