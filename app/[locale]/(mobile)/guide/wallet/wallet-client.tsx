'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import queryKeys from '@/lib/queries/query-keys';

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

type SalaryRow = {
  id: string;
  period_start: string;
  period_end: string;
  net_amount: number;
  status: string;
  all_docs_uploaded: boolean;
};

type WalletResponse = {
  balance: number;
  transactions: WalletTransaction[];
  salary: SalaryRow[];
};

type WalletClientProps = {
  locale: string;
};

export function WalletClient({ locale: _locale }: WalletClientProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<WalletResponse>({
    queryKey: queryKeys.guide.wallet.balance(),
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet');
      if (!res.ok) {
        throw new Error('Gagal memuat dompet');
      }
      return (await res.json()) as WalletResponse;
    },
  });

  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleWithdraw = async () => {
    const value = Number(amount.replace(/[^0-9]/g, ''));
    if (!value || value <= 0) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/guide/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(body.error ?? 'Gagal mengajukan tarik dana.');
      } else {
        setMessage('Permintaan tarik dana terkirim. Menunggu persetujuan.');
        setAmount('');
        await queryClient.invalidateQueries({ queryKey: queryKeys.guide.wallet.all });
      }
    } catch {
      setMessage('Gagal mengajukan tarik dana. Periksa koneksi internet.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Memuat data dompet...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-600">
        {error.message}
      </div>
    );
  }

  const balance = data?.balance ?? 0;

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-emerald-600 text-white shadow-sm">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs opacity-80">Saldo Dompet</p>
            <p className="text-2xl font-bold">
              Rp {balance.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700/60">
            <Wallet className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Form */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tarik Dana</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-xs text-slate-500">
            Anda dapat mengajukan tarik dana hingga saldo yang tersedia. Permintaan akan
            diperiksa oleh tim keuangan.
          </p>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Contoh: 500000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {message && <p className="text-xs text-slate-600">{message}</p>}
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={submitting || !amount}
            onClick={handleWithdraw}
          >
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            {submitting ? 'Mengajukan...' : 'Ajukan Tarik Dana'}
          </Button>
        </CardContent>
      </Card>

      {/* Salary overview */}
      {data?.salary && data.salary.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ringkasan Gaji</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {data.salary.map((s) => {
              const period = `${s.period_start} s/d ${s.period_end}`;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-2"
                >
                  <div>
                    <p className="font-medium">{period}</p>
                    <p className="text-[11px] text-slate-500">
                      Status: {s.status} • All docs: {s.all_docs_uploaded ? 'Ya' : 'Belum'}
                    </p>
                  </div>
                  <div className="text-right text-[11px]">
                    <p className="font-semibold">
                      Rp {Number(s.net_amount ?? 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      {data?.transactions && data.transactions.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Riwayat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {data.transactions.map((t) => {
              const isCredit = t.transaction_type === 'earning';
              const Icon = isCredit ? ArrowUpCircle : ArrowDownCircle;
              const sign = isCredit ? '+' : '-';
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-2"
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
                        {new Date(t.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {sign} Rp {Number(t.amount ?? 0).toLocaleString('id-ID')}
                    </p>
                    {t.status && (
                      <p className="text-[11px] text-slate-500">Status: {t.status}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
