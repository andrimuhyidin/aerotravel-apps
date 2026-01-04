'use client';

/**
 * Expenses Input Client Component
 * Input pengeluaran darurat dengan upload struk
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Fuel,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { queueMutation } from '@/lib/guide';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

import { ExpensesAiEnhanced } from './expenses-ai-enhanced';

type ExpensesClientProps = {
  tripId: string;
  locale: string;
};

type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  receiptUrl?: string;
  fuelLiters?: number; // Konsumsi BBM dalam liter (hanya untuk kategori fuel/transport)
};

// Standar resep BBM (dalam Rupiah)
const STANDARD_FUEL_COST = {
  boat_trip: 500000, // BBM Kapal
  land_trip: 300000, // BBM Kendaraan
  default: 400000, // Default jika tidak diketahui
};

type ExpenseCategory = {
  value: string;
  label: string;
  iconName?: string;
  description?: string;
};

export function ExpensesClient({ tripId }: ExpensesClientProps) {
  const queryClient = useQueryClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    receiptUrl: '',
    fuelLiters: '', // Konsumsi BBM dalam liter
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedExpenses, setSubmittedExpenses] = useState<Expense[]>([]);

  // Fetch expense categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<{
    data: { categories: ExpenseCategory[] };
  }>({
    queryKey: queryKeys.guide.expenseCategories(),
    queryFn: async () => {
      const res = await fetch('/api/guide/expense-categories');
      if (!res.ok) throw new Error('Failed to fetch expense categories');
      return res.json();
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  const categories = categoriesData?.data?.categories ?? [];

  // Fetch trip info and submitted expenses
  const { data: tripInfo, isLoading: tripInfoLoading } = useQuery({
    queryKey: ['guide', 'trip', 'info', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/preload`);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        trip?: {
          trip_code?: string | null;
          trip_date?: string | null;
          package?: { name?: string | null } | null;
        };
        manifest?: Array<{
          id: string;
          name: string;
          phone?: string;
          type: 'adult' | 'child' | 'infant';
          status: 'pending' | 'boarded' | 'returned';
        }>;
        expenses?: Array<{
          id: string;
          category: string;
          description: string;
          amount: number;
          receiptUrl?: string;
          createdAt?: string;
        }>;
        tripType?: 'boat_trip' | 'land_trip' | null;
      };
      return data;
    },
  });

  // Set submitted expenses from API
  useEffect(() => {
    if (tripInfo?.expenses) {
      setSubmittedExpenses(
        tripInfo.expenses.map((exp) => ({
          id: exp.id,
          category: exp.category,
          description: exp.description || '',
          amount: exp.amount,
          receiptUrl: exp.receiptUrl,
        }))
      );
    }
  }, [tripInfo?.expenses]);

  // Get trip type from preload API (no separate fetch needed)
  const tripType: 'boat_trip' | 'land_trip' | 'unknown' =
    tripInfo?.tripType || 'unknown';

  // Get trip details
  const tripName =
    tripInfo?.trip?.package?.name || tripInfo?.trip?.trip_code || 'Trip';
  const tripDate = tripInfo?.trip?.trip_date
    ? new Date(tripInfo.trip.trip_date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const tripCode = tripInfo?.trip?.trip_code || tripId;

  // Combine local expenses (not yet submitted) with submitted expenses
  const allExpenses = [...submittedExpenses, ...expenses];
  const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const localExpensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate expenses by category
  const expensesByCategory = categories.reduce(
    (acc, cat) => {
      const catExpenses = allExpenses.filter((e) => e.category === cat.value);
      acc[cat.value] = {
        count: catExpenses.length,
        total: catExpenses.reduce((sum, e) => sum + e.amount, 0),
      };
      return acc;
    },
    {} as Record<string, { count: number; total: number }>
  );

  // Calculate per-pax cost (from manifest if available)
  const totalPax = tripInfo?.manifest?.length || 0;

  // Calculate fuel expenses (from all expenses including submitted)
  const fuelExpenses = allExpenses.filter(
    (e) => e?.category === 'fuel' || e?.category === 'transport'
  );
  const totalFuelExpense = fuelExpenses.reduce(
    (sum, e) => sum + (e?.amount ?? 0),
    0
  );
  const totalFuelLiters = fuelExpenses.reduce(
    (sum, e) => sum + (e?.fuelLiters ?? 0),
    0
  );

  // Get standard fuel cost
  const standardFuelCost =
    tripType === 'boat_trip'
      ? STANDARD_FUEL_COST.boat_trip
      : tripType === 'land_trip'
        ? STANDARD_FUEL_COST.land_trip
        : STANDARD_FUEL_COST.default;

  // Calculate variance
  const fuelVariance =
    totalFuelExpense > 0
      ? ((totalFuelExpense - standardFuelCost) / standardFuelCost) * 100
      : 0;

  const hasAbnormalFuelExpense = Math.abs(fuelVariance) > 20; // >20% variance

  const handleAddExpense = () => {
    if (!newExpense.category || !newExpense.amount) return;

    const expense: Expense = {
      id: Date.now().toString(),
      category: newExpense.category,
      description: newExpense.description,
      amount: parseInt(newExpense.amount),
      receiptUrl: newExpense.receiptUrl,
      fuelLiters:
        (newExpense.category === 'fuel' ||
          newExpense.category === 'transport') &&
        newExpense.fuelLiters
          ? parseFloat(newExpense.fuelLiters)
          : undefined,
    };

    setExpenses((prev) => [...prev, expense]);
    setNewExpense({
      category: '',
      description: '',
      amount: '',
      receiptUrl: '',
      fuelLiters: '',
    });
    setShowForm(false);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleReceiptUpload = (file: File) => {
    // Simulate upload - in real app, upload to storage
    setNewExpense((prev) => ({
      ...prev,
      receiptUrl: URL.createObjectURL(file),
    }));
  };

  const handleSubmitAll = async () => {
    if (expenses.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      for (const expense of expenses) {
        const payload = {
          tripId,
          category: expense.category as
            | 'fuel'
            | 'food'
            | 'ticket'
            | 'transport'
            | 'equipment'
            | 'emergency'
            | 'other',
          description: expense.description,
          amount: expense.amount,
          receiptUrl: expense.receiptUrl,
        };

        try {
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            const response = await fetch('/api/guide/expenses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              // Fallback ke offline queue jika API gagal
              await queueMutation('ADD_EXPENSE', payload);
            }
          } else {
            await queueMutation('ADD_EXPENSE', payload);
          }
        } catch {
          // Jika network error, antre ke offline queue
          await queueMutation('ADD_EXPENSE', payload);
        }
      }

      // Kosongkan daftar setelah berhasil dikirim/diantrekan
      setExpenses([]);
      toast.success(`${expenses.length} pengeluaran berhasil dikirim`);

      // Invalidate query to refetch submitted expenses
      void queryClient.invalidateQueries({
        queryKey: ['guide', 'trip', 'info', tripId],
      });
    } catch (error) {
      logger.error('Failed to submit expenses', error, {
        tripId,
        itemCount: expenses.length,
      });
      setSubmitError(
        'Gagal mengirim pengeluaran. Akan dicoba lagi saat online.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* AI Receipt Scanner */}
      <ExpensesAiEnhanced
        tripId={tripId}
        onExpenseAdded={(expense) => {
          // Add to local expenses list
          const newExpense: Expense = {
            id: Date.now().toString(),
            category: expense.category as Expense['category'],
            description: expense.description,
            amount: expense.amount,
            receiptUrl: '',
          };
          setExpenses((prev) => [...prev, newExpense]);
        }}
      />

      <div className="space-y-3">
        {/* Total Summary - Simplified */}
        {allExpenses.length > 0 && (
          <Card className="border-0 bg-emerald-600 text-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Pengeluaran</p>
                  <p className="mt-1 text-2xl font-bold">
                    Rp {totalExpenses.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-right text-xs opacity-85">
                  <p>{allExpenses.length} item</p>
                  {submittedExpenses.length > 0 && (
                    <p className="mt-1">
                      {submittedExpenses.length} sudah disubmit
                    </p>
                  )}
                </div>
              </div>

              {/* Fuel Expense Comparison - Only show if there are fuel expenses */}
              {fuelExpenses.length > 0 && (
                <div className="mt-4 space-y-2 rounded-lg bg-white/10 p-3 text-xs backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    <p className="font-semibold">Konsumsi BBM</p>
                  </div>
                  <div className="space-y-1">
                    {totalFuelLiters > 0 && (
                      <div className="flex justify-between">
                        <span>Total Konsumsi:</span>
                        <span className="font-medium">
                          {totalFuelLiters.toFixed(2)} liter
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Total Biaya:</span>
                      <span className="font-medium">
                        Rp {totalFuelExpense.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Standar Resep:</span>
                      <span className="font-medium">
                        Rp {standardFuelCost.toLocaleString('id-ID')}
                        <span className="ml-1 text-xs opacity-75">
                          (
                          {tripType === 'boat_trip'
                            ? 'Kapal'
                            : tripType === 'land_trip'
                              ? 'Darat'
                              : 'Standar'}
                          )
                        </span>
                      </span>
                    </div>
                    {fuelVariance !== 0 && (
                      <div
                        className={`flex justify-between border-t border-white/20 pt-1 ${
                          hasAbnormalFuelExpense
                            ? 'text-amber-200'
                            : 'text-white/80'
                        }`}
                      >
                        <span>Selisih:</span>
                        <span
                          className={`font-medium ${
                            fuelVariance > 0
                              ? 'text-amber-200'
                              : 'text-emerald-200'
                          }`}
                        >
                          {fuelVariance > 0 ? '+' : ''}
                          {fuelVariance.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {hasAbnormalFuelExpense && (
                    <div className="mt-2 flex items-start gap-2 border-t border-white/20 pt-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-200" />
                      <p className="text-[11px] font-medium text-amber-200">
                        Pengeluaran BBM{' '}
                        {fuelVariance > 0 ? 'melebihi' : 'di bawah'} standar
                        resep lebih dari 20%. Pastikan sesuai dengan kondisi
                        lapangan.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expense List - Simplified: Only show if there are expenses */}
        {allExpenses.length > 0 && (
          <div className="space-y-2">
            {allExpenses.map((expense) => {
              const isSubmitted = submittedExpenses.some(
                (e) => e.id === expense.id
              );
              return (
                <Card
                  key={expense.id}
                  className={
                    isSubmitted
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-amber-200 bg-amber-50/30'
                  }
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {isSubmitted ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                      ) : (
                        <Receipt className="h-5 w-5 flex-shrink-0 text-amber-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {
                            categories.find((c) => c.value === expense.category)
                              ?.label
                          }
                        </p>
                        {expense.description && (
                          <p className="truncate text-xs text-slate-600">
                            {expense.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Rp {expense.amount.toLocaleString('id-ID')}
                      </p>
                      {!isSubmitted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => handleRemoveExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Expense Button */}
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengeluaran
        </Button>

        {/* Add Expense Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Pengeluaran</DialogTitle>
              <DialogDescription>
                Catat pengeluaran darurat selama trip untuk proses reimbursement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Kategori *</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(v) =>
                    setNewExpense((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Jumlah (Rp) *</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  className="mt-1"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Fuel Consumption Field (only for fuel/transport category) */}
              {(newExpense.category === 'fuel' ||
                newExpense.category === 'transport') && (
                <div>
                  <Label>Konsumsi BBM (Liter) - Opsional</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    className="mt-1"
                    value={newExpense.fuelLiters}
                    onChange={(e) =>
                      setNewExpense((prev) => ({
                        ...prev,
                        fuelLiters: e.target.value,
                      }))
                    }
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Catat konsumsi BBM dalam liter untuk perbandingan dengan
                    standar resep
                  </p>
                </div>
              )}

              <div>
                <Label>Keterangan</Label>
                <Textarea
                  placeholder="Deskripsi pengeluaran..."
                  className="mt-1"
                  value={newExpense.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewExpense((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Upload Struk</Label>
                <div className="mt-1">
                  {newExpense.receiptUrl ? (
                    <div className="relative">
                      <img
                        src={newExpense.receiptUrl}
                        alt="Receipt"
                        className="h-32 w-full rounded-lg object-cover"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute right-2 top-2"
                        onClick={() =>
                          setNewExpense((prev) => ({ ...prev, receiptUrl: '' }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Label htmlFor="receipt-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-slate-400 hover:bg-slate-50">
                        <Camera className="h-5 w-5" />
                        <span>Foto Struk</span>
                      </div>
                      <Input
                        id="receipt-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReceiptUpload(file);
                        }}
                      />
                    </Label>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  handleAddExpense();
                  setShowForm(false);
                }}
                disabled={!newExpense.category || !newExpense.amount}
              >
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submit All */}
        {expenses.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    Ada {expenses.length} pengeluaran yang belum disubmit
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    Total: Rp {localExpensesTotal.toLocaleString('id-ID')}.
                    Submit untuk proses reimbursement.
                  </p>
                </div>
              </div>
              <Button
                className="w-full bg-emerald-600 font-semibold hover:bg-emerald-700"
                onClick={handleSubmitAll}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Kirim {expenses.length} Pengeluaran (
                    {localExpensesTotal.toLocaleString('id-ID')})
                  </>
                )}
              </Button>
              {submitError && (
                <p className="rounded bg-red-50 p-2 text-center text-xs text-red-600">
                  {submitError}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info when all expenses submitted */}
        {expenses.length === 0 && submittedExpenses.length > 0 && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Semua pengeluaran sudah disubmit
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Total {submittedExpenses.length} item (Rp{' '}
                    {totalExpenses.toLocaleString('id-ID')}) akan diproses untuk
                    reimbursement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
