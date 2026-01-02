/**
 * Corporate Budget Client Component
 * Manage department budgets with allocation tracking
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  DollarSign,
  Edit2,
  Loader2,
  PieChart,
  Plus,
  Save,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Budget = {
  id: string;
  department: string;
  fiscal_year: number;
  allocated_amount: number;
  spent_amount: number;
  pending_amount: number;
  alert_threshold: number;
  notes: string | null;
};

type BudgetResponse = {
  budgets: Budget[];
  summary: {
    totalAllocated: number;
    totalSpent: number;
    totalPending: number;
    totalRemaining: number;
    usagePercent: number;
  };
  alertDepartments: string[];
  fiscalYear: number;
};

const DEPARTMENTS = [
  'Marketing',
  'Sales',
  'Engineering',
  'HR',
  'Finance',
  'Operations',
  'Executive',
  'Customer Success',
  'Research',
  'Other',
];

export function BudgetClient() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<Partial<Budget>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<BudgetResponse>({
    queryKey: [...queryKeys.partner.all, 'corporate', 'budget', selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/partner/corporate/budget?year=${selectedYear}`);
      if (!res.ok) throw new Error('Failed to fetch budgets');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (budget: Partial<Budget>) => {
      const res = await fetch('/api/partner/corporate/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget),
      });
      if (!res.ok) throw new Error('Failed to save budget');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Budget berhasil disimpan');
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.partner.all, 'corporate', 'budget'],
      });
      closeDialog();
    },
    onError: () => {
      toast.error('Gagal menyimpan budget');
    },
  });

  const openCreateDialog = () => {
    setEditingBudget(null);
    setFormData({
      department: '',
      fiscal_year: selectedYear,
      allocated_amount: 0,
      alert_threshold: 80,
      notes: '',
    });
    setShowDialog(true);
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({ ...budget });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingBudget(null);
    setFormData({});
  };

  const handleSave = () => {
    if (!formData.department || !formData.allocated_amount) {
      toast.error('Department dan jumlah alokasi wajib diisi');
      return;
    }

    saveMutation.mutate({
      ...formData,
      id: editingBudget?.id,
      fiscal_year: selectedYear,
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const budgets = data?.budgets || [];
  const summary = data?.summary || {
    totalAllocated: 0,
    totalSpent: 0,
    totalPending: 0,
    totalRemaining: 0,
    usagePercent: 0,
  };
  const alertDepartments = data?.alertDepartments || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <PieChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Budget Management</h1>
            <p className="text-sm text-muted-foreground">
              Kelola anggaran perjalanan per departemen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Budget
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alertDepartments.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{alertDepartments.length} departemen</strong> telah melebihi threshold budget:{' '}
            {alertDepartments.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Alokasi</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalAllocated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Terpakai</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalPending)}</p>
          </CardContent>
        </Card>
        <Card className={cn(summary.usagePercent >= 80 && 'border-red-200')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">Penggunaan</span>
            </div>
            <p className="text-2xl font-bold">{summary.usagePercent}%</p>
            <Progress value={summary.usagePercent} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Budgets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget per Departemen</CardTitle>
          <CardDescription>
            Tahun Fiskal {selectedYear} - {budgets.length} departemen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Departemen</th>
                  <th className="text-right p-3">Alokasi</th>
                  <th className="text-right p-3">Terpakai</th>
                  <th className="text-right p-3">Pending</th>
                  <th className="text-right p-3">Sisa</th>
                  <th className="text-center p-3">Penggunaan</th>
                  <th className="text-center p-3 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => {
                  const remaining = budget.allocated_amount - budget.spent_amount - budget.pending_amount;
                  const usage = budget.allocated_amount > 0
                    ? Math.round(((budget.spent_amount + budget.pending_amount) / budget.allocated_amount) * 100)
                    : 0;
                  const isAlert = usage >= budget.alert_threshold;

                  return (
                    <tr key={budget.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{budget.department}</span>
                          {isAlert && (
                            <Badge variant="destructive" className="text-xs">
                              Alert
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(budget.allocated_amount)}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {formatCurrency(budget.spent_amount)}
                      </td>
                      <td className="p-3 text-right text-amber-600">
                        {formatCurrency(budget.pending_amount)}
                      </td>
                      <td className={cn('p-3 text-right', remaining < 0 && 'text-red-600')}>
                        {formatCurrency(remaining)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress
                            value={usage}
                            className={cn('w-20 h-2', isAlert && '[&>div]:bg-red-500')}
                          />
                          <span className="text-xs w-10">{usage}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(budget)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {budgets.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Belum ada budget untuk tahun {selectedYear}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Edit Budget' : 'Tambah Budget Baru'}</DialogTitle>
            <DialogDescription>
              Atur alokasi budget untuk departemen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Departemen</Label>
              <Select
                value={formData.department || ''}
                onValueChange={(v) => setFormData({ ...formData, department: v })}
                disabled={!!editingBudget}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jumlah Alokasi (Rp)</Label>
              <Input
                type="number"
                value={formData.allocated_amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, allocated_amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="100000000"
              />
            </div>

            <div className="space-y-2">
              <Label>Alert Threshold (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.alert_threshold || 80}
                onChange={(e) =>
                  setFormData({ ...formData, alert_threshold: parseInt(e.target.value) || 80 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Notifikasi akan dikirim jika penggunaan melebihi threshold ini
              </p>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan opsional..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

