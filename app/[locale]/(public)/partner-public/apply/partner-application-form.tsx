/**
 * Partner Application Form
 * Client component for partner (mitra) role application
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, FileText, Loader2, MapPin, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { useForm } from 'react-hook-form';
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

const partnerApplicationSchema = z.object({
  companyName: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
  companyAddress: z.string().min(10, 'Alamat perusahaan minimal 10 karakter'),
  npwp: z.string().min(15, 'NPWP tidak valid').max(15, 'NPWP tidak valid'),
  phone: z.string().min(10, 'Nomor telepon tidak valid'),
  contactPerson: z.string().min(3, 'Nama kontak minimal 3 karakter'),
  message: z.string().optional(),
});

type PartnerApplicationFormData = z.infer<typeof partnerApplicationSchema>;

type PartnerApplicationFormProps = {
  locale: string;
};

export function PartnerApplicationForm({
  locale,
}: PartnerApplicationFormProps) {
  const router = useRouter();
  const applyRole = useApplyRole();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerApplicationFormData>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: {
      companyName: '',
      companyAddress: '',
      npwp: '',
      phone: '',
      contactPerson: '',
      message: '',
    },
  });

  const onSubmit = async (data: PartnerApplicationFormData) => {
    setIsSubmitting(true);

    try {
      // Apply for mitra role
      await applyRole.mutateAsync({
        role: 'mitra',
        message: `Perusahaan: ${data.companyName}\nAlamat: ${data.companyAddress}\nNPWP: ${data.npwp}\nPhone: ${data.phone}\nKontak: ${data.contactPerson}\n${data.message ? `Pesan: ${data.message}` : ''}`,
      });

      // Show success message
      toast.success(
        'Aplikasi berhasil dikirim! Tim kami akan menghubungi Anda untuk proses selanjutnya.'
      );

      // Redirect to mitra page after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/partner/dashboard`);
      }, 2000);
    } catch (_error) {
      // Error is handled by the hook
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulir Aplikasi Mitra</CardTitle>
        <CardDescription>
          Lengkapi informasi perusahaan di bawah ini untuk mendaftar sebagai
          mitra B2B
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'companyName'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Nama Perusahaan
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PT. Contoh Travel"
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
              name="companyAddress"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'companyAddress'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Alamat Perusahaan
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                      rows={3}
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
              name="npwp"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'npwp'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    NPWP
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12.345.678.9-012.345"
                      maxLength={15}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>NPWP perusahaan (15 digit)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'phone'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'contactPerson'
                >;
              }) => (
                <FormItem>
                  <FormLabel>Nama Kontak Person</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama lengkap kontak person"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Nama orang yang dapat dihubungi untuk keperluan kerjasama
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'message'
                >;
              }) => (
                <FormItem>
                  <FormLabel>Pesan Tambahan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Pesan atau informasi tambahan tentang perusahaan Anda"
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
              <Button type="submit" disabled={isSubmitting} className="flex-1">
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
