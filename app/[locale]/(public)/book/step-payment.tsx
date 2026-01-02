/**
 * Step 4: Payment Review for Public Booking
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Calendar,
  Check,
  Coins,
  CreditCard,
  FileText,
  Gift,
  MapPin,
  Package,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { apiClient } from '@/lib/api/client';

import { type BookingFormData } from './booking-wizard-client';

type PackageData = {
  id: string;
  slug: string;
  name: string;
  destination: string;
  province: string;
  duration: { days: number; nights: number; label: string };
  thumbnailUrl?: string;
  pricing: {
    adultPrice: number;
    childPrice: number;
    infantPrice: number;
  };
  minPax: number;
  maxPax: number;
  inclusions: string[];
  exclusions: string[];
};

type StepPaymentPublicProps = {
  form: UseFormReturn<BookingFormData>;
  packageData: PackageData | null;
  totalPrice: number;
  totalPax: number;
  pointsToRedeem?: number;
  onPointsRedeemChange?: (points: number) => void;
};

type PointsBalanceResponse = {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  valueInRupiah: number;
};

type PointsEstimateResponse = {
  pointsToEarn: number;
  valueInRupiah: number;
  bookingValue: number;
  currentBalance?: number;
  balanceAfter?: number;
};

export function StepPaymentPublic({
  form,
  packageData,
  totalPrice,
  totalPax,
  pointsToRedeem = 0,
  onPointsRedeemChange,
}: StepPaymentPublicProps) {
  const values = form.watch();
  const [showRedeemSection, setShowRedeemSection] = useState(false);

  // Fetch user's points balance
  const { data: pointsBalance } = useQuery<PointsBalanceResponse>({
    queryKey: ['loyalty', 'balance'],
    queryFn: async () => {
      const response = await apiClient.get('/api/user/loyalty/balance');
      return response.data as PointsBalanceResponse;
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Estimate points to earn from this booking
  const { data: pointsEstimate } = useQuery<PointsEstimateResponse>({
    queryKey: ['loyalty', 'estimate', totalPrice],
    queryFn: async () => {
      const response = await apiClient.post('/api/user/loyalty/estimate', {
        bookingValue: totalPrice,
      });
      return response.data as PointsEstimateResponse;
    },
    enabled: totalPrice > 0,
    staleTime: 60000,
  });

  const maxRedeemablePoints = Math.min(
    pointsBalance?.balance || 0,
    totalPrice // Can't redeem more than total price
  );

  const discountFromPoints = pointsToRedeem; // 1 point = Rp 1
  const finalPrice = totalPrice - discountFromPoints;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="font-bold text-lg">Review & Pembayaran</h2>
        <p className="text-sm text-muted-foreground">
          Periksa kembali pesanan Anda
        </p>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ringkasan Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Package Info */}
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
              <span className="text-2xl">🏝️</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{packageData?.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {packageData?.destination}
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px] mt-1">
                {packageData?.duration.label}
              </Badge>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tanggal Keberangkatan</p>
              <p className="font-bold text-sm">
                {values.tripDate
                  ? format(values.tripDate, 'EEEE, d MMMM yyyy', { locale: id })
                  : '-'}
              </p>
            </div>
          </div>

          {/* Passengers */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jumlah Peserta</p>
              <p className="font-bold text-sm">
                {values.adultPax || 0} Dewasa
                {(values.childPax || 0) > 0 && `, ${values.childPax} Anak`}
                {(values.infantPax || 0) > 0 && `, ${values.infantPax} Bayi`}
              </p>
            </div>
          </div>

          {/* Booker Info */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Data Pemesan</p>
            <p className="font-medium text-sm">{values.bookerName}</p>
            <p className="text-xs text-muted-foreground">{values.bookerPhone}</p>
            <p className="text-xs text-muted-foreground">{values.bookerEmail}</p>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Rincian Harga
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(values.adultPax || 0) > 0 && packageData && (
            <div className="flex justify-between text-sm">
              <span>Dewasa x {values.adultPax}</span>
              <span>Rp {((values.adultPax || 0) * packageData.pricing.adultPrice).toLocaleString('id-ID')}</span>
            </div>
          )}
          {(values.childPax || 0) > 0 && packageData && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Anak x {values.childPax}</span>
              <span>Rp {((values.childPax || 0) * packageData.pricing.childPrice).toLocaleString('id-ID')}</span>
            </div>
          )}
          {(values.infantPax || 0) > 0 && packageData && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Bayi x {values.infantPax}</span>
              <span>Rp {((values.infantPax || 0) * packageData.pricing.infantPrice).toLocaleString('id-ID')}</span>
            </div>
          )}
          {/* Points Discount */}
          {discountFromPoints > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Gift className="h-3 w-3" />
                Diskon AeroPoints ({pointsToRedeem} poin)
              </span>
              <span>-Rp {discountFromPoints.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-3 border-t">
            <span>Total Pembayaran</span>
            <span className="text-primary">
              Rp {finalPrice.toLocaleString('id-ID')}
            </span>
          </div>
          {discountFromPoints > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              Hemat Rp {discountFromPoints.toLocaleString('id-ID')} dengan AeroPoints!
            </p>
          )}
        </CardContent>
      </Card>

      {/* AeroPoints Section */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-600" />
            AeroPoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Points to Earn */}
          {pointsEstimate && pointsEstimate.pointsToEarn > 0 && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-700">Anda akan mendapat</p>
                  <p className="font-bold text-green-700">
                    +{pointsEstimate.pointsToEarn} Poin
                  </p>
                </div>
              </div>
              <p className="text-xs text-green-600">
                = Rp {pointsEstimate.valueInRupiah.toLocaleString('id-ID')}
              </p>
            </div>
          )}

          {/* Current Balance & Redeem */}
          {pointsBalance && pointsBalance.balance > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Poin Anda</p>
                  <p className="font-bold text-amber-700">
                    {pointsBalance.balance.toLocaleString('id-ID')} Poin
                  </p>
                </div>
                <Button
                  type="button"
                  variant={showRedeemSection ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setShowRedeemSection(!showRedeemSection)}
                  className="text-xs"
                >
                  {showRedeemSection ? 'Tutup' : 'Gunakan Poin'}
                </Button>
              </div>

              {showRedeemSection && maxRedeemablePoints > 0 && onPointsRedeemChange && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Poin yang digunakan:</span>
                    <span className="font-bold text-primary">
                      {pointsToRedeem.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <Slider
                    value={[pointsToRedeem]}
                    onValueChange={(value) => onPointsRedeemChange(value[0] ?? 0)}
                    max={maxRedeemablePoints}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>{maxRedeemablePoints.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={pointsToRedeem}
                      onChange={(e) => {
                        const val = Math.min(
                          Math.max(0, parseInt(e.target.value) || 0),
                          maxRedeemablePoints
                        );
                        onPointsRedeemChange(val);
                      }}
                      className="h-8 text-sm"
                      min={0}
                      max={maxRedeemablePoints}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onPointsRedeemChange(maxRedeemablePoints)}
                      className="text-xs whitespace-nowrap"
                    >
                      Pakai Semua
                    </Button>
                  </div>
                  {pointsToRedeem > 0 && (
                    <p className="text-xs text-green-600 text-center">
                      Hemat Rp {discountFromPoints.toLocaleString('id-ID')}!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Points Yet */}
          {(!pointsBalance || pointsBalance.balance === 0) && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Belum punya poin? Dapatkan poin dari setiap booking!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Metode Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {['QRIS', 'BCA', 'BNI', 'Mandiri'].map((method) => (
              <div
                key={method}
                className="p-2 border rounded-lg text-center text-xs bg-muted/30"
              >
                {method}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Pembayaran via QRIS, Transfer Bank, E-Wallet, dan Kartu Kredit
          </p>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardContent className="p-4">
          <FormField
            control={form.control}
            name="agreedToTerms"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal leading-relaxed cursor-pointer">
                  Saya menyetujui{' '}
                  <Link
                    href="/id/legal/terms"
                    className="text-primary underline"
                    target="_blank"
                  >
                    Syarat & Ketentuan
                  </Link>{' '}
                  serta{' '}
                  <Link
                    href="/id/legal/privacy"
                    className="text-primary underline"
                    target="_blank"
                  >
                    Kebijakan Privasi
                  </Link>{' '}
                  Aero Travel.
                </FormLabel>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
        <Shield className="h-5 w-5 text-green-600" />
        <p className="text-xs text-green-700">
          Pembayaran aman & terenkripsi
        </p>
      </div>

      {/* Inclusions & Exclusions */}
      {packageData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Yang Termasuk dalam Paket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {packageData.inclusions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">Termasuk:</p>
                <ul className="text-xs space-y-1">
                  {packageData.inclusions.slice(0, 5).map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {packageData.exclusions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-700 mb-1">Tidak Termasuk:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {packageData.exclusions.slice(0, 3).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

