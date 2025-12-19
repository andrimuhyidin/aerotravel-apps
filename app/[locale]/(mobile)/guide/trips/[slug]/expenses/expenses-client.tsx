'use client';

/**
 * Expenses Input Client Component
 * Input pengeluaran darurat dengan upload struk
 */

import { AlertTriangle, Camera, Fuel, Plus, Receipt, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const categories = [
  { value: 'fuel', label: 'BBM (Konsumsi BBM)' },
  { value: 'tiket', label: 'Tiket Masuk' },
  { value: 'makan', label: 'Makan/Minum' },
  { value: 'transport', label: 'Transportasi' },
  { value: 'medis', label: 'Medis/P3K' },
  { value: 'lainnya', label: 'Lainnya' },
];

// Standar resep BBM (dalam Rupiah)
const STANDARD_FUEL_COST = {
  boat_trip: 500000, // BBM Kapal
  land_trip: 300000, // BBM Kendaraan
  default: 400000, // Default jika tidak diketahui
};

export function ExpensesClient({ tripId }: ExpensesClientProps) {
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
  const [tripType, setTripType] = useState<'boat_trip' | 'land_trip' | 'unknown'>('unknown');
  const [tripPax, setTripPax] = useState<number>(0);

  // Fetch trip info untuk mendapatkan trip type dan pax
  useEffect(() => {
    const fetchTripInfo = async () => {
      try {
        const res = await fetch(`/api/guide/trips/${tripId}/locations`);
        if (res.ok) {
          const data = (await res.json()) as { tripType?: string; totalPax?: number };
          if (data.tripType) {
            setTripType(data.tripType as 'boat_trip' | 'land_trip');
          }
          if (data.totalPax) {
            setTripPax(data.totalPax);
          }
        }
      } catch {
        // Ignore error, use defaults
      }
    };
    void fetchTripInfo();
  }, [tripId]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate fuel expenses
  const fuelExpenses = expenses.filter((e) => e.category === 'fuel' || e.category === 'transport');
  const totalFuelExpense = fuelExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFuelLiters = fuelExpenses.reduce((sum, e) => sum + (e.fuelLiters || 0), 0);
  
  // Get standard fuel cost
  const standardFuelCost = tripType === 'boat_trip' 
    ? STANDARD_FUEL_COST.boat_trip 
    : tripType === 'land_trip' 
      ? STANDARD_FUEL_COST.land_trip 
      : STANDARD_FUEL_COST.default;
  
  // Calculate variance
  const fuelVariance = totalFuelExpense > 0 
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
      fuelLiters: (newExpense.category === 'fuel' || newExpense.category === 'transport') && newExpense.fuelLiters 
        ? parseFloat(newExpense.fuelLiters) 
        : undefined,
    };

    setExpenses((prev) => [...prev, expense]);
    setNewExpense({ category: '', description: '', amount: '', receiptUrl: '', fuelLiters: '' });
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
          category: expense.category as 'tiket' | 'makan' | 'transport' | 'medis' | 'lainnya',
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
    } catch (error) {
      logger.error('Failed to submit expenses', error, { tripId, itemCount: expenses.length });
      setSubmitError('Gagal mengirim pengeluaran. Akan dicoba lagi saat online.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Trip Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trip #{tripId}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          <p>Pahawang Island Tour</p>
          <p>17 Desember 2024</p>
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card className="border-0 bg-emerald-600 text-white shadow-sm">
        <CardContent className="space-y-2 p-4">
          <div>
            <p className="text-sm opacity-80">Total Pengeluaran</p>
            <p className="text-2xl font-bold">
              Rp {totalExpenses.toLocaleString('id-ID')}
            </p>
            <p className="text-xs opacity-70">{expenses.length} item</p>
          </div>
          {/* Fuel Expense Comparison */}
          {fuelExpenses.length > 0 && (
            <div className="rounded-lg bg-white/10 p-3 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                <p className="font-semibold">Konsumsi BBM</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Total Konsumsi:</span>
                  <span className="font-medium">
                    {totalFuelLiters > 0 ? `${totalFuelLiters.toFixed(2)} liter` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Biaya:</span>
                  <span className="font-medium">Rp {totalFuelExpense.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standar Resep:</span>
                  <span className="font-medium">Rp {standardFuelCost.toLocaleString('id-ID')}</span>
                </div>
                {fuelVariance !== 0 && (
                  <div className={`flex justify-between pt-1 border-t border-white/20 ${
                    hasAbnormalFuelExpense ? 'text-amber-200' : 'text-white/80'
                  }`}>
                    <span>Selisih:</span>
                    <span className={`font-medium ${
                      fuelVariance > 0 ? 'text-amber-200' : 'text-emerald-200'
                    }`}>
                      {fuelVariance > 0 ? '+' : ''}{fuelVariance.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              {hasAbnormalFuelExpense && (
                <div className="mt-2 pt-2 border-t border-white/20 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-200" />
                  <p className="font-medium text-amber-200">
                    Pengeluaran BBM {fuelVariance > 0 ? 'melebihi' : 'di bawah'} standar resep lebih dari 20%.
                    Pastikan sesuai dengan kondisi lapangan dan catat kronologi jika ada kondisi khusus.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense List */}
      {expenses.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-500">DAFTAR PENGELUARAN</h2>
          {expenses.map((expense) => (
            <Card key={expense.id} className="border-0 shadow-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Receipt className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {categories.find((c) => c.value === expense.category)?.label}
                    </p>
                    <p className="text-xs text-slate-500">{expense.description || '-'}</p>
                    {(expense.category === 'fuel' || expense.category === 'transport') && expense.fuelLiters && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Konsumsi: {expense.fuelLiters.toFixed(2)} liter
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    Rp {expense.amount.toLocaleString('id-ID')}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => handleRemoveExpense(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Expense Form */}
      {showForm ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Tambah Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Kategori *</Label>
              <Select
                value={newExpense.category}
                onValueChange={(v) => setNewExpense((prev) => ({ ...prev, category: v }))}
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
                  setNewExpense((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>

            {/* Fuel Consumption Field (only for fuel/transport category) */}
            {(newExpense.category === 'fuel' || newExpense.category === 'transport') && (
              <div>
                <Label>Konsumsi BBM (Liter) - Opsional</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="50.00"
                  className="mt-1"
                  value={newExpense.fuelLiters}
                  onChange={(e) =>
                    setNewExpense((prev) => ({ ...prev, fuelLiters: e.target.value }))
                  }
                />
                <p className="mt-1 text-xs text-slate-500">
                  Catat konsumsi BBM dalam liter untuk perbandingan dengan standar resep
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
                  setNewExpense((prev) => ({ ...prev, description: e.target.value }))
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleAddExpense}
                disabled={!newExpense.category || !newExpense.amount}
              >
                Simpan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      )}

      {/* Submit All */}
      {expenses.length > 0 && (
        <div className="space-y-2">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmitAll}
            disabled={submitting}
          >
            {submitting ? 'Mengirim...' : 'Kirim Laporan Pengeluaran'}
          </Button>
          {submitError && (
            <p className="text-xs text-red-500 text-center">{submitError}</p>
          )}
        </div>
      )}
    </div>
  );
}
