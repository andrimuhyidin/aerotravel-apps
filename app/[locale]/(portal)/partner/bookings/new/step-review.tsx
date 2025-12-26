/**
 * Step 3: Review + Payment
 * 
 * Features:
 * - Complete booking summary
 * - Edit inline (go back to step)
 * - Payment method selector
 * - Final price breakdown
 * - Commission highlight
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Package as PackageIcon,
  MapPin,
  Calendar,
  Users,
  Phone,
  Mail,
  Edit2,
  Wallet,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/partner/package-utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

type StepReviewProps = {
  packageName?: string;
  destination?: string;
  tripDate?: Date | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  adultPax?: number;
  childPax?: number;
  infantPax?: number;
  specialRequests?: string;
  ntaTotal: number;
  publishTotal: number;
  commission: number;
  paymentMethod?: 'wallet' | 'external';
  onPaymentMethodChange: (method: 'wallet' | 'external') => void;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting?: boolean;
};

export function StepReview({
  packageName = 'Paket Belum Dipilih',
  destination = '-',
  tripDate,
  customerName = '-',
  customerPhone = '-',
  customerEmail,
  adultPax = 0,
  childPax = 0,
  infantPax = 0,
  specialRequests,
  ntaTotal,
  publishTotal,
  commission,
  paymentMethod = 'wallet',
  onPaymentMethodChange,
  onEdit,
  onSubmit,
  onBack,
  submitting = false,
}: StepReviewProps) {
  const totalPax = adultPax + childPax + infantPax;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
              3
            </div>
            Review & Konfirmasi
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Package Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Paket Wisata</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(1)}
              className="h-8 text-xs"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Ubah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <PackageIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{packageName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  <MapPin className="h-3 w-3 mr-1" />
                  {destination}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t">
            <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tanggal Keberangkatan</p>
              <p className="font-semibold text-sm">
                {tripDate
                  ? format(tripDate, 'EEEE, d MMMM yyyy', { locale: localeId })
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Data Pemesan</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              className="h-8 text-xs"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Ubah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-medium">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WhatsApp</span>
              <span className="font-medium">{customerPhone}</span>
            </div>
            {customerEmail && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-xs">{customerEmail}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm text-muted-foreground">Total Peserta</span>
            <div className="text-right">
              <p className="font-bold">{totalPax} Orang</p>
              <p className="text-xs text-muted-foreground">
                {adultPax} Dewasa{childPax > 0 && `, ${childPax} Anak`}
                {infantPax > 0 && `, ${infantPax} Bayi`}
              </p>
            </div>
          </div>

          {specialRequests && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Catatan Khusus</p>
              <p className="text-sm">{specialRequests}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-sm font-semibold">Rincian Harga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga NTA</span>
              <span className="font-semibold">{formatCurrency(ntaTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga Publish</span>
              <span className="font-semibold">{formatCurrency(publishTotal)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-dashed">
            <span className="font-bold text-base">Total Pembayaran</span>
            <span className="font-bold text-2xl text-primary">
              {formatCurrency(ntaTotal)}
            </span>
          </div>

          {commission > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Komisi Anda</span>
                </div>
                <span className="font-bold text-xl text-green-600">
                  {formatCurrency(commission)}
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Potensi keuntungan dari booking ini
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={(value) => onPaymentMethodChange(value as 'wallet' | 'external')}>
            <div className="space-y-3">
              {/* Wallet */}
              <div
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'wallet'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onPaymentMethodChange('wallet')}
              >
                <RadioGroupItem value="wallet" id="wallet" className="mt-1" />
                <Label htmlFor="wallet" className="flex-1 ml-3 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="font-semibold">Wallet (Bayar Sekarang)</span>
                    <Badge variant="default" className="bg-green-600 text-[10px]">
                      INSTANT
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Booking langsung terkonfirmasi, saldo wallet didebit otomatis
                  </p>
                </Label>
              </div>

              {/* External */}
              <div
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'external'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onPaymentMethodChange('external')}
              >
                <RadioGroupItem value="external" id="external" className="mt-1" />
                <Label htmlFor="external" className="flex-1 ml-3 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-semibold">Bayar Nanti</span>
                    <Badge variant="outline" className="text-[10px]">
                      PENDING
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customer melakukan pembayaran terlebih dahulu
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-blue-900 mb-1">Perhatian</p>
          <p className="text-blue-800 text-xs">
            Pastikan semua data sudah benar sebelum melanjutkan. Setelah booking dibuat,
            perubahan data memerlukan konfirmasi manual.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12" disabled={submitting}>
          Kembali
        </Button>
        <Button
          onClick={onSubmit}
          className="flex-1 h-12 bg-green-600 hover:bg-green-700"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Memproses...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Konfirmasi Booking
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

