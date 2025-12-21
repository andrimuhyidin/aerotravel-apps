'use client';

/**
 * Safety Checklist Pre-Trip Dialog
 * Checklist yang harus diselesaikan sebelum guide bisa mengubah status ke "On Trip"
 */

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type SafetyChecklistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  tripId?: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  description?: string;
};

export function SafetyChecklistDialog({
  open,
  onOpenChange,
  onComplete,
  tripId,
}: SafetyChecklistDialogProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch checklist templates from API
  const { data: templatesData, isLoading: templatesLoading } = useQuery<{ data: { templates: ChecklistItem[] } }>({
    queryKey: queryKeys.guide.safetyChecklistTemplates(),
    queryFn: async () => {
      const res = await fetch('/api/guide/safety-checklist/templates');
      if (!res.ok) throw new Error('Failed to fetch safety checklist templates');
      return res.json();
    },
    staleTime: 300000, // Cache for 5 minutes
    enabled: open, // Only fetch when dialog is open
  });

  const checklistItems = templatesData?.data?.templates || [];

  const requiredItems = checklistItems.filter((item) => item.required);
  const allRequiredChecked = requiredItems.every((item) => checkedItems.has(item.id));

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!allRequiredChecked) {
      setError('Mohon centang semua item yang wajib sebelum melanjutkan');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/guide/safety-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: tripId || undefined,
          checkedItems: Array.from(checkedItems),
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        setError(errorData.error || 'Gagal menyimpan checklist');
        setSubmitting(false);
        return;
      }

      // Reset form
      setCheckedItems(new Set());
      onComplete();
      onOpenChange(false);
    } catch (err) {
      setError('Gagal menyimpan checklist. Periksa koneksi internet.');
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setCheckedItems(new Set());
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Checklist Safety Pre-Trip
          </DialogTitle>
          <DialogDescription>
            Pastikan semua item safety di bawah ini sudah dipenuhi sebelum memulai trip. Item yang
            ditandai <span className="text-red-500">*</span> wajib diselesaikan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {templatesLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                <Skeleton className="h-5 w-full" />
              </div>
            ))
          ) : checklistItems.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
              Tidak ada template checklist yang tersedia
            </div>
          ) : (
            checklistItems.map((item) => {
            const isChecked = checkedItems.has(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                  isChecked
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors',
                    isChecked
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white hover:border-slate-400',
                  )}
                >
                  {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
                <Label
                  htmlFor={item.id}
                  className={cn(
                    'flex-1 cursor-pointer text-sm leading-relaxed',
                    isChecked ? 'text-emerald-900' : 'text-slate-700',
                    item.required && 'font-medium',
                  )}
                  onClick={() => toggleItem(item.id)}
                >
                  {item.label}
                  {item.required && <span className="ml-1 text-red-500">*</span>}
                </Label>
              </div>
            );
            })
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            <X className="mr-2 h-4 w-4" />
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allRequiredChecked || submitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Selesai & Aktifkan Status
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
