'use client';

/**
 * Equipment Checklist Client Component
 * Pre-trip equipment checklist dengan foto bukti peralatan
 */

import { Camera, CheckCircle2, ExternalLink, MapPin, Package, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SignaturePad, type SignatureData } from '@/components/ui/signature-pad';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/utils/logger';

type EquipmentChecklistClientProps = {
  tripId: string;
  locale: string;
};

type EquipmentItem = {
  id: string;
  name: string;
  checked: boolean;
  photo_url?: string;
  photo_gps?: { latitude: number; longitude: number };
  photo_timestamp?: string;
  notes?: string;
  needs_repair?: boolean;
};

const defaultEquipmentItems: EquipmentItem[] = [
  { id: 'life_jacket', name: 'Life Jacket (sesuai jumlah peserta)', checked: false },
  { id: 'snorkeling_gear', name: 'Alat Snorkeling (mask, fin, snorkel)', checked: false },
  { id: 'first_aid_kit', name: 'First Aid Kit lengkap', checked: false },
  { id: 'communication_device', name: 'Alat Komunikasi (HP/Radio)', checked: false },
  { id: 'safety_equipment', name: 'Peralatan Safety (whistle, flashlight)', checked: false },
  { id: 'water_supply', name: 'Persediaan Air Minum', checked: false },
  { id: 'navigation_tools', name: 'Alat Navigasi (kompas, GPS)', checked: false },
];

export function EquipmentChecklistClient({
  tripId,
  locale,
}: EquipmentChecklistClientProps) {
  const [items, setItems] = useState<EquipmentItem[]>(defaultEquipmentItems);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [signature, setSignature] = useState<SignatureData | null>(null);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const updateItem = (id: string, updates: Partial<EquipmentItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  // Capture GPS location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          logger.warn('GPS capture failed', { error: error.message, code: error.code });
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, []);

  const handlePhotoUpload = async (itemId: string, file: File) => {
    try {
      // Upload photo with GPS metadata
      const formData = new FormData();
      formData.append('file', file);
      if (gpsLocation) {
        formData.append('latitude', gpsLocation.latitude.toString());
        formData.append('longitude', gpsLocation.longitude.toString());
      }

      const res = await fetch('/api/guide/equipment/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = (await res.json()) as { url: string; gps?: { latitude: number; longitude: number }; timestamp: string };
      
      updateItem(itemId, {
        photo_url: data.url,
        photo_gps: data.gps || gpsLocation || undefined,
        photo_timestamp: data.timestamp,
      });

      toast.success('Foto berhasil diupload');
    } catch (err) {
      logger.error('Failed to upload photo', err);
      toast.error('Gagal upload foto');
      // Fallback: use object URL
      const photoUrl = URL.createObjectURL(file);
      updateItem(itemId, {
        photo_url: photoUrl,
        photo_gps: gpsLocation || undefined,
        photo_timestamp: new Date().toISOString(),
      });
    }
  };

  const handleSubmit = async () => {
    if (!signature) {
      setError('Mohon berikan tanda tangan sebelum menyimpan');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/guide/equipment/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          equipmentItems: items,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          signature: signature ? {
            method: signature.method,
            data: signature.data,
          } : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        setError(errorData.error || 'Gagal menyimpan checklist');
        return;
      }

      // Success
      logger.info('Equipment checklist saved', { tripId, itemsCount: items.length });
      toast.success('Checklist berhasil disimpan');
    } catch (err) {
      logger.error('Failed to save equipment checklist', err, { tripId });
      setError('Gagal menyimpan checklist. Periksa koneksi internet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportIssue = async (item: EquipmentItem) => {
    if (!item.needs_repair) return;

    try {
      await fetch('/api/guide/equipment/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          equipmentName: item.name,
          equipmentType: item.id,
          issueType: 'needs_repair',
          description: item.notes || `Perlu perbaikan: ${item.name}`,
          photoUrl: item.photo_url,
          severity: 'medium',
        }),
      });
    } catch (err) {
      logger.error('Failed to report equipment issue', err, { tripId, itemId: item.id });
    }
  };

  const allChecked = items.every((item) => item.checked);
  const itemsNeedingRepair = items.filter((item) => item.needs_repair);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold leading-tight text-slate-900">
          Equipment Checklist
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Pastikan semua peralatan lengkap dan dalam kondisi baik sebelum trip
        </p>
      </div>

      {/* Link to Inventory Ops */}
      <Card className="border-0 bg-blue-50 shadow-sm">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Sistem Inventory Ops</p>
              <p className="text-xs text-blue-700">
                Cek stok dan ketersediaan peralatan di sistem ops
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-100"
            asChild
          >
            <a href={`/${locale}/console/operations/inventory`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Buka
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Equipment Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className={`border-0 shadow-sm transition-colors ${
              item.checked ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    item.checked
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  {item.checked && <CheckCircle2 className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={item.id}
                    className={`cursor-pointer text-sm font-medium ${
                      item.checked ? 'text-emerald-900' : 'text-slate-900'
                    }`}
                  >
                    {item.name}
                  </Label>

                  {/* Photo Upload */}
                  {item.checked && (
                    <div className="mt-2">
                      {item.photo_url ? (
                        <div className="relative">
                          <img
                            src={item.photo_url}
                            alt={item.name}
                            className="h-24 w-full rounded-lg object-cover"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute right-2 top-2 h-6 w-6 p-0"
                            onClick={() => updateItem(item.id, { photo_url: undefined, photo_gps: undefined, photo_timestamp: undefined })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {item.photo_gps && (
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white">
                              <MapPin className="h-3 w-3" />
                              <span>{item.photo_gps.latitude.toFixed(4)}, {item.photo_gps.longitude.toFixed(4)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Label htmlFor={`photo-${item.id}`} className="cursor-pointer">
                          <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-3 text-slate-400 hover:bg-slate-50">
                            <Camera className="h-4 w-4" />
                            <span className="text-xs">Foto Bukti</span>
                          </div>
                          <input
                            id={`photo-${item.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(item.id, file);
                            }}
                          />
                        </Label>
                      )}
                    </div>
                  )}

                  {/* Notes & Needs Repair */}
                  {item.checked && (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        placeholder="Catatan (opsional)"
                        className="text-xs"
                        value={item.notes || ''}
                        onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`repair-${item.id}`}
                          checked={item.needs_repair || false}
                          onChange={(e) =>
                            updateItem(item.id, { needs_repair: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <Label
                          htmlFor={`repair-${item.id}`}
                          className="cursor-pointer text-xs text-slate-600"
                        >
                          Perlu perbaikan/perawatan
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Items Needing Repair Alert */}
      {itemsNeedingRepair.length > 0 && (
        <Card className="border-0 bg-amber-50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-amber-900">
              ⚠️ {itemsNeedingRepair.length} peralatan perlu perbaikan
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Laporan akan otomatis dikirim ke Ops setelah checklist disimpan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Signature Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Tanda Tangan</CardTitle>
        </CardHeader>
        <CardContent>
          <SignaturePad
            value={signature}
            onChange={setSignature}
            label="Tanda tangan untuk konfirmasi checklist"
            required
            showGPS={true}
          />
        </CardContent>
      </Card>

      {/* GPS Location Display */}
      {gpsLocation && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <MapPin className="h-4 w-4" />
          <span>
            Lokasi: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
          </span>
        </div>
      )}

      {/* Submit Button */}
      <div className="space-y-2">
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSubmit}
          disabled={submitting || !allChecked || !signature}
        >
          {submitting ? 'Menyimpan...' : allChecked && signature ? 'Simpan Checklist' : 'Lengkapi Semua'}
        </Button>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        {!allChecked && (
          <p className="text-xs text-slate-500 text-center">
            Pastikan semua item sudah dicentang sebelum menyimpan
          </p>
        )}
        {!signature && (
          <p className="text-xs text-amber-600 text-center">
            Mohon berikan tanda tangan sebelum menyimpan
          </p>
        )}
      </div>
    </div>
  );
}

