'use client';

/**
 * Console: Create Contract Client
 * Form untuk membuat kontrak baru
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/utils/logger';

const contractFormSchema = z.object({
  guide_id: z.string().uuid('Pilih guide'),
  contract_type: z.enum(['annual']).default('annual'), // Only annual master contracts
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().optional(),
  start_date: z.string().date('Tanggal mulai tidak valid'),
  end_date: z.string().date().nullable().optional(), // Auto-calculated if not provided
  fee_amount: z.number().positive('Fee harus lebih dari 0').optional().nullable(), // Always optional (fee in trip_guides)
  fee_type: z.enum(['per_trip']).default('per_trip'), // Always per_trip for master contracts
  payment_terms: z.string().optional(),
  auto_send: z.boolean().default(false),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

type CreateContractClientProps = {
  locale: string;
};

export function CreateContractClient({ locale }: CreateContractClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContractFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contractFormSchema) as any,
    defaultValues: {
      contract_type: 'annual', // Only annual master contracts
      fee_type: 'per_trip', // Always per_trip (fee in trip_guides)
      auto_send: false,
    },
  });

  // Fetch guides list
  const { data: guidesData } = useQuery<{ guides: Array<{ id: string; full_name: string | null; email: string | null }> }>({
    queryKey: ['admin', 'guides', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/admin/guides');
      if (!res.ok) return { guides: [] };
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContractFormValues) => {
      const res = await fetch('/api/admin/guide/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal membuat kontrak');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts'] });
      toast.success('Kontrak berhasil dibuat');
      router.push(`/${locale}/console/guide/contracts/${data.contract.id}`);
    },
    onError: (error) => {
      logger.error('Failed to create contract', error);
      toast.error(error instanceof Error ? error.message : 'Gagal membuat kontrak');
    },
  });

  const onSubmit: SubmitHandler<ContractFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const guides = guidesData?.guides ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/console/guide/contracts`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Buat Kontrak Baru</h1>
          <p className="mt-1 text-sm text-slate-600">Buat kontrak kerja untuk guide</p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Informasi Kontrak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Guide Selection */}
              <FormField
                control={form.control}
                name="guide_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guide *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih guide" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guides.map((guide) => (
                          <SelectItem key={guide.id} value={guide.id}>
                            {guide.full_name || guide.email || guide.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contract Type */}
              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kontrak *</FormLabel>
                      <Input
                        value="Tahunan (Master Contract)"
                        disabled
                        className="bg-muted"
                      />
                      <FormDescription>
                        Semua kontrak adalah master contract tahunan yang berlaku untuk semua trip dalam periode 1 tahun
                      </FormDescription>
                      <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Kontrak *</FormLabel>
                    <FormControl>
                      <Input placeholder="Kontrak Trip..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi kontrak..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Mulai *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Berakhir</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                        <FormDescription>Kosongkan - fee ditentukan per trip assignment (di trip_guides.fee_amount)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fee */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fee_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Fee *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="per_trip">Per Trip Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fee_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Fee *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="300000"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Terms */}
              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Syarat Pembayaran</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Dibayar setelah trip selesai..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auto Send */}
              <FormField
                control={form.control}
                name="auto_send"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Kirim Otomatis ke Guide</FormLabel>
                      <FormDescription>
                        Kontrak akan langsung dikirim ke guide setelah dibuat
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href={`/${locale}/console/guide/contracts`}>
              <Button variant="outline" type="button">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isSubmitting || createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : form.watch('auto_send') ? (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Buat & Kirim
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Draft
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
