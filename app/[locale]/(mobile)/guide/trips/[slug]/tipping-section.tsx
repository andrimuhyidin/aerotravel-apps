'use client';

/**
 * Digital Tipping Section
 * Generate QRIS payment for guest tipping
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QrCode, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type TippingSectionProps = {
  tripId: string;
  locale: string;
};

type TippingRequest = {
  id: string;
  amount: number;
  payment_method: 'cash' | 'qris';
  qr_code?: string | null;
  expires_at?: string | null;
  payment_status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'failed';
  paid_at: string | null;
  guest_name?: string | null;
  message?: string | null;
  created_at?: string;
};

export function TippingSection({ tripId, locale: _locale }: TippingSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [amount, setAmount] = useState<number>(50000);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [guestName, setGuestName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch tipping requests
  const { data: tippingData, isLoading } = useQuery<{ 
    tipping: TippingRequest | null;
    all_tippings?: TippingRequest[];
  }>({
    queryKey: queryKeys.guide.trips.tipping(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/tipping`);
      if (res.status === 404) {
        return { tipping: null, all_tippings: [] };
      }
      if (!res.ok) throw new Error('Failed to fetch tipping');
      return res.json();
    },
    refetchInterval: (query) => {
      // Poll every 5 seconds if QRIS payment is pending
      const data = query.state.data;
      if (data?.tipping?.payment_method === 'qris' && data?.tipping?.payment_status === 'pending') {
        return 5000;
      }
      return false;
    },
  });

  // Create tipping mutation
  const createMutation = useMutation({
    mutationFn: async (data: { 
      amount: number; 
      payment_method: 'cash' | 'qris';
      guest_name?: string;
      message?: string;
    }) => {
      const res = await fetch(`/api/guide/trips/${tripId}/tipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data.amount,
          payment_method: data.payment_method,
          guest_name: data.guest_name,
          message: data.message,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create tipping record');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (variables.payment_method === 'cash') {
        toast.success('Catatan tip cash berhasil disimpan');
      } else {
        toast.success('QRIS payment berhasil dibuat');
      }
      setShowDialog(false);
      setAmount(50000);
      setPaymentMethod('cash');
      setGuestName('');
      setMessage('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.trips.tipping(tripId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyimpan catatan tip');
    },
  });

  // Check payment status
  const checkStatusMutation = useMutation({
    mutationFn: async (tippingId: string) => {
      const res = await fetch(`/api/guide/trips/${tripId}/tipping/${tippingId}/status`);
      if (!res.ok) throw new Error('Failed to check status');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'paid') {
        toast.success('Payment berhasil diterima!');
        void queryClient.invalidateQueries({ queryKey: queryKeys.guide.trips.tipping(tripId) });
      } else {
        toast.info(`Status: ${data.status}`);
      }
    },
  });

  const tipping = tippingData?.tipping || null;

  if (isLoading) {
    return <LoadingState message="Memuat tipping..." />;
  }

  const allTippings = tippingData?.all_tippings || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Catatan Tipping</h3>
          <p className="text-sm text-slate-600">Catat tip dari tamu (cash atau QRIS)</p>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm">
          <QrCode className="mr-2 h-4 w-4" />
          Catat Tip
        </Button>
      </div>

      {allTippings.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="Belum ada catatan tip"
          description="Catat tip dari tamu (cash atau QRIS)"
        />
      ) : (
        <div className="space-y-3">
          {allTippings.map((tip) => (
            <Card key={tip.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Payment Method Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        tip.payment_method === 'cash' && 'bg-blue-100 text-blue-800',
                        tip.payment_method === 'qris' && 'bg-purple-100 text-purple-800',
                      )}
                    >
                      {tip.payment_method === 'cash' ? '💰 Cash' : '📱 QRIS'}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        tip.payment_status === 'paid' && 'bg-emerald-100 text-emerald-800',
                        tip.payment_status === 'pending' && 'bg-amber-100 text-amber-800',
                        tip.payment_status === 'expired' && 'bg-red-100 text-red-800',
                        tip.payment_status === 'failed' && 'bg-red-100 text-red-800',
                      )}
                    >
                      {tip.payment_status === 'paid' && '✓ Sudah Dibayar'}
                      {tip.payment_status === 'pending' && '⏳ Menunggu'}
                      {tip.payment_status === 'expired' && '⏰ Expired'}
                      {tip.payment_status === 'failed' && '❌ Gagal'}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Jumlah Tip</p>
                    <p className="text-2xl font-bold text-slate-900">
                      Rp {tip.amount.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Guest Name */}
                  {tip.guest_name && (
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Dari</p>
                      <p className="text-sm font-medium text-slate-900">{tip.guest_name}</p>
                    </div>
                  )}

                  {/* Message */}
                  {tip.message && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-600 italic">"{tip.message}"</p>
                    </div>
                  )}

                  {/* QR Code (only for QRIS pending) */}
                  {tip.payment_method === 'qris' && tip.qr_code && tip.payment_status === 'pending' && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-lg border-2 border-slate-200 bg-white p-4">
                        <img
                          src={tip.qr_code}
                          alt="QRIS Payment"
                          className="h-48 w-48"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <p className="text-center text-xs text-slate-500">
                        Scan QR code dengan e-wallet untuk membayar tip
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => checkStatusMutation.mutate(tip.id)}
                        disabled={checkStatusMutation.isPending}
                        size="sm"
                      >
                        <RefreshCw
                          className={cn('mr-2 h-4 w-4', checkStatusMutation.isPending && 'animate-spin')}
                        />
                        Cek Status
                      </Button>
                    </div>
                  )}

                  {/* Paid At */}
                  {tip.paid_at && (
                    <p className="text-center text-xs text-slate-500">
                      Dibayar pada: {new Date(tip.paid_at).toLocaleString('id-ID')}
                    </p>
                  )}

                  {/* Created At */}
                  {tip.created_at && (
                    <p className="text-center text-xs text-slate-400">
                      Dicatat: {new Date(tip.created_at).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Tipping Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Tip</DialogTitle>
            <DialogDescription>Catat tip dari tamu (cash atau QRIS)</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Metode Pembayaran *</Label>
              <Select value={paymentMethod} onValueChange={(value: 'cash' | 'qris') => setPaymentMethod(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💰 Cash (Tunai)</SelectItem>
                  <SelectItem value="qris">📱 QRIS (Digital Payment)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jumlah Tip (Rp) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                min={1000}
                step={1000}
                placeholder="50000"
              />
              <p className="mt-1 text-xs text-slate-500">Minimum: Rp 1.000</p>
            </div>

            <div>
              <Label>Nama Tamu (Opsional)</Label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nama tamu yang memberikan tip"
                maxLength={100}
              />
            </div>

            <div>
              <Label>Pesan/Catatan (Opsional)</Label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Catatan atau pesan"
                maxLength={200}
              />
            </div>

            {paymentMethod === 'qris' && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> QRIS akan dibuat setelah submit. Tamu dapat scan QR code untuk melakukan pembayaran.
                </p>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Tip cash akan langsung dicatat sebagai "Sudah Dibayar".
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => createMutation.mutate({ 
                amount, 
                payment_method: paymentMethod,
                guest_name: guestName || undefined,
                message: message || undefined,
              })}
              disabled={createMutation.isPending || amount < 1000}
            >
              {createMutation.isPending 
                ? 'Menyimpan...' 
                : paymentMethod === 'cash' 
                  ? 'Simpan Catatan Cash' 
                  : 'Buat QRIS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
