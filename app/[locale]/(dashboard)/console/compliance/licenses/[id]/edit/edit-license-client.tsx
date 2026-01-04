/**
 * Edit License Client Component
 * Form for editing license details
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import queryKeys from '@/lib/queries/query-keys';

const updateLicenseSchema = z.object({
  licenseNumber: z.string().min(1, 'Nomor izin wajib diisi').max(100).optional(),
  licenseName: z.string().min(1, 'Nama izin wajib diisi').max(200).optional(),
  issuedBy: z.string().min(1, 'Penerbit izin wajib diisi').max(200).optional(),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid').optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid').nullable().optional(),
  documentUrl: z.string().url('URL tidak valid').nullable().optional().or(z.literal('')),
  notes: z.string().max(1000).nullable().optional(),
  status: z.enum(['valid', 'warning', 'critical', 'expired', 'suspended']).optional(),
  // ASITA-specific fields
  asitaDetails: z.object({
    nia: z.string().min(1, 'NIA wajib diisi').max(50),
    membershipType: z.enum(['regular', 'premium', 'corporate']),
    dpdRegion: z.string().max(100).nullable().optional(),
    memberSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  }).optional(),
});

type UpdateLicensePayload = z.infer<typeof updateLicenseSchema>;

type LicenseDetail = {
  id: string;
  licenseType: string;
  licenseNumber: string;
  licenseName: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string | null;
  status: string;
  documentUrl: string | null;
  notes: string | null;
  asitaDetails: {
    id: string;
    nia: string;
    membershipType: string;
    dpdRegion: string | null;
    memberSince: string;
  } | null;
};

type EditLicenseClientProps = {
  licenseId: string;
  locale: string;
};

const statusOptions = [
  { value: 'valid', label: 'Valid' },
  { value: 'warning', label: 'Warning (30 hari)' },
  { value: 'critical', label: 'Critical (7 hari)' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
];

const membershipTypes = [
  { value: 'regular', label: 'Regular' },
  { value: 'premium', label: 'Premium' },
  { value: 'corporate', label: 'Corporate' },
];

async function fetchLicenseDetail(id: string): Promise<LicenseDetail> {
  const response = await fetch(`/api/admin/compliance/licenses/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch license details');
  }
  return response.json();
}

async function updateLicense(id: string, data: UpdateLicensePayload): Promise<void> {
  const response = await fetch(`/api/admin/compliance/licenses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      documentUrl: data.documentUrl || null,
      expiryDate: data.expiryDate || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Gagal memperbarui izin');
  }
}

export function EditLicenseClient({ licenseId, locale }: EditLicenseClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: license,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.admin.compliance.license(licenseId),
    queryFn: () => fetchLicenseDetail(licenseId),
  });

  const form = useForm<UpdateLicensePayload>({
    resolver: zodResolver(updateLicenseSchema),
    defaultValues: {
      licenseNumber: '',
      licenseName: '',
      issuedBy: '',
      issuedDate: '',
      expiryDate: '',
      documentUrl: '',
      notes: '',
      status: 'valid',
      asitaDetails: undefined,
    },
  });

  // Update form when license data is loaded
  useEffect(() => {
    if (license) {
      form.reset({
        licenseNumber: license.licenseNumber,
        licenseName: license.licenseName,
        issuedBy: license.issuedBy,
        issuedDate: license.issuedDate,
        expiryDate: license.expiryDate || '',
        documentUrl: license.documentUrl || '',
        notes: license.notes || '',
        status: license.status as UpdateLicensePayload['status'],
        asitaDetails: license.asitaDetails ? {
          nia: license.asitaDetails.nia,
          membershipType: license.asitaDetails.membershipType as 'regular' | 'premium' | 'corporate',
          dpdRegion: license.asitaDetails.dpdRegion || '',
          memberSince: license.asitaDetails.memberSince,
        } : undefined,
      });
    }
  }, [license, form]);

  const selectedType = license?.licenseType;
  const isAsita = selectedType === 'asita';

  // Handle ASITA details visibility
  useEffect(() => {
    if (isAsita && !form.getValues('asitaDetails') && license?.asitaDetails) {
      form.setValue('asitaDetails', {
        nia: license.asitaDetails.nia,
        membershipType: license.asitaDetails.membershipType as 'regular' | 'premium' | 'corporate',
        dpdRegion: license.asitaDetails.dpdRegion || '',
        memberSince: license.asitaDetails.memberSince,
      });
    } else if (!isAsita) {
      form.setValue('asitaDetails', undefined);
    }
  }, [isAsita, license, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLicensePayload) => updateLicense(licenseId, data),
    onSuccess: () => {
      toast.success('Izin berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.compliance.license(licenseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.compliance.licenses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.compliance.dashboard() });
      router.push(`/${locale}/console/compliance/licenses/${licenseId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui izin');
    },
  });

  const onSubmit = (data: UpdateLicensePayload) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !license) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading license</p>
            <Button asChild>
              <Link href={`/${locale}/console/compliance/licenses`}>
                Back to Licenses
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/console/compliance/licenses/${licenseId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit License</h1>
          <p className="text-muted-foreground">
            {license.licenseNumber}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Read-only Info */}
              <Card>
                <CardHeader>
                  <CardTitle>License Information</CardTitle>
                  <CardDescription>
                    Information that cannot be changed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      License Type
                    </label>
                    <p className="text-sm">{license.licenseType}</p>
                  </div>
                </CardContent>
              </Card>

              {/* License Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    License Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="NIB Perusahaan" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issuedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issued By *</FormLabel>
                        <FormControl>
                          <Input placeholder="Dinas Pariwisata" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="issuedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issued Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                            />
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
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty for perpetual licenses
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
                        <FormLabel>Document URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/document.pdf"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes..."
                            rows={4}
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

              {/* ASITA Details */}
              {isAsita && (
                <Card>
                  <CardHeader>
                    <CardTitle>ASITA Membership Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="asitaDetails.nia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIA (Nomor Induk Anggota) *</FormLabel>
                          <FormControl>
                            <Input placeholder="NIA123456" {...field} value={field.value || ''} />
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
                          <FormLabel>Membership Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
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

                    <FormField
                      control={form.control}
                      name="asitaDetails.dpdRegion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DPD Region</FormLabel>
                          <FormControl>
                            <Input placeholder="DPD Jawa Timur" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="asitaDetails.memberSince"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Member Since *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
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
            </div>

            {/* Sidebar - Actions */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

