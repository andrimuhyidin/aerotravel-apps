'use client';

/**
 * Profile Edit Client Component
 * Form untuk edit nama, email, phone, avatar
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Camera, Loader2, Save, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/utils/logger';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfileClientProps = {
  locale: string;
  initialData: {
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
  };
};

export function ProfileClient({ locale, initialData }: ProfileClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData.fullName,
      email: initialData.email,
      phone: initialData.phone,
    },
  });

  const initials = initialData.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan profil');
      }

      toast.success('Profil berhasil diperbarui');
      router.push(`/${locale}/account`);
      router.refresh();
    } catch (error) {
      logger.error('Failed to update profile', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${locale}/account`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Edit Profil</h1>
          <p className="text-sm text-muted-foreground">Kelola informasi akun Anda</p>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-2xl font-bold text-white shadow-lg">
            {initialData.avatarUrl ? (
              <img
                src={initialData.avatarUrl}
                alt={initialData.fullName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white dark:bg-slate-800 dark:ring-slate-700"
            onClick={() => toast.info('Fitur upload foto akan segera hadir')}
          >
            <Camera className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Tap untuk ganti foto
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="Masukkan nama lengkap"
                      className="h-12 rounded-xl pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="email@example.com"
                    className="h-12 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Mengubah email memerlukan verifikasi ulang
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Telepon</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder="081234567890"
                    className="h-12 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl"
              disabled={isSubmitting || !form.formState.isDirty}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

