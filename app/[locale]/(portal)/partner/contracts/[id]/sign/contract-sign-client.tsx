/**
 * Contract Sign Client Component
 * E-signature interface for partner contracts
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  PenTool,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SignaturePad } from '@/components/ui/signature-pad';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Contract = {
  id: string;
  title: string;
  type: string;
  version: string;
  content: string;
  status: string;
};

type ContractSignClientProps = {
  locale: string;
  contractId: string;
};

export function ContractSignClient({ locale, contractId }: ContractSignClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signaturePadRef = useRef<{ clear: () => void; toDataURL: () => string } | null>(null);
  
  const [hasRead, setHasRead] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch contract details
  const { data: contract, isLoading } = useQuery<Contract>({
    queryKey: [...queryKeys.partner.contracts, contractId],
    queryFn: async () => {
      const response = await apiClient.get<{ contract: Contract }>(
        `/api/partner/contracts/${contractId}`
      );
      return response.contract;
    },
  });

  // Get location for signature
  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success('Lokasi berhasil diambil');
        },
        (error) => {
          console.warn('Geolocation error:', error);
          toast.info('Lokasi tidak tersedia, tanda tangan tetap valid');
        }
      );
    }
  }, []);

  // Sign mutation
  const signMutation = useMutation({
    mutationFn: async () => {
      if (!signatureData) {
        throw new Error('Tanda tangan diperlukan');
      }

      return apiClient.post(`/api/partner/contracts/${contractId}/sign`, {
        signature: signatureData,
        location,
        agreedToTerms: true,
        signedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.contracts });
      toast.success('Kontrak berhasil ditandatangani!');
      router.push(`/${locale}/partner/contracts`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menandatangani kontrak');
    },
  });

  const handleClearSignature = useCallback(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setSignatureData(null);
    }
  }, []);

  const handleSaveSignature = useCallback(() => {
    if (signaturePadRef.current) {
      const data = signaturePadRef.current.toDataURL();
      setSignatureData(data);
      toast.success('Tanda tangan disimpan');
    }
  }, []);

  const canSign = hasRead && agreedToTerms && signatureData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader title="Memuat..." />
        <div className="space-y-4 px-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader title="Kontrak Tidak Ditemukan" />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <p>Kontrak tidak ditemukan atau sudah tidak valid.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/${locale}/partner/contracts`)}
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Tanda Tangan Kontrak"
        description={contract.title}
        backHref={`/${locale}/partner/contracts`}
      />

      <div className="space-y-4 px-4">
        {/* Contract Header */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{contract.title}</p>
              <p className="text-sm text-muted-foreground">
                Versi {contract.version} • {contract.type}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contract Content */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Isi Perjanjian</CardTitle>
            <CardDescription>
              Baca dengan seksama sebelum menandatangani
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] rounded-lg border bg-white p-4">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contract.content }}
              />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Read Confirmation */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={hasRead}
                  onCheckedChange={(checked) => setHasRead(!!checked)}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  Saya telah membaca dan memahami seluruh isi perjanjian di atas
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  Saya setuju dengan semua syarat dan ketentuan yang tercantum dalam
                  perjanjian ini
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Signature Pad */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PenTool className="h-5 w-5 text-primary" />
              Tanda Tangan Digital
            </CardTitle>
            <CardDescription>
              Buat tanda tangan Anda di area di bawah
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-white p-2">
              <SignaturePad
                ref={signaturePadRef}
                className="h-48 w-full"
                onEnd={handleSaveSignature}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearSignature}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Hapus
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={getLocation}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {location ? 'Lokasi Diambil' : 'Ambil Lokasi'}
              </Button>
            </div>
            {signatureData && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Tanda tangan tersimpan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-start gap-3 p-4">
            <Shield className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Keamanan Tanda Tangan</p>
              <p className="text-blue-700">
                Tanda tangan digital Anda dilindungi dengan timestamp dan lokasi GPS.
                Dokumen yang ditandatangani memiliki kekuatan hukum yang sama dengan
                tanda tangan fisik.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          disabled={!canSign || signMutation.isPending}
          onClick={() => signMutation.mutate()}
        >
          {signMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menandatangani...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Tanda Tangani Kontrak
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

