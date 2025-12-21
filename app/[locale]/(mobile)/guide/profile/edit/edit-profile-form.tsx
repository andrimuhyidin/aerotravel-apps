'use client';

/**
 * Edit Profile Form Component
 * Form untuk mengubah profil guide dengan validation menggunakan React Hook Form
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Camera, Loader2, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeInput, sanitizePhone } from '@/lib/utils/sanitize';
import type { EmploymentStatus } from '@/types/guide';

// Validation schema
// Note: hire_date and employment_status are company-managed fields, not in validation
const profileFormSchema = z.object({
  name: z.string().min(3, 'Nama harus antara 3-200 karakter').max(200, 'Nama harus antara 3-200 karakter'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || sanitizePhone(val) !== null,
      'Nomor telepon tidak valid. Format: 08xxxxxxxxxx atau +628xxxxxxxxxx'
    ),
  nik: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        // Must be 16 digits
        if (val.length !== 16 || !/^\d+$/.test(val)) return false;
        // Basic NIK format validation: First 6 digits should be valid date (YYMMDD)
        const datePart = val.substring(0, 6);
        const year = parseInt(datePart.substring(0, 2), 10);
        const month = parseInt(datePart.substring(2, 4), 10);
        const day = parseInt(datePart.substring(4, 6), 10);
        // Validate month (1-12) and day (1-31) - basic check
        if (month < 1 || month > 12 || day < 1 || day > 31) return false;
        return true;
      },
      'NIK harus berupa 16 digit angka dengan format valid. Contoh: 3201010101010001 (YYMMDD-XXXX-XXXX-XXXX)'
    ),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
  // home_address removed - redundant with address for guides
  // employee_number, hire_date, employment_status, supervisor_id are company-managed
  // Not editable by guide, not in validation schema
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

type EditProfileFormProps = {
  locale: string;
  initialData: {
    name: string;
    phone: string;
    email: string;
    nik?: string;
    address?: string;
    avatar_url?: string;
    // home_address removed - redundant with address for guides
    // Company-managed fields (read-only, for display only)
    employee_number?: string;
    hire_date?: string;
    employment_status?: EmploymentStatus | null;
    supervisor_id?: string | null;
  };
};

export function EditProfileForm({ locale: _locale, initialData }: EditProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialData.avatar_url);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone || '',
      nik: initialData.nik || '',
      address: initialData.address || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await fetch('/api/guide/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    },
    onError: (err: Error) => {
      setError(err.message || 'Gagal menyimpan perubahan');
      setSuccess(false);
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    setError(null);
    setSuccess(false);
    updateMutation.mutate(data);
  };

  const isLoading = updateMutation.isPending;

  // Avatar upload mutation
  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/guide/profile/avatar/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to upload avatar' }));
        throw new Error(errorData.error || 'Failed to upload avatar');
      }

      return res.json();
    },
    onSuccess: (data) => {
      setAvatarUrl(data.avatar_url);
      setAvatarPreview(null);
      setIsUploadingAvatar(false);
      router.refresh();
    },
    onError: (err: Error) => {
      setError(err.message || 'Gagal mengupload foto profil');
      setIsUploadingAvatar(false);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, dll)');
      return;
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    setIsUploadingAvatar(true);
    setError(null);
    avatarUploadMutation.mutate(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" suppressHydrationWarning>
        {error && (
          <div
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 flex items-center justify-between"
            role="alert"
            aria-live="polite"
          >
            <span>Profil berhasil diperbarui!</span>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Tutup pesan sukses"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Avatar Upload Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Foto Profil</Label>
          <div className="flex items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative flex-shrink-0">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-300 ring-2 ring-emerald-500/20">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-emerald-600" />
                )}
              </div>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isUploadingAvatar}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar || isLoading}
                className="w-full"
              >
                <Camera className="mr-2 h-4 w-4" />
                {isUploadingAvatar ? 'Mengupload...' : avatarUrl ? 'Ganti Foto' : 'Upload Foto'}
              </Button>
              <p className="mt-1 text-xs text-slate-500">
                Format: JPG, PNG. Maksimal 5MB
              </p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="name" className="text-sm font-medium text-slate-700">
                Nama Lengkap
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    className="pl-9"
                    placeholder="Masukkan nama lengkap"
                    required
                    disabled={isLoading}
                    aria-label="Nama lengkap"
                    aria-describedby="name-description"
                    aria-invalid={form.formState.errors.name ? 'true' : 'false'}
                  />
                </div>
              </FormControl>
              <FormDescription id="name-description" className="sr-only">
                Masukkan nama lengkap Anda
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="phone" className="text-sm font-medium text-slate-700">
                No. Telepon
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  disabled={isLoading}
                  aria-label="Nomor telepon"
                  aria-describedby="phone-description"
                  aria-invalid={form.formState.errors.phone ? 'true' : 'false'}
                />
              </FormControl>
              <FormDescription id="phone-description" className="sr-only">
                Format: 08xxxxxxxxxx atau +628xxxxxxxxxx
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nik"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="nik" className="text-sm font-medium text-slate-700">
                NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="nik"
                  type="text"
                  placeholder="16 digit NIK"
                  maxLength={16}
                  disabled={isLoading}
                  aria-label="NIK"
                  aria-describedby="nik-description nik-help"
                  aria-invalid={form.formState.errors.nik ? 'true' : 'false'}
                />
              </FormControl>
              <FormDescription id="nik-description" className="sr-only">
                Nomor Induk Kependudukan 16 digit
              </FormDescription>
              <p id="nik-help" className="text-xs text-slate-500">
                Diperlukan untuk Guide License
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="address" className="text-sm font-medium text-slate-700">
                Alamat Lengkap
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  id="address"
                  placeholder="Alamat lengkap tempat tinggal"
                  disabled={isLoading}
                  rows={3}
                  aria-label="Alamat lengkap"
                  aria-describedby="address-description address-help"
                  aria-invalid={form.formState.errors.address ? 'true' : 'false'}
                />
              </FormControl>
              <FormDescription id="address-description" className="sr-only">
                Alamat lengkap tempat tinggal Anda
              </FormDescription>
              <p id="address-help" className="text-xs text-slate-500">
                Alamat lengkap tempat tinggal Anda
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={initialData.email}
            disabled
            className="bg-slate-50 text-slate-500"
            aria-label="Email (tidak dapat diubah)"
          />
          <p className="text-xs text-slate-500">Email tidak dapat diubah</p>
        </div>

        {/* Employee Information Section */}
        <div className="border-t border-slate-200 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Informasi Karyawan</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_number" className="text-sm font-medium text-slate-700">
                Nomor Karyawan
              </Label>
              <Input
                id="employee_number"
                type="text"
                value={initialData.employee_number || ''}
                disabled
                className="bg-slate-50 text-slate-500"
                placeholder="Akan di-generate otomatis saat kontrak ditandatangani"
                aria-label="Nomor karyawan (hanya baca)"
              />
              <p className="text-xs text-slate-500">
                Nomor karyawan di-generate otomatis oleh sistem saat kontrak master ditandatangani. Hubungi admin untuk perubahan.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date" className="text-sm font-medium text-slate-700">
                Tanggal Mulai Bekerja
              </Label>
              <Input
                id="hire_date"
                type="date"
                value={initialData.hire_date || ''}
                disabled
                className="bg-slate-50 text-slate-500"
                placeholder="Diatur oleh perusahaan"
                aria-label="Tanggal mulai bekerja (hanya baca)"
              />
              <p className="text-xs text-slate-500">
                Tanggal mulai bekerja diatur oleh perusahaan berdasarkan kontrak. Hubungi admin untuk perubahan.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_status" className="text-sm font-medium text-slate-700">
                Status Karyawan
              </Label>
              <Input
                id="employment_status"
                type="text"
                value={
                  initialData.employment_status === 'active'
                    ? 'Aktif'
                    : initialData.employment_status === 'inactive'
                      ? 'Tidak Aktif'
                      : initialData.employment_status === 'on_leave'
                        ? 'Cuti'
                        : initialData.employment_status === 'terminated'
                          ? 'Dihentikan'
                          : 'Belum ditetapkan'
                }
                disabled
                className="bg-slate-50 text-slate-500"
                aria-label="Status karyawan (hanya baca)"
              />
              <p className="text-xs text-slate-500">
                Status karyawan diatur oleh perusahaan. Hubungi admin untuk perubahan.
              </p>
            </div>

            {initialData.supervisor_id && (
              <div className="space-y-2">
                <Label htmlFor="supervisor" className="text-sm font-medium text-slate-700">
                  Supervisor
                </Label>
                <Input
                  id="supervisor"
                  type="text"
                  value="Ditentukan oleh perusahaan"
                  disabled
                  className="bg-slate-50 text-slate-500"
                  aria-label="Supervisor (hanya baca)"
                />
                <p className="text-xs text-slate-500">
                  Supervisor ditetapkan oleh perusahaan. Hubungi admin untuk informasi lebih lanjut.
                </p>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
          disabled={isLoading || success}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : success ? (
            'Tersimpan!'
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </form>
    </Form>
  );
}
