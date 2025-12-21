'use client';

/**
 * Waste Log Modal Component
 * Modal dialog untuk waste logging dengan form
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WasteLogForm } from './waste-log-form';

type WasteLogModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  locale: string;
};

export function WasteLogModal({ open, onOpenChange, tripId, locale }: WasteLogModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Waste - ISO 14001 Compliance</DialogTitle>
          <DialogDescription>
            Catat jenis sampah, jumlah, dan metode pembuangan untuk compliance ISO 14001
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <WasteLogForm
            tripId={tripId}
            locale={locale}
            onSuccess={() => {
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

