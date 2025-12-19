'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type ConsentFormProps = {
  locale: string;
  userId: string;
};

const TERMS_CONTENT = `
## Syarat dan Ketentuan Layanan Aero Travel

### 1. Definisi
- "Aero Travel" adalah penyedia jasa perjalanan wisata bahari
- "Pelanggan" adalah pengguna yang memesan layanan

### 2. Pemesanan & Pembayaran
- Pemesanan dianggap sah setelah pembayaran DP minimal 50%
- Pelunasan maksimal H-3 sebelum keberangkatan
- Pembatalan akan dikenakan biaya sesuai kebijakan

### 3. Kebijakan Pembatalan
- H-7 atau lebih: Refund 75%
- H-3 s/d H-6: Refund 50%
- H-1 s/d H-2: Refund 25%
- Hari-H: Tidak ada refund

### 4. Keselamatan
- Peserta wajib mengikuti instruksi guide
- Peserta bertanggung jawab atas keselamatan pribadi
- Aero Travel menyediakan asuransi perjalanan dasar

### 5. Force Majeure
Aero Travel tidak bertanggung jawab atas pembatalan akibat:
- Cuaca buruk / bencana alam
- Kebijakan pemerintah
- Kondisi darurat lainnya

### 6. Persetujuan Data
Dengan menyetujui, Anda mengizinkan Aero Travel untuk:
- Menyimpan data pribadi untuk keperluan pemesanan
- Menghubungi via WhatsApp/Email untuk informasi trip
- Menggunakan foto perjalanan untuk keperluan promosi
`;

export function ConsentForm({ locale, userId }: ConsentFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!agreed) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update consent in users table using existing columns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('users')
        .update({
          is_contract_signed: true,
          contract_signed_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Consent update error:', updateError);
        throw updateError;
      }

      // Fetch user role to determine redirect
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = (profile as any)?.role as string | undefined;

      // Role-based redirect map
      const roleRedirectMap: Record<string, string> = {
        super_admin: `/${locale}/console`,
        investor: `/${locale}/console`,
        finance_manager: `/${locale}/console`,
        marketing: `/${locale}/console`,
        ops_admin: `/${locale}/console`,
        guide: `/${locale}/guide`,
        mitra: `/${locale}/partner/dashboard`,
        corporate: `/${locale}/corporate/employees`,
        customer: `/${locale}`,
      };

      const redirectPath = roleRedirectMap[role ?? 'customer'] || `/${locale}`;

      // Success - redirect based on role
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      console.error('Consent submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Gagal menyimpan persetujuan: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Terms Content */}
      <div className="max-h-64 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm">
        <div className="prose prose-sm max-w-none">
          {TERMS_CONTENT.split('\n').map((line, idx) => {
            if (line.startsWith('## ')) {
              return (
                <h2 key={idx} className="mb-2 mt-4 text-lg font-bold">
                  {line.replace('## ', '')}
                </h2>
              );
            }
            if (line.startsWith('### ')) {
              return (
                <h3 key={idx} className="mb-1 mt-3 font-semibold">
                  {line.replace('### ', '')}
                </h3>
              );
            }
            if (line.startsWith('- ')) {
              return (
                <li key={idx} className="ml-4">
                  {line.replace('- ', '')}
                </li>
              );
            }
            if (line.trim()) {
              return (
                <p key={idx} className="mb-2">
                  {line}
                </p>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Checkbox */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300"
        />
        <span className="text-sm">
          Saya telah membaca, memahami, dan menyetujui{' '}
          <strong>Syarat dan Ketentuan</strong> serta{' '}
          <strong>Kebijakan Privasi</strong> Aero Travel
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={loading || !agreed}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Setuju & Lanjutkan
          </>
        )}
      </Button>
    </div>
  );
}
