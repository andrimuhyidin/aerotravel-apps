/**
 * Step 3: Review + Payment - REDESIGNED
 * Ultra-compact with visual summary cards, inline edit, and enhanced payment selector
 */

'use client';

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
  Edit2,
  Wallet,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Zap,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { formatCurrency } from '@/lib/partner/package-utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
    <div className="space-y-3">
      {/* Header Card - Ultra Compact */}
      <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
              3
            </div>
            Review & Konfirmasi
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Package Summary - Compact Visual Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold">Paket Wisata</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(1)}
              className="h-6 text-[10px] px-2 active:scale-95 transition-transform"
            >
              <Edit2 className="h-2.5 w-2.5 mr-1" />
              Ubah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          <div className="flex items-start gap-2 p-2 bg-gradient-to-br from-muted/30 to-background rounded-lg border">
            <PackageIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs leading-tight truncate">{packageName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  <MapPin className="h-2.5 w-2.5 mr-0.5" />
                  {destination}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 bg-gradient-to-br from-muted/30 to-background rounded-lg border">
            <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Tanggal Keberangkatan</p>
              <p className="font-semibold text-xs">
                {tripDate
                  ? format(tripDate, 'EEEE, d MMMM yyyy', { locale: localeId })
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary - Compact Visual Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold">Data Pemesan</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              className="h-6 text-[10px] px-2 active:scale-95 transition-transform"
            >
              <Edit2 className="h-2.5 w-2.5 mr-1" />
              Ubah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          <div className="p-2 bg-gradient-to-br from-muted/30 to-background rounded-lg border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs">Nama</span>
              <span className="font-medium">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs">WhatsApp</span>
              <span className="font-medium">{customerPhone}</span>
            </div>
            {customerEmail && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Email</span>
                <span className="font-medium text-xs truncate max-w-[160px]">
                  {customerEmail}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-2 bg-gradient-to-br from-blue-50 to-background rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs text-muted-foreground">Total Peserta</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-blue-600">{totalPax} Orang</p>
              <p className="text-[10px] text-muted-foreground">
                {adultPax} Dewasa
                {childPax > 0 && `, ${childPax} Anak`}
                {infantPax > 0 && `, ${infantPax} Bayi`}
              </p>
            </div>
          </div>

          {specialRequests && (
            <div className="p-2 bg-muted/30 rounded-lg border border-dashed">
              <p className="text-[10px] text-muted-foreground mb-0.5">Catatan Khusus</p>
              <p className="text-xs">{specialRequests}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Summary - Prominent with Commission Highlight */}
      <Card className="border-primary/20 shadow-md bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="pb-2 px-3 pt-3 bg-primary/5 border-b">
          <CardTitle className="text-xs font-semibold">Rincian Harga</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-2.5 space-y-2">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga NTA</span>
              <span className="font-semibold">{formatCurrency(ntaTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga Publish</span>
              <span className="font-semibold">{formatCurrency(publishTotal)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-dashed">
            <span className="font-bold text-xs">Total Pembayaran</span>
            <span className="font-bold text-xl text-primary">
              {formatCurrency(ntaTotal)}
            </span>
          </div>

          {commission > 0 && (
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-xs text-green-800">Komisi Anda</span>
                </div>
                <span className="font-bold text-lg text-green-600">
                  {formatCurrency(commission)}
                </span>
              </div>
              <p className="text-[10px] text-green-700 mt-0.5">
                Potensi keuntungan dari booking ini
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method - Enhanced Visual Radio Cards */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs font-semibold">Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => onPaymentMethodChange(value as 'wallet' | 'external')}
          >
            <div className="space-y-2">
              {/* Wallet - Instant */}
              <div
                className={cn(
                  'flex items-start p-2 border-2 rounded-lg cursor-pointer transition-all active:scale-[0.99]',
                  paymentMethod === 'wallet'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => onPaymentMethodChange('wallet')}
              >
                <RadioGroupItem value="wallet" id="wallet" className="mt-0.5" />
                <Label htmlFor="wallet" className="flex-1 ml-2.5 cursor-pointer">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <Wallet className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-xs">Wallet (Bayar Sekarang)</span>
                    <Badge variant="default" className="bg-green-600 text-[10px] h-4 px-1.5">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                      INSTANT
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-7">
                    Booking langsung terkonfirmasi, saldo didebit otomatis
                  </p>
                </Label>
              </div>

              {/* External - Pending */}
              <div
                className={cn(
                  'flex items-start p-2 border-2 rounded-lg cursor-pointer transition-all active:scale-[0.99]',
                  paymentMethod === 'external'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => onPaymentMethodChange('external')}
              >
                <RadioGroupItem value="external" id="external" className="mt-0.5" />
                <Label htmlFor="external" className="flex-1 ml-2.5 cursor-pointer">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
                      <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    <span className="font-semibold text-xs">Bayar Nanti</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      PENDING
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-7">
                    Customer melakukan pembayaran terlebih dahulu
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Info Banner - Compact */}
      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <p className="font-semibold text-blue-900 mb-0.5">Perhatian</p>
          <p className="text-blue-800 text-[10px]">
            Pastikan semua data sudah benar. Setelah booking dibuat, perubahan
            memerlukan konfirmasi manual.
          </p>
        </div>
      </div>

      {/* Inline Back Button */}
      <div className="flex gap-3 pt-4 border-t">
        <Button 
          variant="outline"
          onClick={onBack}
          className="w-32 h-11 active:scale-95 transition-transform"
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="flex-1 text-sm text-muted-foreground flex items-center justify-center">
          Gunakan tombol hijau di bawah untuk konfirmasi
        </div>
      </div>
    </div>
  );
}
