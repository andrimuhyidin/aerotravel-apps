/**
 * Inventory Audit Client Component
 * Stock opname UI with variance detection
 */

'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/utils/logger';

type InventoryItem = {
  id: string;
  name: string;
  sku?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  unitCost: number;
  isLowStock: boolean;
};

type AuditRecord = {
  id: string;
  inventoryId: string;
  itemName: string;
  itemUnit: string;
  itemSku: string | null;
  stockBefore: number;
  stockAfter: number;
  variance: number;
  variancePercent: number;
  isAnomaly: boolean;
  notes: string | null;
  createdAt: string;
  createdBy: string;
};

type AuditItem = {
  inventoryId: string;
  name: string;
  unit: string;
  currentStock: number;
  actualStock: number | null;
  notes: string;
};

type InventoryAuditClientProps = {
  locale: string;
};

export function InventoryAuditClient({ locale }: InventoryAuditClientProps) {
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showNewAudit, setShowNewAudit] = useState(false);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAudits();
    fetchItems();
  }, []);

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/admin/inventory/audit?limit=50');
      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits || []);
      }
    } catch (error) {
      logger.error('Failed to fetch audits', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/inventory');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      logger.error('Failed to fetch items', error);
    }
  };

  const startNewAudit = () => {
    // Initialize audit items from current inventory
    const initialItems: AuditItem[] = items.map((item) => ({
      inventoryId: item.id,
      name: item.name,
      unit: item.unit,
      currentStock: item.currentStock,
      actualStock: null,
      notes: '',
    }));
    setAuditItems(initialItems);
    setSessionNotes('');
    setShowNewAudit(true);
  };

  const updateAuditItem = (
    inventoryId: string,
    field: 'actualStock' | 'notes',
    value: number | string | null
  ) => {
    setAuditItems((prev) =>
      prev.map((item) =>
        item.inventoryId === inventoryId ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateVariance = (current: number, actual: number | null) => {
    if (actual === null) return { variance: 0, percent: 0, isAnomaly: false };
    const variance = actual - current;
    const percent = current > 0 ? (variance / current) * 100 : 0;
    return {
      variance,
      percent,
      isAnomaly: Math.abs(percent) > 10,
    };
  };

  const submitAudit = async () => {
    // Filter items that have been audited (actualStock is set)
    const itemsToSubmit = auditItems
      .filter((item) => item.actualStock !== null)
      .map((item) => ({
        inventoryId: item.inventoryId,
        actualStock: item.actualStock as number,
        notes: item.notes || undefined,
      }));

    if (itemsToSubmit.length === 0) {
      toast.error('Masukkan minimal 1 item untuk diaudit');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/inventory/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToSubmit,
          sessionNotes: sessionNotes || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        if (data.summary.anomalyCount > 0) {
          toast.warning(`⚠️ Ditemukan ${data.summary.anomalyCount} item dengan variance >10%`);
        }
        setShowNewAudit(false);
        fetchAudits();
        fetchItems();
      } else {
        toast.error(data.error || 'Gagal menyimpan audit');
      }
    } catch (error) {
      logger.error('Failed to submit audit', error);
      toast.error('Gagal menyimpan audit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary stats
  const anomalyCount = audits.filter((a) => a.isAnomaly).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/console/operations/inventory`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Stock Opname</h1>
            <p className="text-muted-foreground">
              Audit stok dan tracking variance
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAudits}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={startNewAudit}>
            <Plus className="h-4 w-4 mr-2" />
            Mulai Opname
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{audits.length}</p>
                <p className="text-xs text-muted-foreground">Total Audit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{anomalyCount}</p>
                <p className="text-xs text-muted-foreground">Anomaly Detected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {audits.length - anomalyCount}
                </p>
                <p className="text-xs text-muted-foreground">Normal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Audit</CardTitle>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Belum ada riwayat audit</p>
              <Button className="mt-4" onClick={startNewAudit}>
                <Plus className="h-4 w-4 mr-2" />
                Mulai Opname Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Sebelum</TableHead>
                  <TableHead className="text-right">Sesudah</TableHead>
                  <TableHead className="text-right">Selisih</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="text-sm">
                      {format(new Date(audit.createdAt), 'dd MMM yyyy HH:mm', {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{audit.itemName}</p>
                        {audit.itemSku && (
                          <p className="text-xs text-muted-foreground">
                            SKU: {audit.itemSku}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {audit.stockBefore} {audit.itemUnit}
                    </TableCell>
                    <TableCell className="text-right">
                      {audit.stockAfter} {audit.itemUnit}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          audit.variance > 0
                            ? 'text-green-600'
                            : audit.variance < 0
                              ? 'text-red-600'
                              : ''
                        }
                      >
                        {audit.variance > 0 ? '+' : ''}
                        {audit.variance} ({audit.variancePercent.toFixed(1)}%)
                      </span>
                    </TableCell>
                    <TableCell>
                      {audit.isAnomaly ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Anomaly
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {audit.createdBy}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Audit Dialog */}
      <Dialog open={showNewAudit} onOpenChange={setShowNewAudit}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Stock Opname Baru
            </DialogTitle>
            <DialogDescription>
              Masukkan jumlah aktual stok untuk setiap item. Item dengan variance
              &gt;10% akan ditandai sebagai anomaly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Session Notes */}
            <div className="space-y-2">
              <Label>Catatan Sesi (Opsional)</Label>
              <Textarea
                placeholder="Contoh: Opname bulanan Desember 2025"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right w-28">Sistem</TableHead>
                    <TableHead className="text-right w-32">Aktual</TableHead>
                    <TableHead className="text-right w-28">Selisih</TableHead>
                    <TableHead className="w-40">Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditItems.map((item) => {
                    const calc = calculateVariance(
                      item.currentStock,
                      item.actualStock
                    );
                    return (
                      <TableRow key={item.inventoryId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.unit}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.currentStock}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            className="w-full text-right"
                            value={item.actualStock ?? ''}
                            onChange={(e) =>
                              updateAuditItem(
                                item.inventoryId,
                                'actualStock',
                                e.target.value ? parseInt(e.target.value, 10) : null
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {item.actualStock !== null && (
                            <span
                              className={`font-medium ${
                                calc.isAnomaly
                                  ? 'text-red-600'
                                  : calc.variance !== 0
                                    ? 'text-amber-600'
                                    : 'text-green-600'
                              }`}
                            >
                              {calc.variance > 0 ? '+' : ''}
                              {calc.variance}
                              {calc.isAnomaly && (
                                <AlertTriangle className="h-3 w-3 inline ml-1" />
                              )}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Catatan..."
                            className="w-full text-sm"
                            value={item.notes}
                            onChange={(e) =>
                              updateAuditItem(
                                item.inventoryId,
                                'notes',
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewAudit(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button onClick={submitAudit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Opname
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

