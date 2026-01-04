'use client';

/**
 * Equipment Checklist Dialog
 * Dialog untuk menampilkan equipment checklist
 */

import { Package } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EquipmentChecklistClient } from './equipment/equipment-checklist-client';

type EquipmentChecklistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  locale: string;
};

export function EquipmentChecklistDialog({
  open,
  onOpenChange,
  tripId,
  locale,
}: EquipmentChecklistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Equipment Checklist
          </DialogTitle>
          <DialogDescription>
            Pastikan semua peralatan lengkap dan dalam kondisi baik sebelum trip
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <EquipmentChecklistClient tripId={tripId} locale={locale} hideHeader={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
