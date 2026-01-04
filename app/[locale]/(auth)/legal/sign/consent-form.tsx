'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

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
`;

type ConsentPurpose = {
  code: string;
  name: string;
  description: string;
  isMandatory: boolean;
  category: string;
};

export function ConsentForm({ locale, userId }: ConsentFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [purposes, setPurposes] = useState<ConsentPurpose[]>([]);
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [loadingPurposes, setLoadingPurposes] = useState(true);

  // Load consent purposes
  React.useEffect(() => {
    async function loadPurposes() {
      try {
        const response = await fetch('/api/user/consent/purposes');
        const data = await response.json();
        
        if (data.purposes) {
          setPurposes(data.purposes);
          
          // Initialize consents - mandatory ones are pre-checked
          const initialConsents: Record<string, boolean> = {};
          data.purposes.forEach((p: ConsentPurpose) => {
            initialConsents[p.code] = p.isMandatory;
          });
          setConsents(initialConsents);
        }
      } catch (err) {
        logger.error('Failed to load consent purposes', err);
      } finally {
        setLoadingPurposes(false);
      }
    }
    loadPurposes();
  }, []);

  const handleSubmit = async () => {
    if (!agreed) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    // Check if all mandatory consents are given
    const mandatoryPurposes = purposes.filter(p => p.isMandatory);
    const allMandatoryGiven = mandatoryPurposes.every(p => consents[p.code] === true);
    
    if (!allMandatoryGiven) {
      setError('Anda harus menyetujui semua persetujuan wajib');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Record all consents via API
      const consentRecords = purposes.map(purpose => ({
        purposeCode: purpose.code,
        consentGiven: consents[purpose.code] || false,
      }));

      const response = await fetch('/api/user/consent/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consents: consentRecords }),
      });

      if (!response.ok) {
        throw new Error('Failed to record consents');
      }

      // Update contract signed flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('users')
        .update({
          is_contract_signed: true,
          contract_signed_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        logger.error('Consent update error', updateError, { userId });
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
      logger.error('Consent submission error', err, { userId });
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

      {/* Main Terms Checkbox */}
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

      {/* Granular Consent Purposes */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Persetujuan Penggunaan Data (UU PDP 2022)</h3>
        
        {loadingPurposes ? (
          <div className="text-sm text-muted-foreground">Memuat...</div>
        ) : (
          purposes.map((purpose) => (
            <label
              key={purpose.code}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                purpose.isMandatory ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={consents[purpose.code] || false}
                onChange={(e) => {
                  if (purpose.isMandatory) return; // Can't uncheck mandatory
                  setConsents(prev => ({ ...prev, [purpose.code]: e.target.checked }));
                }}
                disabled={purpose.isMandatory}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{purpose.name}</span>
                  {purpose.isMandatory && (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                      Wajib
                    </span>
                  )}
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {purpose.category === 'operational' ? 'Operasional' :
                     purpose.category === 'marketing' ? 'Marketing' :
                     purpose.category === 'analytics' ? 'Analitik' : 'Pihak Ketiga'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{purpose.description}</p>
              </div>
            </label>
          ))
        )}
        
        <p className="text-xs text-muted-foreground">
          Anda dapat mengubah persetujuan ini kapan saja melalui menu pengaturan akun Anda.
        </p>
      </div>

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
