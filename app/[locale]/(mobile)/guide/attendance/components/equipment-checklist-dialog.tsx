'use client';

/**
 * Equipment Checklist Dialog Component
 * Equipment & logistics handover checklist before check-out
 */

import { Check, Loader2, Package } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

type EquipmentChecklistDialogProps = {
  tripId: string;
  guideId: string;
  open: boolean;
  onClose: () => void;
  onComplete: (data: EquipmentHandoverData) => void;
};

type EquipmentItem = {
  id: string;
  name: string;
  checked: boolean;
  required: boolean;
};

export type EquipmentHandoverData = {
  equipmentChecked: boolean;
  fuelConfirmed: boolean;
  boatReturned: boolean;
  fuelLevel: number;
  notes: string;
  items: EquipmentItem[];
};

const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  { id: 'life-jacket', name: 'Life Jacket', checked: false, required: true },
  { id: 'radio', name: 'Radio Komunikasi', checked: false, required: true },
  { id: 'first-aid', name: 'First Aid Kit', checked: false, required: true },
  { id: 'fire-extinguisher', name: 'APAR', checked: false, required: true },
  { id: 'anchor', name: 'Jangkar', checked: false, required: false },
  { id: 'rope', name: 'Tali Tambat', checked: false, required: false },
  { id: 'paddle', name: 'Dayung Cadangan', checked: false, required: false },
];

export function EquipmentChecklistDialog({
  tripId,
  guideId,
  open,
  onClose,
  onComplete,
}: EquipmentChecklistDialogProps) {
  const [items, setItems] = useState<EquipmentItem[]>(DEFAULT_EQUIPMENT);
  const [fuelLevel, setFuelLevel] = useState<number>(100);
  const [fuelConfirmed, setFuelConfirmed] = useState(false);
  const [boatReturned, setBoatReturned] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleItemToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const requiredItems = items.filter((item) => item.required);
  const allRequiredChecked = requiredItems.every((item) => item.checked);
  const canSubmit = allRequiredChecked && fuelConfirmed && boatReturned;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Mohon lengkapi semua checklist yang wajib');
      return;
    }

    setSubmitting(true);
    try {
      // Submit to API
      const response = await fetch('/api/guide/attendance/equipment-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          guideId,
          fuelLevel,
          notes,
          items: items.map((item) => ({
            name: item.name,
            checked: item.checked,
            required: item.required,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit equipment handover');
      }

      const data: EquipmentHandoverData = {
        equipmentChecked: allRequiredChecked,
        fuelConfirmed,
        boatReturned,
        fuelLevel,
        notes,
        items,
      };

      onComplete(data);
      toast.success('Equipment checklist berhasil disimpan');
    } catch (error) {
      logger.error('Failed to submit equipment checklist', error);
      toast.error('Gagal menyimpan checklist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-600" />
            Equipment & Logistics Handover
          </DialogTitle>
          <DialogDescription>
            Pastikan semua peralatan dan aset telah dikembalikan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Equipment Checklist */}
          <div>
            <Label className="text-base font-semibold">Peralatan Trip</Label>
            <p className="mb-3 text-xs text-slate-600">
              <span className="text-red-600">*</span> = Wajib
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3',
                    item.checked
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200'
                  )}
                >
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={() => handleItemToggle(item.id)}
                  />
                  <Label
                    htmlFor={item.id}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {item.name}
                    {item.required && (
                      <span className="ml-1 text-red-600">*</span>
                    )}
                  </Label>
                  {item.checked && (
                    <Check className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fuel Level */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="fuel-level" className="text-base font-semibold">
                BBM/Fuel Level <span className="text-red-600">*</span>
              </Label>
              <span className="text-sm font-bold text-slate-900">
                {fuelLevel}%
              </span>
            </div>
            <Input
              id="fuel-level"
              type="range"
              min="0"
              max="100"
              step="5"
              value={fuelLevel}
              onChange={(e) => setFuelLevel(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-600">
              <span>Empty</span>
              <span>Full</span>
            </div>
          </div>

          {/* Fuel Confirmation */}
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="fuel-confirmed"
                checked={fuelConfirmed}
                onCheckedChange={(checked) => setFuelConfirmed(!!checked)}
              />
              <Label
                htmlFor="fuel-confirmed"
                className="cursor-pointer text-sm"
              >
                Saya konfirmasi level BBM sudah benar dan sesuai
                <span className="text-red-600">*</span>
              </Label>
            </div>
          </div>

          {/* Boat/Asset Return */}
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="boat-returned"
                checked={boatReturned}
                onCheckedChange={(checked) => setBoatReturned(!!checked)}
              />
              <Label htmlFor="boat-returned" className="cursor-pointer text-sm">
                Kapal/aset telah dikembalikan dalam kondisi baik
                <span className="text-red-600">*</span>
              </Label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Catatan Tambahan</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan kondisi peralatan atau hal penting lainnya..."
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Konfirmasi Handover
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
