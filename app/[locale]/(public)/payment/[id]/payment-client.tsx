/**
 * Payment Client Component
 * Customer payment flow with Midtrans Snap and manual transfer options
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  QrCode,
  Receipt,
  Upload,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { openSnapPayment, formatPaymentAmount } from '@/lib/integrations/midtrans-snap';
import { logger } from '@/lib/utils/logger';

export type Booking = {
  id: string;
  bookingCode: string;
  packageName: string;
  tripDate: string;
  adultPax: number;
  childPax: number;
  subtotal: number;
  discount: number;
  tax: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

type PaymentClientProps = {
  booking: Booking;
  snapToken?: string;
};

export function PaymentClient({ booking, snapToken }: PaymentClientProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'manual'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Check if already paid
  const isPaid = booking.paymentStatus === 'paid' || booking.paymentStatus === 'verified';
  const isPending = booking.paymentStatus === 'pending' || booking.paymentStatus === 'pending_verification';

  const handleOnlinePayment = async () => {
    if (!snapToken) {
      toast.error('Token pembayaran tidak tersedia');
      return;
    }

    setIsProcessing(true);

    try {
      await openSnapPayment(snapToken, {
        onSuccess: (result) => {
          toast.success('Pembayaran berhasil!');
          router.push(`/my-trips/${booking.id}?payment=success`);
        },
        onPending: (result) => {
          toast.info('Pembayaran sedang diproses');
          router.push(`/my-trips/${booking.id}?payment=pending`);
        },
        onError: (result) => {
          toast.error('Pembayaran gagal: ' + result.status_message);
        },
        onClose: () => {
          setIsProcessing(false);
        },
      });
    } catch (error) {
      logger.error('Payment error', error);
      toast.error('Gagal memproses pembayaran');
      setIsProcessing(false);
    }
  };

  const handleProofUpload = async () => {
    if (!proofFile) {
      toast.error('Pilih file bukti transfer terlebih dahulu');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', proofFile);
      formData.append('bookingId', booking.id);

      const response = await fetch('/api/user/bookings/upload-proof', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadSuccess(true);
      toast.success('Bukti transfer berhasil diunggah. Menunggu verifikasi.');
    } catch (error) {
      logger.error('Upload proof error', error);
      toast.error('Gagal mengunggah bukti transfer');
    } finally {
      setIsUploading(false);
    }
  };

  if (isPaid) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Pembayaran Berhasil</h2>
        <p className="text-muted-foreground mb-6">
          Booking #{booking.bookingCode} telah lunas
        </p>
        <Button onClick={() => router.push(`/my-trips/${booking.id}`)}>
          Lihat Detail Trip
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pembayaran</h1>
        <p className="text-muted-foreground">
          Booking #{booking.bookingCode}
        </p>
      </div>

      {/* Pending Verification Alert */}
      {isPending && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Menunggu Verifikasi
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                Bukti pembayaran sedang diproses. Estimasi 1x24 jam.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Booking Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Ringkasan Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{booking.packageName}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(booking.tripDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Dewasa ({booking.adultPax} pax)</span>
                <span>{formatPaymentAmount(booking.subtotal - (booking.subtotal * 0.3 * (booking.childPax / (booking.adultPax + booking.childPax))))}</span>
              </div>
              {booking.childPax > 0 && (
                <div className="flex justify-between">
                  <span>Anak-anak ({booking.childPax} pax)</span>
                  <span>{formatPaymentAmount(booking.subtotal * 0.3 * (booking.childPax / (booking.adultPax + booking.childPax)))}</span>
                </div>
              )}
              {booking.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon</span>
                  <span>-{formatPaymentAmount(booking.discount)}</span>
                </div>
              )}
              {booking.tax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Pajak (11%)</span>
                  <span>{formatPaymentAmount(booking.tax)}</span>
                </div>
              )}
              {booking.serviceFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Biaya Layanan</span>
                  <span>{formatPaymentAmount(booking.serviceFee)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatPaymentAmount(booking.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Metode Pembayaran</CardTitle>
            <CardDescription>
              Pilih metode pembayaran yang Anda inginkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'online' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="online">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Bayar Online
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Wallet className="mr-2 h-4 w-4" />
                  Transfer Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="online" className="mt-6">
                <div className="space-y-6">
                  {/* Payment Method Icons */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <PaymentMethodCard icon={QrCode} label="QRIS" />
                    <PaymentMethodCard icon={Wallet} label="Virtual Account" />
                    <PaymentMethodCard icon={CreditCard} label="Credit Card" />
                    <PaymentMethodCard icon={CreditCard} label="PayLater" />
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Anda akan diarahkan ke halaman pembayaran Midtrans
                  </p>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleOnlinePayment}
                    disabled={isProcessing || !snapToken}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        Bayar {formatPaymentAmount(booking.totalAmount)}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-6">
                <div className="space-y-6">
                  {/* Bank Details */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="font-medium">Transfer ke rekening:</p>
                    <div className="space-y-1">
                      <p className="text-lg font-mono font-bold">1234567890123</p>
                      <p className="text-sm text-muted-foreground">Bank BCA</p>
                      <p className="text-sm">a.n. PT AERO TRAVEL INDONESIA</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Jumlah Transfer:</span>
                      <span className="font-bold text-primary">
                        {formatPaymentAmount(booking.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Upload Proof */}
                  {!uploadSuccess ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Upload Bukti Transfer</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Format: JPG, PNG. Max 5MB. Bukti akan diverifikasi otomatis dengan AI Vision.
                        </p>
                      </div>

                      {proofFile && (
                        <div className="flex items-center gap-2 p-2 rounded bg-muted">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-sm truncate flex-1">{proofFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(proofFile.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={handleProofUpload}
                        disabled={!proofFile || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Mengunggah...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Kirim Bukti Transfer
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="font-medium">Bukti Transfer Terkirim</p>
                      <p className="text-sm text-muted-foreground">
                        Menunggu verifikasi tim kami
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Security Note */}
      <Card className="bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Transaksi Aman</p>
            <p>
              Pembayaran online diproses melalui Midtrans yang tersertifikasi PCI-DSS.
              Data kartu Anda tidak disimpan di server kami.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentMethodCard({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary cursor-pointer transition-colors">
      <Icon className="h-6 w-6 text-muted-foreground" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

