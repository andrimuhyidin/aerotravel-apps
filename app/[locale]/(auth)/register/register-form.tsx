'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trackSignup } from '@/lib/analytics/identity';
import { signUp } from '@/lib/actions/auth';

type RegisterFormProps = {
  locale: string;
};

export function RegisterForm({ locale }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      // Track successful signup
      trackSignup(result.userId || 'pending', 'customer', 'email');
      
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold">Pendaftaran Berhasil!</h2>
        <p className="text-sm text-muted-foreground">
          Silakan cek email Anda untuk verifikasi akun.
        </p>
        <Button asChild className="h-12 w-full rounded-xl">
          <Link href={`/${locale}/login`}>Kembali ke Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs font-medium">
            Nama Lengkap
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            required
            disabled={loading}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            required
            disabled={loading}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-medium">
            No. WhatsApp
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="08123456789"
            disabled={loading}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimal 8 karakter"
            minLength={8}
            required
            disabled={loading}
            className="h-12 rounded-xl"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-xl text-sm font-semibold"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Daftar Sekarang
        </Button>
      </form>

      {/* Terms */}
      <p className="text-center text-xs text-muted-foreground">
        Dengan mendaftar, Anda menyetujui{' '}
        <Link href={`/${locale}/terms`} className="text-primary">
          Syarat & Ketentuan
        </Link>
      </p>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link href={`/${locale}/login`} className="font-medium text-primary">
          Masuk
        </Link>
      </p>
    </div>
  );
}
