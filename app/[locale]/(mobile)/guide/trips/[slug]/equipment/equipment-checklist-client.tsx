'use client';

/**
 * Equipment Checklist Client Component
 * Pre-trip equipment checklist dengan foto bukti peralatan
 */

import { useQuery } from '@tanstack/react-query';
import { Camera, CheckCircle2, MapPin, Package, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import queryKeys from '@/lib/queries/query-keys';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SignaturePad,
  type SignatureData,
} from '@/components/ui/signature-pad';
import { Textarea } from '@/components/ui/textarea';
import { extractEXIFFromFile } from '@/lib/utils/exif-extractor';
import { logger } from '@/lib/utils/logger';
import { EquipmentPredictorCard } from './equipment-predictor-card';

type EquipmentChecklistClientProps = {
  tripId: string;
  locale: string;
  hideHeader?: boolean;
};

type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor';

type EquipmentItem = {
  id: string;
  name: string;
  checked: boolean;
  quantity?: number; // Quantity for items like lifejackets
  condition?: EquipmentCondition; // Condition rating
  photo_url?: string;
  photo_gps?: { latitude: number; longitude: number };
  photo_timestamp?: string;
  photo_location_name?: string; // Location name from EXIF or GPS
  notes?: string;
  needs_repair?: boolean;
};

// Fallback default items (used only if templates API fails)
const defaultEquipmentItems: EquipmentItem[] = [
  {
    id: 'life_jacket',
    name: 'Life Jacket (sesuai jumlah peserta)',
    checked: false,
  },
  {
    id: 'snorkeling_gear',
    name: 'Alat Snorkeling (mask, fin, snorkel)',
    checked: false,
  },
  { id: 'first_aid_kit', name: 'First Aid Kit lengkap', checked: false },
  {
    id: 'communication_device',
    name: 'Alat Komunikasi (HP/Radio)',
    checked: false,
  },
  {
    id: 'safety_equipment',
    name: 'Peralatan Safety (whistle, flashlight)',
    checked: false,
  },
  { id: 'water_supply', name: 'Persediaan Air Minum', checked: false },
  {
    id: 'navigation_tools',
    name: 'Alat Navigasi (kompas, GPS)',
    checked: false,
  },
];

type EquipmentAlert = {
  equipmentId: string;
  equipmentName: string;
  certificateType: string;
  expiryDate: string;
  daysUntilExpiry: number;
  severity: 'expired' | 'warning' | 'info';
};

// Expiry Alerts Component
function ExpiryAlerts({ tripId: _tripId }: { tripId: string }) {
  const { data: alerts } = useQuery<{ alerts: EquipmentAlert[] }>({
    queryKey: ['equipment-expiry-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/guide/equipment/expiry-alerts');
      if (!res.ok) return { alerts: [] };
      return res.json();
    },
  });

  if (!alerts?.alerts || alerts.alerts.length === 0) {
    return null; // No alerts is acceptable, don't show anything
  }

  const expiredAlerts = alerts.alerts.filter((a) => a.severity === 'expired');
  const warningAlerts = alerts.alerts.filter((a) => a.severity === 'warning');

  if (expiredAlerts.length === 0 && warningAlerts.length === 0) {
    return null; // No expired or warning alerts, don't show anything
  }

  return (
    <Card className="border-0 bg-red-50 shadow-sm">
      <CardContent className="p-4">
        <p className="mb-2 text-sm font-semibold text-red-900">
          ⚠️ Peringatan Sertifikat Peralatan
        </p>
        <div className="space-y-1 text-xs">
          {expiredAlerts.map((alert) => (
            <p key={alert.equipmentId} className="text-red-700">
              🔴 {alert.equipmentName} - {alert.certificateType} expired{' '}
              {Math.abs(alert.daysUntilExpiry)} hari lalu
            </p>
          ))}
          {warningAlerts.map((alert) => (
            <p key={alert.equipmentId} className="text-amber-700">
              ⚠️ {alert.equipmentName} - {alert.certificateType} expires dalam{' '}
              {alert.daysUntilExpiry} hari
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EquipmentChecklistClient({
  tripId,
  locale,
  hideHeader = false,
}: EquipmentChecklistClientProps) {
  const [items, setItems] = useState<EquipmentItem[]>(defaultEquipmentItems);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [totalPassengers, setTotalPassengers] = useState<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Fetch equipment checklist templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery<{
    data: {
      templates: Array<{ id: string; name: string; description?: string }>;
    };
  }>({
    queryKey: queryKeys.guide.equipment.checklistTemplates(),
    queryFn: async () => {
      const res = await fetch('/api/guide/equipment/checklist/templates');
      if (!res.ok)
        throw new Error('Failed to fetch equipment checklist templates');
      return res.json();
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch existing checklist for this trip
  const { data: existingChecklistData, isLoading: checklistLoading } =
    useQuery<{ checklist: { equipment_items?: EquipmentItem[] } | null }>({
      queryKey: ['guide', 'equipment', 'checklist', tripId],
      queryFn: async () => {
        const res = await fetch(
          `/api/guide/equipment/checklist?tripId=${tripId}`
        );
        if (!res.ok) return { checklist: null };
        return res.json();
      },
      enabled: !!tripId,
      staleTime: 60000, // Cache for 1 minute
    });

  // Initialize items from templates and merge with existing checklist
  useEffect(() => {
    if (templatesLoading || checklistLoading) return;

    const templates = templatesData?.data?.templates || [];

    // If we have templates, use them as base
    if (templates.length > 0) {
      const templateItems: EquipmentItem[] = templates.map((t) => ({
        id: t.id,
        name: t?.name ?? 'Equipment',
        checked: false,
      }));

      // If we have existing checklist, merge with it (preserve checked state, photos, etc.)
      const existingItems = existingChecklistData?.checklist?.equipment_items;
      if (
        existingItems &&
        Array.isArray(existingItems) &&
        existingItems.length > 0
      ) {
        // Merge: use existing items data, fill in missing templates
        const existingMap = new Map(
          existingItems.map((item) => [item.id, item])
        );
        const mergedItems: EquipmentItem[] = templateItems.map((template) => {
          const existing = existingMap.get(template.id);
          if (existing) {
            return existing; // Use existing item (preserves all data)
          }
          return template; // Use template as default
        });

        // Add any existing items that aren't in templates (backwards compatibility)
        existingItems.forEach((item) => {
          if (!templateItems.find((t) => t.id === item.id)) {
            mergedItems.push(item);
          }
        });

        setItems(mergedItems);
      } else {
        // No existing checklist, use templates as defaults
        setItems(templateItems);
      }
    } else {
      // No templates available, use hardcoded defaults
      const existingItems = existingChecklistData?.checklist?.equipment_items;
      if (
        existingItems &&
        Array.isArray(existingItems) &&
        existingItems.length > 0
      ) {
        setItems(existingItems);
      } else {
        setItems(defaultEquipmentItems);
      }
    }
  }, [
    templatesData,
    existingChecklistData,
    templatesLoading,
    checklistLoading,
  ]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const updateItem = (id: string, updates: Partial<EquipmentItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Fetch total passenger count for lifejacket validation
  useEffect(() => {
    if (tripId) {
      fetch(`/api/guide/manifest?tripId=${tripId}`)
        .then((res) => res.json())
        .then((data: { totalPax?: number }) => {
          if (data.totalPax) {
            setTotalPassengers(data.totalPax);
            // Auto-set lifejacket quantity to total passengers if not set
            setItems((prev) =>
              prev.map((item) => {
                if (item.id === 'life_jacket' && !item.quantity) {
                  return { ...item, quantity: data.totalPax };
                }
                return item;
              })
            );
          }
        })
        .catch((err) => {
          logger.warn('Failed to fetch passenger count', err);
        });
    }
  }, [tripId]);

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
          logger.warn('GPS capture failed', {
            error: error.message,
            code: error.code,
          });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const handlePhotoUpload = async (itemId: string, file: File) => {
    try {
      // Extract EXIF data from photo (client-side)
      let exifData = null;
      let exifGps = gpsLocation;
      let locationName = '';

      try {
        exifData = await extractEXIFFromFile(file);
        if (exifData?.latitude && exifData?.longitude) {
          exifGps = {
            latitude: exifData.latitude,
            longitude: exifData.longitude,
          };
          // Try to get location name from reverse geocoding (optional)
          // For now, just show coordinates
          locationName = `${exifData.latitude.toFixed(6)}, ${exifData.longitude.toFixed(6)}`;
        }
      } catch (exifError) {
        logger.warn('Failed to extract EXIF from file', { error: exifError });
        // Continue without EXIF
      }

      // Check if offline - use photo queue
      if (!navigator.onLine) {
        const { queuePhotoUpload } = await import('@/lib/guide/offline-sync');
        const photoId = await queuePhotoUpload(file, {
          tripId,
          type: 'equipment',
          itemId,
          latitude: exifGps?.latitude,
          longitude: exifGps?.longitude,
          timestamp: exifData?.timestamp || new Date().toISOString(),
        });

        // Use temporary object URL for immediate display
        const photoUrl = URL.createObjectURL(file);
        updateItem(itemId, {
          photo_url: photoUrl,
          photo_gps: exifGps || undefined,
          photo_timestamp: exifData?.timestamp || new Date().toISOString(),
          photo_location_name: locationName || undefined,
        });

        toast.success('Foto akan diupload saat online');
        return;
      }

      // Online: upload directly
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tripId', tripId);
      formData.append('type', 'equipment');
      formData.append('itemId', itemId);
      if (exifGps) {
        formData.append('latitude', exifGps.latitude.toString());
        formData.append('longitude', exifGps.longitude.toString());
      }
      formData.append(
        'timestamp',
        exifData?.timestamp || new Date().toISOString()
      );

      const res = await fetch('/api/guide/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = (await res.json()) as { url: string; photoUrl: string };
      const photoUrl = data.url || data.photoUrl;

      updateItem(itemId, {
        photo_url: photoUrl,
        photo_gps: exifGps || undefined,
        photo_timestamp: exifData?.timestamp || new Date().toISOString(),
        photo_location_name: locationName || undefined,
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
    // Show completion confirmation modal first
    if (!showCompletionModal) {
      setShowCompletionModal(true);
      return;
    }

    if (!signature) {
      setError('Mohon berikan tanda tangan sebelum menyimpan');
      setShowCompletionModal(false);
      return;
    }

    setSubmitting(true);
    setError(null);
    setShowCompletionModal(false);

    try {
      const res = await fetch('/api/guide/equipment/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          equipmentItems: items,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          signature: signature
            ? {
                method: signature.method,
                data: signature.data,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(errorData.error || 'Gagal menyimpan checklist');
        return;
      }

      // Success
      logger.info('Equipment checklist saved', {
        tripId,
        itemsCount: items.length,
      });
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
      logger.error('Failed to report equipment issue', err, {
        tripId,
        itemId: item.id,
      });
    }
  };

  const allChecked = items.every((item) => item.checked);
  const itemsNeedingRepair = items.filter((item) => item.needs_repair);

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div>
          <h1 className="text-xl font-bold leading-tight text-slate-900">
            Equipment Checklist
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pastikan semua peralatan lengkap dan dalam kondisi baik sebelum trip
          </p>
        </div>
      )}

      {/* Info: Inventory Ops (untuk admin/ops) */}
      <Card className="border-0 bg-blue-50 shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <Package className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-blue-900">
              Sistem Inventory Ops
            </p>
            <p className="mt-0.5 text-xs text-blue-700">
              Untuk informasi stok dan ketersediaan peralatan, silakan hubungi
              tim operasional
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Predictive Maintenance */}
      <EquipmentPredictorCard tripId={tripId} locale={locale} />

      {/* Equipment Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className={`border-0 shadow-sm transition-colors ${
              item.checked ? 'border-emerald-200 bg-emerald-50' : 'bg-white'
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
                <div className="min-w-0 flex-1">
                  <Label
                    htmlFor={item.id}
                    className={`cursor-pointer text-sm font-medium ${
                      item.checked ? 'text-emerald-900' : 'text-slate-900'
                    }`}
                  >
                    {item.name}
                  </Label>

                  {/* Quantity Input for Lifejacket */}
                  {item.id === 'life_jacket' && item.checked && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`qty-${item.id}`}
                          className="whitespace-nowrap text-xs font-medium text-slate-700"
                        >
                          Jumlah:
                        </Label>
                        <Input
                          id={`qty-${item.id}`}
                          type="number"
                          min="0"
                          value={item.quantity || 0}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value, 10) || 0;
                            updateItem(item.id, { quantity: qty });
                          }}
                          className="h-8 w-20 text-sm"
                        />
                        {totalPassengers !== null && (
                          <span className="text-xs text-slate-500">
                            / {totalPassengers} peserta
                          </span>
                        )}
                      </div>
                      {totalPassengers !== null &&
                        (item.quantity || 0) < totalPassengers && (
                          <p className="mt-1 text-xs font-medium text-amber-600">
                            ⚠️ Lifejacket tidak mencukupi. Diperlukan:{' '}
                            {totalPassengers}, Tersedia: {item.quantity || 0}
                          </p>
                        )}
                      {totalPassengers !== null &&
                        (item.quantity || 0) >= totalPassengers && (
                          <p className="mt-1 text-xs text-emerald-600">
                            ✅ Lifejacket mencukupi
                          </p>
                        )}
                    </div>
                  )}

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
                            onClick={() =>
                              updateItem(item.id, {
                                photo_url: undefined,
                                photo_gps: undefined,
                                photo_timestamp: undefined,
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {item.photo_gps && (
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {item.photo_location_name ||
                                  `${item.photo_gps.latitude.toFixed(4)}, ${item.photo_gps.longitude.toFixed(4)}`}
                              </span>
                            </div>
                          )}
                          {item.photo_timestamp && (
                            <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                              {new Date(item.photo_timestamp).toLocaleString(
                                'id-ID'
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Label
                          htmlFor={`photo-${item.id}`}
                          className="cursor-pointer"
                        >
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

                  {/* Condition Rating */}
                  {item.checked && (
                    <div className="mt-2">
                      <Label
                        htmlFor={`condition-${item.id}`}
                        className="text-xs font-medium text-slate-700"
                      >
                        Kondisi:
                      </Label>
                      <Select
                        value={item.condition || 'good'}
                        onValueChange={(value: EquipmentCondition) =>
                          updateItem(item.id, { condition: value })
                        }
                      >
                        <SelectTrigger
                          id={`condition-${item.id}`}
                          className="mt-1 h-8 text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">
                            <span className="flex items-center gap-2">
                              <span className="text-green-600">✅</span>{' '}
                              Excellent
                            </span>
                          </SelectItem>
                          <SelectItem value="good">
                            <span className="flex items-center gap-2">
                              <span className="text-blue-600">✓</span> Good
                            </span>
                          </SelectItem>
                          <SelectItem value="fair">
                            <span className="flex items-center gap-2">
                              <span className="text-amber-600">⚠️</span> Fair
                            </span>
                          </SelectItem>
                          <SelectItem value="poor">
                            <span className="flex items-center gap-2">
                              <span className="text-red-600">🔴</span> Poor
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Notes & Needs Repair */}
                  {item.checked && (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        placeholder="Catatan (opsional)"
                        className="text-xs"
                        value={item.notes || ''}
                        onChange={(e) =>
                          updateItem(item.id, { notes: e.target.value })
                        }
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`repair-${item.id}`}
                          checked={item.needs_repair || false}
                          onChange={(e) =>
                            updateItem(item.id, {
                              needs_repair: e.target.checked,
                            })
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
          <CardTitle className="text-base font-semibold">
            Tanda Tangan
          </CardTitle>
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
            Lokasi: {gpsLocation.latitude.toFixed(6)},{' '}
            {gpsLocation.longitude.toFixed(6)}
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
          {submitting
            ? 'Menyimpan...'
            : allChecked && signature
              ? 'Simpan Checklist'
              : 'Lengkapi Semua'}
        </Button>
        {error && <p className="text-center text-xs text-red-500">{error}</p>}
        {!allChecked && (
          <p className="text-center text-xs text-slate-500">
            Pastikan semua item sudah dicentang sebelum menyimpan
          </p>
        )}
        {!signature && (
          <p className="text-center text-xs text-amber-600">
            Mohon berikan tanda tangan sebelum menyimpan
          </p>
        )}
      </div>
    </div>
  );
}
