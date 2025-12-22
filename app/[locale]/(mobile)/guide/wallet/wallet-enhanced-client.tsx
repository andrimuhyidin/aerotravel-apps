/**
 * Enhanced Wallet Client Component
 * Combines all wallet enhancements: analytics, pending earnings, forecast, goals, milestones, insights
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowDownCircle,
    ArrowUpCircle,
    Award,
    BarChart3,
    Building2,
    Calendar,
    CreditCard,
    Download,
    Edit,
    Lightbulb,
    Plus,
    QrCode,
    Receipt,
    Search,
    Target,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCode } from '@/components/qr-code/qr-code';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import queryKeys from '@/lib/queries/query-keys';
import Link from 'next/link';

type WalletTransaction = {
  id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type: string | null;
  status: string | null;
  description: string | null;
  created_at: string;
};

type WalletResponse = {
  balance: number;
  transactions: WalletTransaction[];
  salary: Array<{
    id: string;
    period_start: string;
    period_end: string;
    net_amount: number;
    status: string;
    all_docs_uploaded: boolean;
  }>;
};

type AnalyticsResponse = {
  today: { amount: number; growth: number };
  thisWeek: { amount: number; growth: number };
  thisMonth: { amount: number; growth: number };
  breakdown: { baseFee: number; bonus: number; deductions: number };
  trends: Array<{ month: string; amount: number }>;
  tripBreakdown: Array<{
    tripId: string;
    tripCode: string;
    tripDate: string;
    baseFee: number;
    bonus: number;
    penalty: number;
    net: number;
  }>;
};

type PendingResponse = {
  pending: Array<{
    tripId: string;
    tripCode: string;
    tripDate: string;
    amount: number;
    status: string;
  }>;
  salary: Array<{
    id: string;
    period: string;
    amount: number;
    status: string;
    type: 'salary';
  }>;
  total: number;
};

type ForecastResponse = {
  forecast: number;
  tripCount: number;
  averagePerTrip: number;
  basedOn: string;
};

type GoalsResponse = {
  goals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
    autoSavePercent: number;
    autoSaveEnabled: boolean;
    isCompleted: boolean;
    completedAt: string | null;
    createdAt: string;
  }>;
};

type MilestonesResponse = {
  milestones: Array<{
    id: string;
    type: string;
    name: string;
    description: string | null;
    achievedAt: string;
    data: unknown;
  }>;
};

type InsightsResponse = {
  trend: 'up' | 'down' | 'neutral';
  trendPercent: number;
  performance: 'top' | 'above' | 'average' | 'below';
  percentile: number;
  userMonthlyAverage: number;
  branchAverage: number;
  recommendations: Array<{ type: string; title: string; description: string }>;
  seasonalPattern: unknown;
};

type WalletClientProps = {
  locale: string;
};

export function WalletEnhancedClient({ locale: _locale }: WalletClientProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'transactions' | 'goals'>('overview');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [qrisDialogOpen, setQrisDialogOpen] = useState(false);
  const [qrisCode, setQrisCode] = useState<string | null>(null);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisAmount, setQrisAmount] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalsResponse['goals'][0] | null>(null);
  const [goalForm, setGoalForm] = useState<{
    name: string;
    targetAmount: string;
    currentAmount?: string;
    autoSavePercent: string;
    autoSaveEnabled: boolean;
  }>({
    name: '',
    targetAmount: '',
    currentAmount: undefined,
    autoSavePercent: '0',
    autoSaveEnabled: false,
  });

  // Main wallet data
  const { data: walletData, isLoading: walletLoading, error: walletError, refetch: refetchWallet } = useQuery<WalletResponse>({
    queryKey: queryKeys.guide.wallet.balance(),
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet');
      if (!res.ok) throw new Error('Gagal memuat dompet');
      return (await res.json()) as WalletResponse;
    },
  });


  // Analytics
  const { data: analyticsData } = useQuery<AnalyticsResponse>({
    queryKey: queryKeys.guide.wallet.analytics('monthly'),
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet/analytics?period=monthly&months=6');
      if (!res.ok) throw new Error('Gagal memuat analytics');
      return (await res.json()) as AnalyticsResponse;
    },
    enabled: activeTab === 'analytics' || activeTab === 'overview',
  });

  // Pending earnings
  const { data: pendingData } = useQuery<PendingResponse>({
    queryKey: queryKeys.guide.wallet.pending(),
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet/pending');
      if (!res.ok) throw new Error('Gagal memuat pending earnings');
      return (await res.json()) as PendingResponse;
    },
    enabled: activeTab === 'overview',
  });

  // Forecast
  const { data: forecastData } = useQuery<ForecastResponse>({
    queryKey: queryKeys.guide.wallet.forecast(),
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet/forecast');
      if (!res.ok) throw new Error('Gagal memuat forecast');
      return (await res.json()) as ForecastResponse;
    },
    enabled: activeTab === 'overview',
  });

  // Goals
  const { data: goalsData } = useQuery<GoalsResponse>({
    queryKey: queryKeys.guide.wallet.goals(),
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet/goals');
      if (!res.ok) {
        // If 503, migration not applied - return empty
        if (res.status === 503) {
          return { goals: [] };
        }
        throw new Error('Gagal memuat goals');
      }
      return (await res.json()) as GoalsResponse;
    },
    enabled: activeTab === 'goals' || activeTab === 'overview',
    retry: false, // Don't retry if migration not applied
  });

  // Milestones
  const { data: milestonesData } = useQuery<MilestonesResponse>({
    queryKey: queryKeys.guide.wallet.milestones(),
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet/milestones');
      if (!res.ok) {
        // If table doesn't exist, return empty
        if (res.status === 500) {
          return { milestones: [] };
        }
        throw new Error('Gagal memuat milestones');
      }
      return (await res.json()) as MilestonesResponse;
    },
    enabled: activeTab === 'overview',
    retry: false, // Don't retry if migration not applied
  });

  // Insights
  const { data: insightsData } = useQuery<InsightsResponse>({
    queryKey: queryKeys.guide.wallet.insights(),
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet/insights');
      if (!res.ok) throw new Error('Gagal memuat insights');
      return (await res.json()) as InsightsResponse;
    },
    enabled: activeTab === 'overview',
  });

  // Transactions with filters
  const { data: transactionsData } = useQuery({
    queryKey: queryKeys.guide.wallet.transactions({ type: transactionFilter, search: transactionSearch }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (transactionFilter !== 'all') params.append('type', transactionFilter);
      if (transactionSearch) params.append('search', transactionSearch);
      const res = await fetch(`/api/guide/wallet/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat transaksi');
      return (await res.json()) as { transactions: WalletTransaction[]; total: number; grouped: Record<string, WalletTransaction[]> };
    },
    enabled: activeTab === 'transactions',
  });

  // Fetch bank accounts
  const { data: bankAccountsData } = useQuery<{ accounts: Array<{ id: string; bank_name: string; account_number: string; account_holder_name: string; status: string; is_default: boolean }> }>({
    queryKey: queryKeys.guide.wallet.bankAccounts(),
    queryFn: async () => {
      const res = await fetch('/api/guide/bank-accounts');
      if (!res.ok) throw new Error('Failed to fetch bank accounts');
      return res.json();
    },
  });

  const approvedBankAccounts = bankAccountsData?.accounts.filter((a) => a.status === 'approved') || [];
  const defaultBankAccount = approvedBankAccounts.find((a) => a.is_default) || approvedBankAccounts[0];

  // Set default bank account on load
  useEffect(() => {
    if (defaultBankAccount && !selectedBankAccount && approvedBankAccounts.length > 0) {
      setSelectedBankAccount(defaultBankAccount.id);
    }
  }, [defaultBankAccount, selectedBankAccount, approvedBankAccounts.length]);

  const handleWithdraw = async (quickAction?: 'all' | 'half' | 'preset', presetAmount?: number) => {
    const balance = walletData?.balance ?? 0;
    let amount = 0;

    if (quickAction === 'all') {
      amount = balance;
    } else if (quickAction === 'half') {
      amount = Math.floor(balance / 2);
    } else if (quickAction === 'preset' && presetAmount) {
      amount = presetAmount;
    } else {
      const value = Number(withdrawAmount.replace(/[^0-9]/g, ''));
      if (!value || value <= 0) return;
      amount = value;
    }

    setSubmitting(true);
    setMessage(null);

    // Validate bank account
    if (approvedBankAccounts.length === 0) {
      setMessage('Silakan tambahkan rekening bank terlebih dahulu');
      return;
    }

    const bankAccountId = selectedBankAccount || defaultBankAccount?.id;
    if (!bankAccountId) {
      setMessage('Silakan pilih rekening bank');
      return;
    }

    try {
      const res = await fetch('/api/guide/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          quickAction,
          presetAmount,
          bank_account_id: bankAccountId,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(body.error ?? 'Gagal mengajukan tarik dana.');
      } else {
        setMessage('Permintaan tarik dana terkirim. Menunggu persetujuan.');
        setWithdrawAmount('');
        await queryClient.invalidateQueries({ queryKey: queryKeys.guide.wallet.all });
      }
    } catch {
      setMessage('Gagal mengajukan tarik dana. Periksa koneksi internet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (transactionFilter !== 'all') params.append('type', transactionFilter);
      if (transactionSearch) params.append('search', transactionSearch);
      params.append('export', 'csv');
      const res = await fetch(`/api/guide/wallet/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      setMessage('Gagal export transaksi');
    }
  };

  // Goal mutations
  const createGoalMutation = useMutation({
    mutationFn: async (data: { name: string; targetAmount: number; autoSavePercent?: number; autoSaveEnabled?: boolean }) => {
      const res = await fetch('/api/guide/wallet/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error.error || 'Gagal membuat goal');
      }
      return (await res.json()) as { goal: GoalsResponse['goals'][0] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.wallet.goals() });
      setGoalDialogOpen(false);
      setGoalForm({ name: '', targetAmount: '', currentAmount: undefined, autoSavePercent: '0', autoSaveEnabled: false });
      setEditingGoal(null);
      setMessage('Goal berhasil dibuat');
    },
    onError: (error: Error) => {
      setMessage(error.message);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; targetAmount: number; currentAmount: number; autoSavePercent: number; autoSaveEnabled: boolean }> }) => {
      const res = await fetch(`/api/guide/wallet/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error.error || 'Gagal mengupdate goal');
      }
      return (await res.json()) as { goal: GoalsResponse['goals'][0] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.wallet.goals() });
      setGoalDialogOpen(false);
      setGoalForm({ name: '', targetAmount: '', currentAmount: undefined, autoSavePercent: '0', autoSaveEnabled: false });
      setEditingGoal(null);
      setMessage('Goal berhasil diupdate');
    },
    onError: (error: Error) => {
      setMessage(error.message);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/guide/wallet/goals/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error.error || 'Gagal menghapus goal');
      }
      return (await res.json()) as { success: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.wallet.goals() });
      setMessage('Goal berhasil dihapus');
    },
    onError: (error: Error) => {
      setMessage(error.message);
    },
  });

  const handleOpenGoalDialog = (goal?: GoalsResponse['goals'][0]) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalForm({
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        autoSavePercent: goal.autoSavePercent.toString(),
        autoSaveEnabled: goal.autoSaveEnabled,
      });
    } else {
      setEditingGoal(null);
      setGoalForm({ name: '', targetAmount: '', currentAmount: undefined, autoSavePercent: '0', autoSaveEnabled: false });
    }
    setGoalDialogOpen(true);
  };

  const handleSubmitGoal = () => {
    const targetAmount = Number(goalForm.targetAmount.replace(/[^0-9]/g, ''));
    const autoSavePercent = Number(goalForm.autoSavePercent);
    const currentAmount = goalForm.currentAmount ? Number(goalForm.currentAmount.replace(/[^0-9]/g, '')) : undefined;

    if (!goalForm.name.trim() || !targetAmount || targetAmount <= 0) {
      setMessage('Nama dan target amount harus diisi');
      return;
    }

    if (editingGoal) {
      const updateData: {
        name: string;
        targetAmount: number;
        autoSavePercent: number;
        autoSaveEnabled: boolean;
        currentAmount?: number;
      } = {
        name: goalForm.name.trim(),
        targetAmount,
        autoSavePercent,
        autoSaveEnabled: goalForm.autoSaveEnabled,
      };
      if (currentAmount !== undefined) {
        updateData.currentAmount = currentAmount;
      }
      updateGoalMutation.mutate({
        id: editingGoal.id,
        data: updateData,
      });
    } else {
      createGoalMutation.mutate({
        name: goalForm.name.trim(),
        targetAmount,
        autoSavePercent,
        autoSaveEnabled: goalForm.autoSaveEnabled,
      });
    }
  };

  if (walletLoading && !walletData) {
    return <LoadingState variant="skeleton-card" message="Memuat data dompet..." />;
  }

  if (walletError) {
    return (
      <ErrorState
        message={walletError instanceof Error ? walletError.message : 'Gagal memuat data dompet'}
        onRetry={() => void refetchWallet()}
        variant="card"
      />
    );
  }

  const balance = walletData?.balance ?? 0;

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <Card className="border-0 bg-emerald-600 text-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs opacity-80">Saldo Dompet</p>
              <p className="text-2xl font-bold">
                Rp {balance.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700/60">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQrisDialogOpen(true)}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QRIS Tips
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 border-b-2 pb-2 text-sm font-medium ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 border-b-2 pb-2 text-sm font-medium ${
            activeTab === 'analytics'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 border-b-2 pb-2 text-sm font-medium ${
            activeTab === 'transactions'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Transaksi
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 border-b-2 pb-2 text-sm font-medium ${
            activeTab === 'goals'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Goals
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Earnings Summary */}
          {analyticsData && analyticsData.today && analyticsData.thisWeek && analyticsData.thisMonth && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Ringkasan Pemasukan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-xs text-slate-500">Hari Ini</p>
                    <p className="font-semibold">
                      Rp {(analyticsData.today.amount ?? 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {analyticsData.today.growth !== undefined && analyticsData.today.growth !== 0 && (
                    <div className={`flex items-center gap-1 ${analyticsData.today.growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {analyticsData.today.growth > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-xs">
                        {analyticsData.today.growth > 0 ? '+' : ''}
                        {analyticsData.today.growth.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-xs text-slate-500">Minggu Ini</p>
                    <p className="font-semibold">
                      Rp {(analyticsData.thisWeek.amount ?? 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {analyticsData.thisWeek.growth !== undefined && analyticsData.thisWeek.growth !== 0 && (
                    <div className={`flex items-center gap-1 ${analyticsData.thisWeek.growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {analyticsData.thisWeek.growth > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-xs">
                        {analyticsData.thisWeek.growth > 0 ? '+' : ''}
                        {analyticsData.thisWeek.growth.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-xs text-slate-500">Bulan Ini</p>
                    <p className="font-semibold">
                      Rp {(analyticsData.thisMonth.amount ?? 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {analyticsData.thisMonth.growth !== undefined && analyticsData.thisMonth.growth !== 0 && (
                    <div className={`flex items-center gap-1 ${analyticsData.thisMonth.growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {analyticsData.thisMonth.growth > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-xs">
                        {analyticsData.thisMonth.growth > 0 ? '+' : ''}
                        {analyticsData.thisMonth.growth.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Earnings */}
          {pendingData && pendingData.total !== undefined && pendingData.total > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Pemasukan Tertunda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-slate-600 font-medium">
                  Total: Rp {(pendingData.total ?? 0).toLocaleString('id-ID')}
                </p>
                {pendingData.pending && Array.isArray(pendingData.pending) && pendingData.pending.slice(0, 3).map((p) => {
                  if (!p || !p.tripId) return null;
                  return (
                    <div
                      key={p.tripId}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-2"
                    >
                      <div>
                        <p className="font-medium">{p.tripCode ?? p.tripId}</p>
                        <p className="text-[11px] text-slate-500">{p.tripDate ?? '-'}</p>
                      </div>
                      <p className="font-semibold text-emerald-600">
                        +Rp {(p.amount ?? 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Forecast */}
          {forecastData && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Forecast Bulan Depan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-2xl font-bold text-emerald-600">
                  Rp {forecastData.forecast.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Berdasarkan {forecastData.tripCount} trip terjadwal
                  {forecastData.basedOn === 'historical_average' && ' (estimasi dari rata-rata historis)'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Insights & Recommendations */}
          {insightsData && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Insights & Rekomendasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Performance:</span>
                  <span className={`font-semibold ${
                    insightsData.performance === 'top' ? 'text-emerald-600' :
                    insightsData.performance === 'above' ? 'text-blue-600' :
                    insightsData.performance === 'below' ? 'text-red-600' : 'text-slate-600'
                  }`}>
                    Top {insightsData.percentile}%
                  </span>
                </div>
                {insightsData.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-600">Rekomendasi:</p>
                    {insightsData.recommendations.map((rec, idx) => (
                      <div key={idx} className="rounded-lg bg-blue-50 p-2 text-xs">
                        <p className="font-medium">{rec.title}</p>
                        <p className="text-slate-600">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Milestones */}
          {milestonesData && milestonesData.milestones.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Pencapaian
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {milestonesData.milestones.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-lg bg-yellow-50 p-2"
                  >
                    <Award className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(m.achievedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Smart Withdraw */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Tarik Dana</CardTitle>
                <Link
                  href={`/${_locale}/guide/wallet/bank-accounts`}
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  <CreditCard className="mr-1 inline h-3 w-3" />
                  Kelola Rekening
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-xs text-slate-500">
                Anda dapat mengajukan tarik dana hingga saldo yang tersedia.
              </p>

              {/* Bank Account Selection */}
              {approvedBankAccounts.length > 0 ? (
                <div>
                  <Label htmlFor="bank_account" className="text-xs">
                    Rekening Tujuan
                  </Label>
                  <Select
                    value={selectedBankAccount || defaultBankAccount?.id || ''}
                    onValueChange={setSelectedBankAccount}
                  >
                    <SelectTrigger id="bank_account">
                      <SelectValue placeholder="Pilih rekening" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedBankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{account.bank_name}</div>
                              <div className="text-xs text-slate-500">
                                {account.account_number} • {account.account_holder_name}
                                {account.is_default && ' (Utama)'}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-900">
                        Belum ada rekening bank yang disetujui
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        Tambahkan rekening bank terlebih dahulu untuk melakukan penarikan dana.
                      </p>
                      <Link
                        href={`/${_locale}/guide/wallet/bank-accounts`}
                        className="mt-2 inline-block"
                      >
                        <Button size="sm" variant="outline" className="text-xs">
                          <Plus className="mr-1 h-3 w-3" />
                          Tambah Rekening Bank
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWithdraw('half')}
                  disabled={submitting || balance < 100000}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWithdraw('all')}
                  disabled={submitting || balance < 50000}
                >
                  Tarik Semua
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWithdraw('preset', 1000000)}
                  disabled={submitting || balance < 1000000}
                >
                  Rp 1 Juta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWithdraw('preset', 2500000)}
                  disabled={submitting || balance < 2500000}
                >
                  Rp 2.5 Juta
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  className="flex-1"
                  placeholder="Atau masukkan jumlah"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={submitting || !withdrawAmount}
                  onClick={() => handleWithdraw()}
                >
                  {submitting ? '...' : 'Tarik'}
                </Button>
              </div>

              {message && (
                <p className={`text-xs ${message.includes('Gagal') ? 'text-red-600' : 'text-slate-600'}`}>
                  {message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-4">
          {/* Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Breakdown Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Base Fee:</span>
                <span className="font-semibold">Rp {analyticsData.breakdown.baseFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Bonus:</span>
                <span className="font-semibold text-emerald-600">
                  +Rp {analyticsData.breakdown.bonus.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Penalty:</span>
                <span className="font-semibold text-red-600">
                  -Rp {analyticsData.breakdown.deductions.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-lg">
                  Rp {(analyticsData.breakdown.baseFee + analyticsData.breakdown.bonus - analyticsData.breakdown.deductions).toLocaleString('id-ID')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Trip Breakdown */}
          {analyticsData.tripBreakdown.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Detail Per Trip</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {analyticsData.tripBreakdown.map((trip) => (
                  <div
                    key={trip.tripId}
                    className="rounded-lg bg-slate-50 p-3"
                  >
                    <p className="font-medium">{trip.tripCode}</p>
                    <p className="text-[11px] text-slate-500 mb-2">{trip.tripDate}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Base:</span>
                        <span>Rp {trip.baseFee.toLocaleString('id-ID')}</span>
                      </div>
                      {trip.bonus > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Bonus:</span>
                          <span>+Rp {trip.bonus.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {trip.penalty > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Penalty:</span>
                          <span>-Rp {trip.penalty.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Net:</span>
                        <span>Rp {trip.net.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-2">
              <div className="flex gap-2">
                <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="earning">Pendapatan</SelectItem>
                    <SelectItem value="withdraw_request">Tarik Dana</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleExportTransactions}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari transaksi..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          {transactionsData && transactionsData.transactions.length > 0 ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Riwayat Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs">
                {Object.entries(transactionsData.grouped || {}).map(([date, transactions]) => (
                  <div key={date}>
                    <p className="text-[11px] font-medium text-slate-500 mb-1">
                      {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {transactions.map((t) => {
                      const isCredit = t.transaction_type === 'earning';
                      const Icon = isCredit ? ArrowUpCircle : ArrowDownCircle;
                      const sign = isCredit ? '+' : '-';
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-lg bg-slate-50 p-2 mb-1"
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              className={
                                isCredit
                                  ? 'h-4 w-4 text-emerald-600'
                                  : 'h-4 w-4 text-slate-500'
                              }
                            />
                            <div>
                              <p className="font-medium">
                                {t.transaction_type === 'earning'
                                  ? 'Pendapatan'
                                  : t.transaction_type === 'withdraw_request'
                                    ? 'Permintaan Tarik'
                                    : 'Transaksi Dompet'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${isCredit ? 'text-emerald-600' : 'text-slate-600'}`}>
                              {sign} Rp {Number(t.amount ?? 0).toLocaleString('id-ID')}
                            </p>
                            {t.status && (
                              <p className="text-[11px] text-slate-500">Status: {t.status}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={Receipt}
              title="Tidak ada transaksi"
              description="Riwayat transaksi akan muncul di sini setelah ada aktivitas wallet"
              variant="subtle"
            />
          )}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {/* Create Goal Button */}
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleOpenGoalDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat Goal Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Edit Goal' : 'Buat Goal Baru'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-name">Nama Goal</Label>
                  <Input
                    id="goal-name"
                    placeholder="Contoh: Liburan ke Bali"
                    value={goalForm.name}
                    onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target Amount (Rp)</Label>
                  <Input
                    id="goal-target"
                    type="text"
                    placeholder="Contoh: 5000000"
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-autosave">Auto-Save Percentage</Label>
                  <Input
                    id="goal-autosave"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={goalForm.autoSavePercent}
                    onChange={(e) => setGoalForm({ ...goalForm, autoSavePercent: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    Persentase dari setiap earning yang akan otomatis disimpan ke goal ini
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="goal-enabled">Aktifkan Auto-Save</Label>
                  <Switch
                    id="goal-enabled"
                    checked={goalForm.autoSaveEnabled}
                    onCheckedChange={(checked) => setGoalForm({ ...goalForm, autoSaveEnabled: checked })}
                  />
                </div>
                {editingGoal && (
                  <div className="space-y-2">
                    <Label htmlFor="goal-current">Current Amount (Rp) - Optional</Label>
                    <Input
                      id="goal-current"
                      type="text"
                      placeholder={`Saat ini: Rp ${editingGoal.currentAmount.toLocaleString('id-ID')}`}
                      value={goalForm.currentAmount || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setGoalForm({ ...goalForm, currentAmount: value });
                      }}
                    />
                    <p className="text-xs text-slate-500">
                      Kosongkan jika tidak ingin mengubah current amount
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSubmitGoal}
                    disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                  >
                    {createGoalMutation.isPending || updateGoalMutation.isPending
                      ? 'Menyimpan...'
                      : editingGoal
                        ? 'Update Goal'
                        : 'Buat Goal'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGoalDialogOpen(false);
                      setEditingGoal(null);
                      setGoalForm({ name: '', targetAmount: '', currentAmount: undefined, autoSavePercent: '0', autoSaveEnabled: false });
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Goals List */}
          {goalsData && goalsData.goals.length > 0 ? (
            goalsData.goals.map((goal) => (
              <Card key={goal.id} className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {goal.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenGoalDialog(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus goal "${goal.name}"?`)) {
                            deleteGoalMutation.mutate(goal.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">
                        Rp {goal.currentAmount.toLocaleString('id-ID')} / Rp {goal.targetAmount.toLocaleString('id-ID')}
                      </span>
                      <span className="font-semibold">{goal.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      />
                    </div>
                  </div>
                  {goal.autoSaveEnabled && (
                    <p className="text-xs text-slate-500">
                      Auto-save: {goal.autoSavePercent}% dari setiap earning
                    </p>
                  )}
                  {goal.isCompleted && (
                    <p className="text-xs text-emerald-600 font-medium">
                      ✅ Tercapai pada {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString('id-ID') : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center text-sm text-slate-500">
                Belum ada savings goal. Buat goal pertama Anda!
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* QRIS Dialog */}
      <Dialog open={qrisDialogOpen} onOpenChange={setQrisDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Generate QRIS untuk Tips
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!qrisCode ? (
              <>
                <div className="space-y-2">
                  <Label>Jumlah Tips (Opsional)</Label>
                  <Input
                    type="text"
                    placeholder="Contoh: 50000"
                    value={qrisAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setQrisAmount(value);
                    }}
                  />
                  <p className="text-xs text-slate-500">
                    Kosongkan untuk menggunakan preset (Rp 50.000). Tamu bisa ubah saat scan.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    setQrisLoading(true);
                    try {
                      const amount = qrisAmount ? Number(qrisAmount) : undefined;
                      const res = await fetch('/api/guide/wallet/qris', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount }),
                      });
                      if (!res.ok) {
                        const error = (await res.json()) as { error?: string };
                        throw new Error(error.error || 'Gagal membuat QRIS');
                      }
                      const data = (await res.json()) as {
                        qris_code: string;
                        qris_url: string;
                        expires_at: string;
                      };
                      setQrisCode(data.qris_code || data.qris_url);
                      setQrisUrl(data.qris_url);
                      setMessage('QRIS berhasil dibuat. Scan dengan aplikasi pembayaran Anda.');
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : 'Gagal membuat QRIS');
                    } finally {
                      setQrisLoading(false);
                    }
                  }}
                  disabled={qrisLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {qrisLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat QRIS...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate QRIS
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <QRCode
                    value={qrisCode}
                    size={250}
                    title="Scan untuk Memberikan Tips"
                    description="Gunakan aplikasi pembayaran (GoPay, OVO, DANA, dll) untuk scan QR code ini"
                  />
                </div>
                {qrisUrl && (
                  <div className="text-center">
                    <p className="text-xs text-slate-600 mb-2">Atau buka link berikut:</p>
                    <a
                      href={qrisUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline break-all"
                    >
                      {qrisUrl}
                    </a>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setQrisCode(null);
                    setQrisUrl(null);
                    setQrisAmount('');
                  }}
                  className="w-full"
                >
                  Buat QRIS Baru
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

