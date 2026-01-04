/**
 * Corporate Application Form
 * Client component for corporate role application
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, FileText, Loader2, Phone, Users } from 'lucide-react';
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

const corporateApplicationSchema = z.object({
  companyName: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
  companySize: z.string().min(1, 'Pilih ukuran perusahaan'),
  industry: z.string().min(2, 'Industri minimal 2 karakter'),
  contactPerson: z.string().min(3, 'Nama kontak minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon tidak valid'),
  estimatedTrips: z.string().optional(),
  message: z.string().optional(),
});

type CorporateApplicationFormData = z.infer<typeof corporateApplicationSchema>;

type CorporateApplicationFormProps = {
  locale: string;
};

export function CorporateApplicationForm({
  locale,
}: CorporateApplicationFormProps) {
  const router = useRouter();
  const applyRole = useApplyRole();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CorporateApplicationFormData>({
    resolver: zodResolver(corporateApplicationSchema),
    defaultValues: {
      companyName: '',
      companySize: '',
      industry: '',
      contactPerson: '',
      email: '',
      phone: '',
      estimatedTrips: '',
      message: '',
    },
  });

  const onSubmit = async (data: CorporateApplicationFormData) => {
    setIsSubmitting(true);

    try {
      // Apply for corporate role
      await applyRole.mutateAsync({
        role: 'corporate',
        message: `Perusahaan: ${data.companyName}\nUkuran: ${data.companySize}\nIndustri: ${data.industry}\nKontak: ${data.contactPerson}\nEmail: ${data.email}\nPhone: ${data.phone}\nEstimasi Trip: ${data.estimatedTrips || 'Tidak disebutkan'}\n${data.message ? `Pesan: ${data.message}` : ''}`,
      });

      // Show success message
      toast.success(
        'Aplikasi berhasil dikirim! Tim kami akan menghubungi Anda untuk diskusi lebih lanjut.'
      );

      // Redirect to corporate page after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/corporate`);
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
        <CardTitle>Formulir Aplikasi Corporate</CardTitle>
        <CardDescription>
          Lengkapi informasi perusahaan di bawah ini untuk program corporate
          travel
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
                  CorporateApplicationFormData,
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
                      placeholder="PT. Contoh Perusahaan"
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
              name="companySize"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  CorporateApplicationFormData,
                  'companySize'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Ukuran Perusahaan
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: 50-100 karyawan"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Perkiraan jumlah karyawan di perusahaan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  CorporateApplicationFormData,
                  'industry'
                >;
              }) => (
                <FormItem>
                  <FormLabel>Industri</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Teknologi, Konsultan, dll"
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
                  CorporateApplicationFormData,
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  CorporateApplicationFormData,
                  'email'
                >;
              }) => (
                <FormItem>
                  <FormLabel>Email Perusahaan</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@company.com"
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
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  CorporateApplicationFormData,
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
              name="estimatedTrips"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  CorporateApplicationFormData,
                  'estimatedTrips'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Estimasi Trip per Bulan (Opsional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Contoh: 10"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Perkiraan jumlah trip per bulan untuk kebutuhan perusahaan
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
                  CorporateApplicationFormData,
                  'message'
                >;
              }) => (
                <FormItem>
                  <FormLabel>Pesan Tambahan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Pesan atau informasi tambahan tentang kebutuhan corporate travel perusahaan Anda"
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
