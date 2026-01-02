/**
 * Waiver Section Component
 * Digital liability waiver with signature for trips
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  Loader2,
  Shield,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SignaturePad, type SignatureData } from '@/components/ui/signature-pad';
import queryKeys from '@/lib/queries/query-keys';

type WaiverSectionProps = {
  tripId: string;
  tripDate: string;
  tripStatus: string;
};

type WaiverStatus = {
  isSigned: boolean;
  signedAt: string | null;
  signatureUrl: string | null;
};

export function WaiverSection({ tripId, tripDate, tripStatus }: WaiverSectionProps) {
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const queryClient = useQueryClient();

  // Check if trip is upcoming (not past)
  const tripDateTime = new Date(tripDate);
  const now = new Date();
  const isPastTrip = tripDateTime < now;

  // Only show waiver for paid/confirmed trips
  const shouldShowWaiver = tripStatus === 'paid' || tripStatus === 'confirmed';

  // Fetch waiver status
  const { data: waiverStatus, isLoading } = useQuery<WaiverStatus>({
    queryKey: [...queryKeys.user.all, 'trips', tripId, 'waiver'],
    queryFn: async () => {
      const res = await fetch(`/api/user/trips/${tripId}/waiver`);
      if (!res.ok) throw new Error('Failed to fetch waiver status');
      return res.json();
    },
    enabled: shouldShowWaiver,
  });

  // Sign waiver mutation
  const signMutation = useMutation({
    mutationFn: async () => {
      if (!signature?.data) throw new Error('Signature required');

      const res = await fetch(`/api/user/trips/${tripId}/waiver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: signature.data,
          agreedToTerms,
          gpsLocation: signature.gpsLocation,
        }),
      });

      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        throw new Error(error.error || 'Failed to sign waiver');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Waiver berhasil ditandatangani');
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.user.all, 'trips', tripId, 'waiver'],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal menandatangani waiver');
    },
  });

  const handleSignatureChange = useCallback((sig: SignatureData | null) => {
    setSignature(sig);
  }, []);

  const handleSubmit = () => {
    if (!signature?.data) {
      toast.error('Harap buat tanda tangan terlebih dahulu');
      return;
    }
    if (!agreedToTerms) {
      toast.error('Harap setujui syarat dan ketentuan');
      return;
    }
    signMutation.mutate();
  };

  if (!shouldShowWaiver) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Already signed
  if (waiverStatus?.isSigned) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">Waiver Telah Ditandatangani</h3>
              <p className="text-sm text-green-600">
                Ditandatangani pada{' '}
                {waiverStatus.signedAt
                  ? format(new Date(waiverStatus.signedAt), 'd MMMM yyyy, HH:mm', {
                      locale: localeId,
                    })
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Past trip without signed waiver
  if (isPastTrip) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800">Waiver Tidak Ditandatangani</h3>
              <p className="text-sm text-amber-600">
                Periode penandatanganan waiver telah berakhir
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show waiver form
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileSignature className="h-4 w-4" />
          Liability Waiver
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Demi keamanan dan kenyamanan bersama, harap baca dan tandatangani waiver pernyataan
            tanggung jawab sebelum mengikuti trip.
          </AlertDescription>
        </Alert>

        {/* Waiver Terms */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2 max-h-40 overflow-y-auto">
          <p className="font-medium">Pernyataan Tanggung Jawab:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>
              Saya menyatakan dalam keadaan sehat jasmani dan rohani untuk mengikuti trip ini.
            </li>
            <li>
              Saya memahami bahwa aktivitas wisata memiliki risiko dan akan mengikuti instruksi
              pemandu dengan baik.
            </li>
            <li>
              Saya bertanggung jawab atas barang bawaan pribadi dan tidak akan menuntut penyelenggara
              atas kehilangan barang.
            </li>
            <li>
              Saya menyetujui penggunaan foto/video selama trip untuk keperluan dokumentasi dan
              promosi.
            </li>
            <li>
              Saya memahami bahwa penyelenggara berhak mengubah itinerary jika kondisi tidak
              memungkinkan (cuaca, keamanan, dll).
            </li>
            <li>
              Saya telah memberikan informasi kesehatan yang akurat dan akan bertanggung jawab atas
              konsekuensi jika ada informasi yang disembunyikan.
            </li>
          </ol>
        </div>

        {/* Agreement Checkbox */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="agree-terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
          />
          <label htmlFor="agree-terms" className="text-xs leading-relaxed cursor-pointer">
            Saya telah membaca, memahami, dan menyetujui semua syarat dan ketentuan di atas.
          </label>
        </div>

        {/* Signature Pad */}
        <SignaturePad
          value={signature}
          onChange={handleSignatureChange}
          label="Tanda Tangan"
          required
          showGPS
        />

        {/* Submit Button */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!signature?.data || !agreedToTerms || signMutation.isPending}
        >
          {signMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <FileSignature className="mr-2 h-4 w-4" />
              Tandatangani Waiver
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

