/**
 * Admin Credit Limit Management Client Component
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CreditCard,
  History,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type CreditLimitData = {
  creditLimit: number;
  creditUsed: number;
  availableCredit: number;
  balance: number;
  history: Array<{
    id: string;
    oldLimit: number;
    newLimit: number;
    changeAmount: number;
    reason: string;
    status: string;
    approvedBy?: {
      name: string;
      email: string;
    } | null;
    approvedAt?: string;
    createdBy?: {
      name: string;
      email: string;
    } | null;
    createdAt: string;
  }>;
};

const setCreditLimitSchema = z.object({
  creditLimit: z.string().min(1, 'Credit limit wajib diisi').refine(
    (val) => {
      const num = parseFloat(val.replace(/[^0-9]/g, ''));
      return !isNaN(num) && num >= 0;
    },
    { message: 'Credit limit harus berupa angka positif' }
  ),
  reason: z.string().optional(),
  requireApproval: z.boolean().default(false),
});

type CreditLimitClientProps = {
  partnerId: string;
};

export function CreditLimitClient({ partnerId }: CreditLimitClientProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CreditLimitData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(setCreditLimitSchema) as any,
    defaultValues: {
      creditLimit: '',
      reason: '',
      requireApproval: false,
    },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/partners/${partnerId}/credit-limit`);

      if (!response.ok) {
        throw new Error('Failed to load credit limit data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      logger.error('Failed to load credit limit', error);
      toast.error('Gagal memuat data credit limit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [partnerId]);

  const handleSetCreditLimit = async (
    values: z.infer<typeof setCreditLimitSchema>
  ) => {
    try {
      setSubmitting(true);
      const creditLimit = parseFloat(values.creditLimit.replace(/[^0-9]/g, ''));

      const response = await fetch(
        `/api/admin/partners/${partnerId}/credit-limit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creditLimit,
            reason: values.reason || undefined,
            requireApproval: values.requireApproval,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set credit limit');
      }

      const result = await response.json();
      toast.success(result.message || 'Credit limit berhasil diupdate');

      setDialogOpen(false);
      form.reset();
      await loadData();
    } catch (error) {
      logger.error('Failed to set credit limit', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Gagal mengupdate credit limit'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCreditLimit = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/admin/partners/${partnerId}/credit-limit`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove credit limit');
      }

      toast.success('Credit limit berhasil dihapus');
      setDeleteDialogOpen(false);
      await loadData();
    } catch (error) {
      logger.error('Failed to remove credit limit', error);
      toast.error('Gagal menghapus credit limit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Memuat data credit limit..." />;
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-foreground/70">Gagal memuat data credit limit</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Credit Limit Management</h1>
        <p className="text-sm text-foreground/70">
          Kelola credit limit untuk partner
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Status Credit Limit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-foreground/70 mb-1">Credit Limit</p>
              <p className="text-xl font-semibold">
                {formatCurrency(data.creditLimit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/70 mb-1">Credit Digunakan</p>
              <p className="text-xl font-semibold text-amber-600">
                {formatCurrency(data.creditUsed)}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/70 mb-1">Credit Tersedia</p>
              <p className="text-xl font-semibold text-green-600">
                {formatCurrency(data.availableCredit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/70 mb-1">Saldo Wallet</p>
              <p className="text-xl font-semibold">
                {formatCurrency(data.balance)}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Set/Update Credit Limit
            </Button>
            {data.creditLimit > 0 && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Credit Limit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Perubahan
          </CardTitle>
          <CardDescription>
            History perubahan credit limit untuk partner ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.history.length === 0 ? (
            <p className="text-sm text-foreground/70 text-center py-8">
              Belum ada riwayat perubahan
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Perubahan</TableHead>
                  <TableHead>Limit Lama</TableHead>
                  <TableHead>Limit Baru</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          item.changeAmount >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {item.changeAmount >= 0 ? '+' : ''}
                        {formatCurrency(item.changeAmount)}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(item.oldLimit)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.newLimit)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'approved'
                            ? 'default'
                            : item.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {item.status === 'approved'
                          ? 'Disetujui'
                          : item.status === 'pending'
                            ? 'Pending'
                            : 'Ditolak'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.reason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Set Credit Limit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set/Update Credit Limit</DialogTitle>
            <DialogDescription>
              Set credit limit untuk partner ini. Perubahan besar mungkin memerlukan approval.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSetCreditLimit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="100000000"
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value) {
                            const numValue = parseInt(value, 10);
                            field.onChange(
                              new Intl.NumberFormat('id-ID').format(numValue)
                            );
                          } else {
                            field.onChange('');
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Alasan perubahan credit limit..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requireApproval"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Memerlukan approval (untuk perubahan besar)
                    </FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    form.reset();
                  }}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Set Credit Limit'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Credit Limit?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus credit limit untuk partner ini?
              Credit limit akan diset ke 0.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveCreditLimit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Hapus Credit Limit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

