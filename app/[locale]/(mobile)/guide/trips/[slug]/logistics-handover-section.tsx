'use client';

/**
 * Logistics Handover Section
 * Outbound (warehouse → guide) & Inbound (guide → warehouse) workflow
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CheckCircle2, Package, XCircle } from 'lucide-react';
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
import { SignaturePad, type SignatureData } from '@/components/ui/signature-pad';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type LogisticsHandoverSectionProps = {
  tripId: string;
  locale: string;
};

type HandoverItem = {
  item_id?: string;
  name: string;
  quantity: number;
  unit: string;
  condition?: string;
  photo_url?: string;
  expected_quantity?: number;
};

const DEFAULT_HANDOVER_ITEM: HandoverItem = {
  name: '',
  quantity: 0,
  unit: 'piece',
};

type Handover = {
  id: string;
  handover_type: 'outbound' | 'inbound';
  items: HandoverItem[];
  from_signature_data: string | null;
  to_signature_data: string | null;
  verified_by_both: boolean;
  status: 'pending' | 'completed' | 'disputed' | 'cancelled';
  created_at: string;
};

export function LogisticsHandoverSection({ tripId, locale: _locale }: LogisticsHandoverSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [handoverType, setHandoverType] = useState<'outbound' | 'inbound'>('outbound');
  const [items, setItems] = useState<HandoverItem[]>([{ ...DEFAULT_HANDOVER_ITEM }]);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const queryClient = useQueryClient();

  // Fetch handovers
  const { data: handoversData, isLoading } = useQuery<{ handovers: Handover[] }>({
    queryKey: queryKeys.guide.logistics.handover({ tripId }),
    queryFn: async () => {
      const res = await fetch(`/api/guide/logistics/handover?tripId=${tripId}`);
      if (!res.ok) throw new Error('Failed to fetch handovers');
      return res.json();
    },
  });

  // Create handover mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      handover_type: 'outbound' | 'inbound';
      items: HandoverItem[];
      signature: SignatureData | null;
    }) => {
      const res = await fetch(`/api/guide/logistics/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          handover_type: data.handover_type,
          to_user_id: 'warehouse-user-id', // TODO: Get from context
          items: data.items,
          from_signature: data.signature,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create handover');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Handover berhasil dibuat');
      setShowDialog(false);
      setItems([{ ...DEFAULT_HANDOVER_ITEM }]);
      setSignature(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.guide.logistics.handover({ tripId }),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat handover');
    },
  });

  const handovers = handoversData?.handovers || [];

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 0, unit: 'piece' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof HandoverItem, value: string | number) => {
    const updated = [...items];
    const currentItem = updated[index];
    if (!currentItem) return;
    updated[index] = { ...currentItem, [field]: value } as HandoverItem;
    setItems(updated);
  };

  const handleSubmit = () => {
    if (!signature) {
      toast.error('Tanda tangan wajib diisi');
      return;
    }

    if (items.some((item) => !item.name || item.quantity <= 0)) {
      toast.error('Semua item harus diisi dengan benar');
      return;
    }

    createMutation.mutate({
      handover_type: handoverType,
      items,
      signature,
    });
  };

  if (isLoading) {
    return <LoadingState message="Memuat handover..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Logistics Handover</h3>
          <p className="text-sm text-slate-600">Serah terima barang (warehouse ↔ guide)</p>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm">
          <Package className="mr-2 h-4 w-4" />
          Buat Handover
        </Button>
      </div>

      {handovers.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada handover"
          description="Buat handover untuk serah terima barang"
        />
      ) : (
        <div className="space-y-3">
          {handovers.map((handover) => (
            <Card key={handover.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {handover.handover_type === 'outbound' ? (
                        <ArrowDown className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ArrowUp className="h-4 w-4 text-emerald-600" />
                      )}
                      <span className="font-semibold text-slate-900">
                        {handover.handover_type === 'outbound' ? 'Outbound' : 'Inbound'}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-xs font-medium',
                          handover.status === 'completed' && 'bg-emerald-100 text-emerald-800',
                          handover.status === 'pending' && 'bg-amber-100 text-amber-800',
                          handover.status === 'disputed' && 'bg-red-100 text-red-800',
                        )}
                      >
                        {handover.status === 'completed' && 'Selesai'}
                        {handover.status === 'pending' && 'Pending'}
                        {handover.status === 'disputed' && 'Disputed'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {handover.items.length} item •{' '}
                      {new Date(handover.created_at).toLocaleDateString('id-ID')}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      {handover.verified_by_both ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Sudah ditandatangani kedua pihak</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-amber-600" />
                          <span>Menunggu tanda tangan</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Handover Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Handover</DialogTitle>
            <DialogDescription>
              {handoverType === 'outbound'
                ? 'Terima barang dari warehouse'
                : 'Kembalikan barang ke warehouse'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Handover Type */}
            <div>
              <Label>Jenis Handover</Label>
              <div className="mt-2 flex gap-2">
                <Button
                  variant={handoverType === 'outbound' ? 'default' : 'outline'}
                  onClick={() => setHandoverType('outbound')}
                  className="flex-1"
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Outbound (Terima)
                </Button>
                <Button
                  variant={handoverType === 'inbound' ? 'default' : 'outline'}
                  onClick={() => setHandoverType('inbound')}
                  className="flex-1"
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Inbound (Kembalikan)
                </Button>
              </div>
            </div>

            {/* Items */}
            <div>
              <Label>Items</Label>
              <div className="mt-2 space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 rounded-lg border p-3">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Nama item"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Jumlah"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="flex-1"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        >
                          <option value="piece">Pcs</option>
                          <option value="box">Box</option>
                          <option value="bottle">Botol</option>
                          <option value="liter">Liter</option>
                          <option value="kilogram">Kg</option>
                        </select>
                      </div>
                      {handoverType === 'inbound' && (
                        <Input
                          type="number"
                          placeholder="Expected quantity"
                          value={item.expected_quantity || ''}
                          onChange={(e) =>
                            handleItemChange(index, 'expected_quantity', parseInt(e.target.value) || 0)
                          }
                        />
                      )}
                    </div>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setItems([...items, { ...DEFAULT_HANDOVER_ITEM }])}
                  className="w-full"
                >
                  + Tambah Item
                </Button>
              </div>
            </div>

            {/* Signature */}
            <div>
              <Label>Tanda Tangan *</Label>
              <div className="mt-2">
                <SignaturePad
                  value={signature}
                  onChange={setSignature}
                  required
                  label="Tanda tangan untuk konfirmasi handover"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || !signature}>
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Handover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
