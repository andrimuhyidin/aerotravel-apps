/**
 * License Application Form Client
 * Form to apply for Guide License
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
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
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

// Simplified schema - personal_info akan di-merge dengan existing data di API
const applicationSchema = z.object({
  personal_info: z.object({
    full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
    nik: z.string().min(1, 'NIK wajib diisi'),
    phone: z.string().min(1, 'Nomor telepon wajib diisi'),
    email: z.string().email('Email tidak valid'),
    address: z.string().optional(),
    date_of_birth: z.string().optional(),
    emergency_contact: z.string().optional(),
  }),
  documents: z.object({
    ktp: z.string().url('URL KTP tidak valid').optional().or(z.literal('')),
    skck: z.string().url('URL SKCK tidak valid').optional().or(z.literal('')),
    medical: z.string().url('URL Surat Kesehatan tidak valid').optional().or(z.literal('')),
    photo: z.string().url('URL Foto tidak valid').optional().or(z.literal('')),
    cv: z.string().url('URL CV tidak valid').optional().or(z.literal('')),
  }),
  experience: z.object({
    previous_experience: z.string().optional(),
    languages: z.array(z.string()).optional(),
    specializations: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
  }),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

type LicenseApplicationFormClientProps = {
  locale: string;
};

export function LicenseApplicationFormClient({ locale }: LicenseApplicationFormClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check eligibility and get auto-fill data
  const { data: eligibilityData, isLoading: isLoadingEligibility } = useQuery({
    queryKey: ['guide-license-eligibility'],
    queryFn: async () => {
      const res = await fetch('/api/guide/license/eligibility');
      if (!res.ok) throw new Error('Failed to check eligibility');
      return res.json();
    },
  });

  // Check existing application
  const { data: existingApp } = useQuery({
    queryKey: queryKeys.guide.license.application(),
    queryFn: async () => {
      const res = await fetch('/api/guide/license/application');
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch application');
      return res.json();
    },
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      personal_info: {
        full_name: '',
        nik: '',
        phone: '',
        email: '',
        address: '',
        date_of_birth: '',
        emergency_contact: '',
      },
      documents: {},
      experience: {
        previous_experience: '',
        languages: [],
        specializations: [],
        certifications: [],
      },
    },
  });

  // Auto-fill form when eligibility data is loaded
  React.useEffect(() => {
    if (eligibilityData?.auto_fill_data && !existingApp) {
      form.reset({
        personal_info: eligibilityData.auto_fill_data.personal_info,
        documents: eligibilityData.auto_fill_data.documents,
        experience: eligibilityData.auto_fill_data.experience,
      });
    }
  }, [eligibilityData, existingApp, form]);

  const createApplication = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      // Only send documents and optional experience fields
      // Personal info will be auto-filled from existing profile data
      const res = await fetch('/api/guide/license/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_data: {
            // Personal info tetap dikirim untuk validation, tapi akan di-merge dengan existing data
            personal_info: data.personal_info,
            documents: data.documents,
            experience: data.experience,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create application');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.license.all() });
      toast.success('Aplikasi berhasil dikirim!');
      router.push(`/${locale}/guide/license/application`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengirim aplikasi');
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      await createApplication.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking eligibility
  if (isLoadingEligibility) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
            <p className="mt-4 text-sm text-slate-500">Memeriksa kelayakan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If already has application, show status
  if (existingApp?.application) {
    const app = existingApp.application;
    const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
      pending_review: { label: 'Menunggu Review', className: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
      document_verified: { label: 'Dokumen Terverifikasi', className: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
      assessment_passed: { label: 'Assessment Lulus', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      training_completed: { label: 'Training Selesai', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      pending_approval: { label: 'Menunggu Approval', className: 'bg-amber-100 text-amber-700', icon: AlertCircle },
      approved: { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      license_issued: { label: 'License Terbit', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700', icon: AlertCircle },
    };

    const status = statusConfig[app.status] || statusConfig.pending_review;
    const StatusIcon = status?.icon || AlertCircle;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Aplikasi</CardTitle>
          <CardDescription>Anda sudah memiliki aplikasi aktif</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Application Number</p>
              <p className="text-lg font-bold">{app.application_number}</p>
            </div>
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                status?.className || 'bg-slate-100 text-slate-700'
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {status?.label || app.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-slate-500">Current Stage</p>
            <p className="text-sm font-medium">{app.current_stage}</p>
          </div>
          {app.rejection_reason && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-sm font-medium text-red-900">Alasan Penolakan:</p>
              <p className="mt-1 text-sm text-red-700">{app.rejection_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show eligibility warning if not eligible
  const isEligible = eligibilityData?.eligible === true;
  
  // If not eligible, don't show form (eligibility info already shown in LicenseEligibilityClient)
  if (!isEligible && eligibilityData) {
    return null;
  }

  // If eligible, show simplified form (only for documents upload)
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajukan Guide License</CardTitle>
        <CardDescription>
          Data profil Anda sudah lengkap. Upload dokumen yang diperlukan untuk melengkapi aplikasi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show auto-filled personal info (read-only) */}
        <div className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-700">Data Profil (Auto-filled)</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500">Nama</p>
              <p className="font-medium text-slate-900">{form.watch('personal_info.full_name') || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">NIK</p>
              <p className="font-medium text-slate-900">{form.watch('personal_info.nik') || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Phone</p>
              <p className="font-medium text-slate-900">{form.watch('personal_info.phone') || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{form.watch('personal_info.email') || '-'}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Untuk mengubah data profil, silakan edit di{' '}
            <Link href={`/${locale}/guide/profile/edit`} className="text-emerald-600 underline">
              halaman profil
            </Link>
          </p>
        </div>

        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Documents */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Dokumen Wajib</h3>
                <p className="text-sm text-slate-500">
                  Upload dokumen yang diperlukan. Gunakan fitur upload di halaman{' '}
                  <Link href={`/${locale}/guide/documents`} className="text-emerald-600 underline">
                    Documents
                  </Link>{' '}
                  atau masukkan URL jika sudah di-upload.
                </p>
              </div>

              <FormField
                control={form.control}
                name="documents.ktp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KTP (Wajib)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documents.skck"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKCK (Wajib)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documents.medical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surat Kesehatan (Wajib)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documents.photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto Formal (Wajib)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      {form.watch('documents.photo') ? (
                        <span className="text-emerald-600">✓ Foto sudah diisi</span>
                      ) : (
                        <span className="text-amber-600">
                          Foto profil akan digunakan jika tidak diisi
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documents.cv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CV/Resume (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Experience (Optional) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pengalaman & Keahlian (Opsional)</h3>
              <p className="text-sm text-slate-500">
                Informasi ini opsional dan dapat membantu mempercepat proses review aplikasi Anda.
              </p>

              <FormField
                control={form.control}
                name="experience.previous_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pengalaman Sebelumnya</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ceritakan pengalaman Anda sebagai guide..."
                        rows={4}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Ajukan License
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${locale}/guide`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Batal
                </Link>
              </Button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Data profil Anda akan otomatis digunakan untuk aplikasi ini. Pastikan semua dokumen sudah di-upload.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
