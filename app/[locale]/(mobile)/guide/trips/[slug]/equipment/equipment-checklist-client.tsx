'use client';

/**
 * Equipment Checklist Client Component
 * Pre-trip equipment checklist dengan foto bukti peralatan
 */

import { Camera, CheckCircle2, ExternalLink, Package, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

  const handlePhotoUpload = (itemId: string, file: File) => {
    // Simulate upload - in real app, upload to storage
    const photoUrl = URL.createObjectURL(file);
    updateItem(itemId, { photo_url: photoUrl });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/guide/equipment/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          equipmentItems: items,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        setError(errorData.error || 'Gagal menyimpan checklist');
        return;
      }

      // Success
      logger.info('Equipment checklist saved', { tripId, itemsCount: items.length });
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
                            onClick={() => updateItem(item.id, { photo_url: undefined })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
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

      {/* Submit Button */}
      <div className="space-y-2">
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSubmit}
          disabled={submitting || !allChecked}
        >
          {submitting ? 'Menyimpan...' : allChecked ? 'Simpan Checklist' : 'Centang Semua Item'}
        </Button>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        {!allChecked && (
          <p className="text-xs text-slate-500 text-center">
            Pastikan semua item sudah dicentang sebelum menyimpan
          </p>
        )}
      </div>
    </div>
  );
}

