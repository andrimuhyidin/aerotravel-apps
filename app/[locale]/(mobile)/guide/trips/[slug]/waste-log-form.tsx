'use client';

/**
 * Waste Log Form Component
 * Reusable form component untuk waste logging
 * Dapat digunakan di section atau modal
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { extractEXIFFromFile } from '@/lib/utils/exif-extractor';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type WasteLogFormProps = {
  tripId: string;
  locale: string;
  onSuccess?: () => void;
};

type WasteLogFormData = {
  waste_type: 'plastic' | 'organic' | 'glass' | 'hazmat' | '';
  quantity: string;
  unit: 'kg' | 'pieces';
  disposal_method: 'landfill' | 'recycling' | 'incineration' | 'ocean' | '';
  notes: string;
  photos: File[];
};

type WasteTypeOption = {
  value: string;
  label: string;
  description?: string;
};

type DisposalMethodOption = {
  value: string;
  label: string;
  description?: string;
};

export function WasteLogForm({ tripId, locale: _locale, onSuccess }: WasteLogFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WasteLogFormData>({
    waste_type: '',
    quantity: '',
    unit: 'kg',
    disposal_method: '',
    notes: '',
    photos: [],
  });
  const [uploading, setUploading] = useState(false);

  // Fetch waste types from API
  const { data: wasteTypesData, isLoading: wasteTypesLoading } = useQuery<{ data: { wasteTypes: WasteTypeOption[] } }>({
    queryKey: queryKeys.guide.wasteTypes(),
    queryFn: async () => {
      const res = await fetch('/api/guide/waste-types');
      if (!res.ok) throw new Error('Failed to fetch waste types');
      return res.json();
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch disposal methods from API
  const { data: disposalMethodsData, isLoading: disposalMethodsLoading } = useQuery<{ data: { disposalMethods: DisposalMethodOption[] } }>({
    queryKey: queryKeys.guide.disposalMethods(),
    queryFn: async () => {
      const res = await fetch('/api/guide/disposal-methods');
      if (!res.ok) throw new Error('Failed to fetch disposal methods');
      return res.json();
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  const WASTE_TYPES = wasteTypesData?.data?.wasteTypes || [];
  const DISPOSAL_METHODS = disposalMethodsData?.data?.disposalMethods || [];

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'waste');
      formData.append('tripId', tripId);

      // Extract EXIF data
      const exifData = await extractEXIFFromFile(file);
      if (exifData?.latitude && exifData?.longitude) {
        formData.append('latitude', exifData.latitude.toString());
        formData.append('longitude', exifData.longitude.toString());
      }
      if (exifData?.timestamp) {
        formData.append('timestamp', exifData.timestamp);
      }

      const res = await fetch('/api/guide/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload photo');
      }

      const data = await res.json();
      return data.photo_url;
    },
  });

  // Create waste log mutation
  const createWasteLogMutation = useMutation({
    mutationFn: async (payload: {
      waste_type: string;
      quantity: number;
      unit: string;
      disposal_method: string;
      notes?: string;
      photos?: Array<{
        photo_url: string;
        photo_gps: { latitude: number; longitude: number; accuracy?: number } | null;
        captured_at: string;
      }>;
    }) => {
      const res = await fetch(`/api/guide/trips/${tripId}/waste-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        // Display detailed validation errors if available
        if (error.details && Array.isArray(error.details)) {
          const errorMessages = error.details.map((e: { message: string }) => e.message).join(', ');
          throw new Error(errorMessages || error.error || 'Gagal membuat waste log');
        }
        throw new Error(error.error || 'Gagal membuat waste log');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.trips.wasteLog(tripId) });
      toast.success('Waste log berhasil dibuat');
      setForm({
        waste_type: '',
        quantity: '',
        unit: 'kg',
        disposal_method: '',
        notes: '',
        photos: [],
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      logger.error('Failed to create waste log', error);
      toast.error(error.message || 'Gagal membuat waste log');
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const handleRemovePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.waste_type || !form.quantity || !form.disposal_method) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    const quantity = parseFloat(form.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Quantity harus lebih dari 0');
      return;
    }

    setUploading(true);

    try {
      // Upload photos first and collect GPS data
      const photosWithGPS: Array<{
        photo_url: string;
        photo_gps: { latitude: number; longitude: number; accuracy?: number } | null;
        captured_at: string;
      }> = [];
      
      for (const photo of form.photos) {
        try {
          // Extract EXIF data from file
          const exifData = await extractEXIFFromFile(photo);
          
          // Upload photo
          const photoUrl = await uploadPhotoMutation.mutateAsync(photo);
          
          // Store photo with GPS data if available
          photosWithGPS.push({
            photo_url: photoUrl,
            photo_gps: exifData?.latitude && exifData?.longitude ? {
              latitude: exifData.latitude,
              longitude: exifData.longitude,
              accuracy: exifData.accuracy || undefined,
            } : null,
            captured_at: exifData?.timestamp || new Date().toISOString(),
          });
        } catch (error) {
          logger.warn('Failed to upload photo', { error });
          toast.warning(`Gagal upload salah satu foto, melanjutkan...`);
        }
      }

      // Create waste log with photos and GPS data
      await createWasteLogMutation.mutateAsync({
        waste_type: form.waste_type,
        quantity,
        unit: form.unit,
        disposal_method: form.disposal_method,
        notes: form.notes || undefined,
        photos: photosWithGPS.length > 0 ? photosWithGPS : undefined,
      });
    } catch (error) {
      logger.error('Failed to submit waste log', error);
    } finally {
      setUploading(false);
    }
  };

  if (wasteTypesLoading || disposalMethodsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      <div className="space-y-2">
        <Label htmlFor="waste_type" className="text-sm font-medium">
          Jenis Sampah <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.waste_type}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, waste_type: value as WasteLogFormData['waste_type'] }))
          }
        >
          <SelectTrigger className="min-h-[44px] sm:min-h-[40px]">
            <SelectValue placeholder="Pilih jenis sampah" />
          </SelectTrigger>
          <SelectContent>
            {WASTE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex flex-col">
                  <span>{type.label}</span>
                  {type.description && (
                    <span className="text-xs text-slate-500">{type.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-sm font-medium">
            Jumlah <span className="text-red-500">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
            placeholder="0.00"
            className="min-h-[44px] sm:min-h-[40px] text-base sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit" className="text-sm font-medium">Satuan</Label>
          <Select
            value={form.unit}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, unit: value as 'kg' | 'pieces' }))
            }
          >
            <SelectTrigger className="min-h-[44px] sm:min-h-[40px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilogram (kg)</SelectItem>
              <SelectItem value="pieces">Pieces</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="disposal_method" className="text-sm font-medium">
          Metode Pembuangan <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.disposal_method}
          onValueChange={(value) =>
            setForm((prev) => ({
              ...prev,
              disposal_method: value as WasteLogFormData['disposal_method'],
            }))
          }
        >
          <SelectTrigger className="min-h-[44px] sm:min-h-[40px]">
            <SelectValue placeholder="Pilih metode pembuangan" />
          </SelectTrigger>
          <SelectContent>
            {DISPOSAL_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                <div className="flex flex-col">
                  <span>{method.label}</span>
                  {method.description && (
                    <span className="text-xs text-slate-500">{method.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">Catatan (Opsional)</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Tambahkan catatan jika diperlukan..."
          rows={3}
          className="min-h-[88px] text-base sm:text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photos" className="text-sm font-medium">Foto Dokumentasi (Opsional)</Label>
        <div className="space-y-3">
          <label
            htmlFor="photos"
            className="flex min-h-[44px] sm:min-h-[40px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 active:bg-slate-200"
          >
            <Camera className="mr-2 h-4 w-4" />
            {form.photos.length > 0 ? `Ubah Foto (${form.photos.length})` : 'Pilih Foto'}
          </label>
          <Input
            id="photos"
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
          {form.photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-1 -top-1 h-7 w-7 rounded-full shadow-md"
                    onClick={() => handleRemovePhoto(index)}
                    aria-label={`Hapus foto ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={uploading || createWasteLogMutation.isPending}
        className="w-full min-h-[44px] sm:min-h-[40px] text-base sm:text-sm font-medium"
      >
        {uploading || createWasteLogMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Simpan Waste Log
          </>
        )}
      </Button>
    </form>
  );
}

