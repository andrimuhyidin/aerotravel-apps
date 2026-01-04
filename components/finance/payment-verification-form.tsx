'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

export type PaymentVerificationFormProps = {
  paymentId: string;
  bookingCode?: string;
  amount?: number;
  currentStatus: string;
  onSuccess?: () => void;
  className?: string;
};

type ActionType = 'approve' | 'reject' | 'more_info' | null;

export function PaymentVerificationForm({
  paymentId,
  bookingCode,
  amount,
  currentStatus,
  onSuccess,
  className,
}: PaymentVerificationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ActionType>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [moreInfoReason, setMoreInfoReason] = useState('');

  const isVerified = currentStatus === 'verified' || currentStatus === 'rejected';

  const handleAction = async (action: ActionType) => {
    if (!action) return;
    
    setIsSubmitting(true);
    
    try {
      let endpoint = '';
      let body: Record<string, string> = {};

      if (action === 'approve') {
        endpoint = `/api/admin/finance/payments/${paymentId}/verify`;
        body = { action: 'approve', notes };
      } else if (action === 'reject') {
        if (!rejectionReason.trim()) {
          toast.error('Alasan penolakan wajib diisi');
          setIsSubmitting(false);
          return;
        }
        endpoint = `/api/admin/finance/payments/${paymentId}/verify`;
        body = { action: 'reject', rejectionReason };
      } else if (action === 'more_info') {
        if (!moreInfoReason.trim() || moreInfoReason.length < 10) {
          toast.error('Alasan permintaan info harus minimal 10 karakter');
          setIsSubmitting(false);
          return;
        }
        endpoint = `/api/admin/finance/payments/${paymentId}/request-more-info`;
        body = { reason: moreInfoReason };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }

      toast.success(data.message || 'Pembayaran berhasil diproses');
      
      // Reset form
      setNotes('');
      setRejectionReason('');
      setMoreInfoReason('');
      setConfirmAction(null);
      
      // Callback or refresh
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      logger.error('Payment verification error', error);
      toast.error(error instanceof Error ? error.message : 'Gagal memproses pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isVerified) {
    return (
      <div className={cn(
        "rounded-lg border p-4",
        currentStatus === 'verified' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50',
        className
      )}>
        <div className="flex items-center gap-2">
          {currentStatus === 'verified' ? (
            <>
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                Pembayaran sudah diverifikasi
              </span>
            </>
          ) : (
            <>
              <X className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">
                Pembayaran ditolak
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Payment Summary */}
      {(bookingCode || amount) && (
        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Detail Pembayaran
          </h4>
          <div className="space-y-1">
            {bookingCode && (
              <p className="text-sm">
                <span className="text-muted-foreground">Kode Booking:</span>{' '}
                <span className="font-medium">{bookingCode}</span>
              </p>
            )}
            {amount && (
              <p className="text-sm">
                <span className="text-muted-foreground">Jumlah:</span>{' '}
                <span className="font-semibold text-primary">
                  {formatCurrency(amount)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="default"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => setConfirmAction('approve')}
            disabled={isSubmitting}
          >
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setConfirmAction('reject')}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setConfirmAction('more_info')}
            disabled={isSubmitting}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Minta Info
          </Button>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog
        open={confirmAction === 'approve'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menyetujui pembayaran ini?
              {amount && (
                <span className="mt-2 block font-medium text-foreground">
                  Jumlah: {formatCurrency(amount)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan jika diperlukan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.preventDefault();
                handleAction('approve');
              }}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={confirmAction === 'reject'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Konfirmasi Penolakan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menolak pembayaran ini? 
              Customer akan menerima notifikasi penolakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Alasan Penolakan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Jelaskan alasan penolakan..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleAction('reject');
              }}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Tolak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request More Info Dialog */}
      <AlertDialog
        open={confirmAction === 'more_info'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Minta Informasi Tambahan</AlertDialogTitle>
            <AlertDialogDescription>
              Customer akan diminta untuk melengkapi bukti pembayaran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="more-info-reason">
              Informasi yang Diperlukan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="more-info-reason"
              placeholder="Contoh: Mohon upload ulang bukti transfer yang lebih jelas..."
              value={moreInfoReason}
              onChange={(e) => setMoreInfoReason(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimal 10 karakter
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleAction('more_info');
              }}
              disabled={isSubmitting || moreInfoReason.length < 10}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim Permintaan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

