'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/actions/auth';

type Props = {
  locale: string;
};

export function ForgotPasswordForm({ locale }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await resetPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Email Terkirim!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cek inbox email Anda untuk link reset password
          </p>
        </div>
        <Link href={`/${locale}/login`}>
          <Button variant="outline" className="h-12 w-full rounded-xl">
            Kembali ke Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
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
          disabled={isPending}
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
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Kirim Link Reset
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ingat password?{' '}
        <Link href={`/${locale}/login`} className="font-medium text-primary">
          Masuk
        </Link>
      </p>
    </form>
  );
}
