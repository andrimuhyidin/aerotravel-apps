/**
 * Guide Application Form
 * Client component for guide role application
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, FileText, Loader2, MapPin, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ControllerRenderProps } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApplyRole } from '@/hooks/use-roles';

const guideApplicationSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  phone: z.string().min(10, 'Nomor telepon tidak valid'),
  nik: z.string().min(16, 'NIK harus 16 digit').max(16, 'NIK harus 16 digit'),
  experience: z
    .string()
    .min(10, 'Ceritakan pengalaman Anda minimal 10 karakter'),
  message: z.string().optional(),
});

type GuideApplicationFormData = z.infer<typeof guideApplicationSchema>;

type GuideApplicationFormProps = {
  locale: string;
};

export function GuideApplicationForm({ locale }: GuideApplicationFormProps) {
  const router = useRouter();
  const applyRole = useApplyRole();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GuideApplicationFormData>({
    resolver: zodResolver(guideApplicationSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      nik: '',
      experience: '',
      message: '',
    },
  });

  const onSubmit = async (data: GuideApplicationFormData) => {
    setIsSubmitting(true);

    try {
      // Apply for guide role
      await applyRole.mutateAsync({
        role: 'guide',
        message: `Nama: ${data.fullName}\nPhone: ${data.phone}\nNIK: ${data.nik}\nPengalaman: ${data.experience}\n${data.message ? `Pesan: ${data.message}` : ''}`,
      });

      // Show success message
      toast.success(
        'Aplikasi berhasil dikirim! Tim kami akan meninjau aplikasi Anda.'
      );

      // Redirect to guide page after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/guide`);
      }, 2000);
    } catch (error) {
      // Error is handled by the hook
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulir Aplikasi Guide</CardTitle>
        <CardDescription>
          Lengkapi informasi di bawah ini untuk mendaftar sebagai guide
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nama Lengkap
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan nama lengkap"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }: { field: ControllerRenderProps<GuideApplicationFormData, 'phone'> }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Nomor Telepon
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="081234567890"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Nomor telepon yang dapat dihubungi
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nik"
              render={({ field }: { field: ControllerRenderProps<GuideApplicationFormData, 'nik'> }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    NIK (Nomor Induk Kependudukan)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="3201010101010001"
                      maxLength={16}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>NIK 16 digit sesuai KTP</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }: { field: ControllerRenderProps<GuideApplicationFormData, 'experience'> }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Pengalaman sebagai Guide
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ceritakan pengalaman Anda sebagai guide, destinasi yang pernah dikunjungi, bahasa yang dikuasai, dll."
                      rows={5}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimal 10 karakter. Ceritakan pengalaman dan keahlian Anda
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }: { field: ControllerRenderProps<GuideApplicationFormData, 'message'> }) => (
                <FormItem>
                  <FormLabel>Pesan Tambahan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Pesan atau informasi tambahan yang ingin disampaikan"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Aplikasi'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Batal
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

