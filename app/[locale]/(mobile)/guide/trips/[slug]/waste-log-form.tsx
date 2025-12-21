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
      photos?: string[];
    }) => {
      const res = await fetch(`/api/guide/trips/${tripId}/waste-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create waste log');
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
      // Upload photos first
      const photoUrls: string[] = [];
      for (const photo of form.photos) {
        try {
          const url = await uploadPhotoMutation.mutateAsync(photo);
          photoUrls.push(url);
        } catch (error) {
          logger.warn('Failed to upload photo', { error });
          toast.warning(`Gagal upload salah satu foto, melanjutkan...`);
        }
      }

      // Create waste log
      await createWasteLogMutation.mutateAsync({
        waste_type: form.waste_type,
        quantity,
        unit: form.unit,
        disposal_method: form.disposal_method,
        notes: form.notes || undefined,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="waste_type">
          Jenis Sampah <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.waste_type}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, waste_type: value as WasteLogFormData['waste_type'] }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis sampah" />
          </SelectTrigger>
          <SelectContent>
            {WASTE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">
            Jumlah <span className="text-red-500">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Satuan</Label>
          <Select
            value={form.unit}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, unit: value as 'kg' | 'pieces' }))
            }
          >
            <SelectTrigger>
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
        <Label htmlFor="disposal_method">
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
          <SelectTrigger>
            <SelectValue placeholder="Pilih metode pembuangan" />
          </SelectTrigger>
          <SelectContent>
            {DISPOSAL_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (Opsional)</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Tambahkan catatan jika diperlukan..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photos">Foto Dokumentasi (Opsional)</Label>
        <div className="space-y-2">
          <Input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="cursor-pointer"
          />
          {form.photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="h-20 w-20 rounded object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <Trash2 className="h-3 w-3" />
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
        className="w-full"
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

