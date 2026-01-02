'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, FileText, Loader2, Save, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import queryKeys from '@/lib/queries/query-keys';

// Zod schema
const createLicenseSchema = z.object({
  licenseType: z.enum(['nib', 'skdn', 'sisupar', 'tdup', 'asita', 'chse'], {
    required_error: 'Pilih jenis izin',
  }),
  licenseNumber: z.string().min(1, 'Nomor izin wajib diisi').max(100),
  licenseName: z.string().min(1, 'Nama izin wajib diisi').max(200),
  issuedBy: z.string().min(1, 'Penerbit izin wajib diisi').max(200),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid').nullable().optional(),
  documentUrl: z.string().url('URL tidak valid').nullable().optional().or(z.literal('')),
  notes: z.string().max(1000).nullable().optional(),
  // ASITA-specific fields
  asitaDetails: z.object({
    nia: z.string().min(1, 'NIA wajib diisi').max(50),
    membershipType: z.enum(['regular', 'premium', 'corporate'], {
      required_error: 'Pilih tipe keanggotaan',
    }),
    dpdRegion: z.string().max(100).nullable().optional(),
    memberSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  }).optional(),
});

type CreateLicensePayload = z.infer<typeof createLicenseSchema>;

const licenseTypes = [
  { value: 'nib', label: 'NIB - Nomor Induk Berusaha', description: 'Izin berusaha dari OSS' },
  { value: 'skdn', label: 'SKDN - Surat Keterangan Domisili Niaga', description: 'Surat keterangan domisili usaha' },
  { value: 'sisupar', label: 'SISUPAR - Sistem Informasi Usaha Pariwisata', description: 'Pendaftaran di sistem pariwisata' },
  { value: 'tdup', label: 'TDUP - Tanda Daftar Usaha Pariwisata', description: 'Tanda daftar usaha pariwisata' },
  { value: 'asita', label: 'ASITA - Keanggotaan ASITA', description: 'Keanggotaan asosiasi travel agent' },
  { value: 'chse', label: 'CHSE - Sertifikasi CHSE', description: 'Sertifikat Cleanliness, Health, Safety, Environment' },
];

const membershipTypes = [
  { value: 'regular', label: 'Regular' },
  { value: 'premium', label: 'Premium' },
  { value: 'corporate', label: 'Corporate' },
];

async function createLicense(data: CreateLicensePayload): Promise<{ id: string }> {
  const response = await fetch('/api/admin/compliance/licenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      documentUrl: data.documentUrl || null,
      expiryDate: data.expiryDate || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Gagal membuat izin');
  }

  return response.json();
}

export function CreateLicenseClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const preselectedType = searchParams.get('type');

  const form = useForm<CreateLicensePayload>({
    resolver: zodResolver(createLicenseSchema),
    defaultValues: {
      licenseType: (preselectedType as CreateLicensePayload['licenseType']) || undefined,
      licenseNumber: '',
      licenseName: '',
      issuedBy: '',
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      documentUrl: '',
      notes: '',
      asitaDetails: undefined,
    },
  });

  const selectedType = form.watch('licenseType');

  // Reset ASITA details when type changes
  useEffect(() => {
    if (selectedType !== 'asita') {
      form.setValue('asitaDetails', undefined);
    } else if (!form.getValues('asitaDetails')) {
      form.setValue('asitaDetails', {
        nia: '',
        membershipType: 'regular',
        dpdRegion: '',
        memberSince: new Date().toISOString().split('T')[0],
      });
    }
  }, [selectedType, form]);

  const createMutation = useMutation({
    mutationFn: createLicense,
    onSuccess: (data) => {
      toast.success('Izin berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.compliance.licenses._def });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.compliance.dashboard() });
      router.push(`/console/compliance/licenses/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan izin');
    },
  });

  const onSubmit = (data: CreateLicensePayload) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/console/compliance/licenses">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Izin Usaha</h1>
          <p className="text-muted-foreground">
            Tambahkan izin usaha baru ke dalam sistem
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* License Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Jenis Izin
              </CardTitle>
              <CardDescription>
                Pilih jenis izin yang akan didaftarkan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="licenseType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {licenseTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => field.onChange(type.value)}
                            className={`p-4 rounded-lg border text-left transition-all ${
                              field.value === type.value
                                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <p className="font-medium">{type.label.split(' - ')[0]}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {type.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* License Details */}
          {selectedType && (
            <Card>
              <CardHeader>
                <CardTitle>Detail Izin</CardTitle>
                <CardDescription>
                  Isi informasi detail tentang izin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="licenseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Izin *</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: NIB PT. MyAeroTravel Indonesia" {...field} />
                        </FormControl>
                        <FormDescription>
                          Nama lengkap izin sesuai dokumen
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Izin *</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: 1234567890123" {...field} />
                        </FormControl>
                        <FormDescription>
                          Nomor registrasi izin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="issuedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penerbit *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Kementerian Investasi/BKPM" {...field} />
                      </FormControl>
                      <FormDescription>
                        Instansi yang menerbitkan izin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="issuedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Terbit *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Expired</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="date" 
                              className="pl-10" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Kosongkan jika izin bersifat permanen
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="documentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Dokumen</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="url" 
                            placeholder="https://storage.example.com/documents/license.pdf" 
                            className="pl-10"
                            {...field}
                            value={field.value || ''}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Link ke file dokumen (PDF/Image) yang sudah diupload
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Catatan tambahan tentang izin ini..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* ASITA-specific Fields */}
          {selectedType === 'asita' && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Detail Keanggotaan ASITA
                </CardTitle>
                <CardDescription>
                  Informasi spesifik keanggotaan ASITA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="asitaDetails.nia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Induk Anggota (NIA) *</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: ASITA/2024/12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="asitaDetails.membershipType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Keanggotaan *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {membershipTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="asitaDetails.dpdRegion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DPD ASITA</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contoh: DPD ASITA Lampung" 
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Dewan Pimpinan Daerah ASITA
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="asitaDetails.memberSince"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anggota Sejak *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
          {selectedType && (
            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/console/compliance/licenses">Batal</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Izin
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}

