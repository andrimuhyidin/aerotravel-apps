'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  Mail,
  CreditCard,
  MapPin,
  Users,
  Clock,
  Check,
  X,
  HelpCircle,
  History
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PaymentProofViewer } from '@/components/finance/payment-proof-viewer';
import { PaymentVerificationForm } from '@/components/finance/payment-verification-form';
import { cn } from '@/lib/utils';

type Package = {
  id: string;
  name: string;
  destination: string | null;
};

type Booking = {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  trip_date: string;
  adult_pax: number;
  child_pax: number;
  infant_pax: number;
  total_amount: number;
  status: string;
  created_at: string | null;
  package: Package | null;
};

type Payment = {
  id: string;
  booking_id: string;
  payment_code: string;
  amount: number;
  fee_amount: number | null;
  net_amount: number | null;
  payment_method: string;
  status: string;
  proof_url: string | null;
  proof_image_url: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  paid_at: string | null;
  expired_at: string | null;
  is_manual: boolean | null;
  manual_entry_by: string | null;
  bank_name: string | null;
  account_number: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payer_phone: string | null;
  created_at: string | null;
  updated_at: string | null;
  booking: Booking | null;
  verifier?: {
    id: string;
    full_name: string;
    email: string | null;
  } | null;
};

type VerificationLog = {
  id: string;
  action: string;
  previous_status: string | null;
  new_status: string;
  notes: string | null;
  rejection_reason: string | null;
  performed_at: string | null;
  performer: {
    full_name: string;
  } | null;
};

type PaymentVerificationClientProps = {
  locale: string;
  payment: Payment;
  verificationLogs: VerificationLog[];
};

export function PaymentVerificationClient({
  locale,
  payment,
  verificationLogs,
}: PaymentVerificationClientProps) {
  const router = useRouter();
  const [key, setKey] = useState(0);
  const booking = payment.booking;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVerificationStatusBadge = (status: string) => {
    const defaultConfig = {
      label: 'Menunggu Verifikasi',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Clock className="mr-1 h-3 w-3" />,
    };

    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: defaultConfig,
      verified: {
        label: 'Terverifikasi',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <Check className="mr-1 h-3 w-3" />,
      },
      rejected: {
        label: 'Ditolak',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <X className="mr-1 h-3 w-3" />,
      },
      more_info_needed: {
        label: 'Butuh Info Tambahan',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <HelpCircle className="mr-1 h-3 w-3" />,
      },
    };

    const config = statusConfig[status] ?? defaultConfig;
    
    return (
      <Badge variant="outline" className={cn("flex items-center text-sm", config.className)}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'verified':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-600" />;
      case 'more_info_requested':
        return <HelpCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleRefresh = () => {
    setKey(k => k + 1);
    router.refresh();
  };

  return (
    <div className="space-y-6" key={key}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/${locale}/console/finance/payments`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Verifikasi Pembayaran
            </h1>
            <p className="text-muted-foreground">
              {booking?.booking_code || '-'}
            </p>
          </div>
        </div>
        {getVerificationStatusBadge(payment.verification_status || 'pending')}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Proof Image */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bukti Pembayaran
              </CardTitle>
              <CardDescription>
                Gambar bukti transfer yang diupload customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentProofViewer
                proofUrl={payment.proof_url}
                bookingCode={booking?.booking_code}
              />
              
              {/* Payment Details */}
              <div className="mt-4 space-y-3">
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Jumlah</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Metode</p>
                    <p className="font-medium capitalize">
                      {payment.payment_method || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bank</p>
                    <p className="font-medium capitalize">
                      {payment.bank_name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tanggal Upload</p>
                    <p className="font-medium">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification History */}
          {verificationLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-5 w-5" />
                  Riwayat Verifikasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verificationLogs.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="mt-1">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {log.action === 'verified' && 'Pembayaran diverifikasi'}
                          {log.action === 'rejected' && 'Pembayaran ditolak'}
                          {log.action === 'more_info_requested' && 'Info tambahan diminta'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.performer?.full_name || 'Unknown'} • {formatDate(log.performed_at)}
                        </p>
                        {(log.notes || log.rejection_reason) && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {log.rejection_reason || log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Booking Info & Verification Form */}
        <div className="space-y-6">
          {/* Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking ? (
                <>
                  {/* Customer */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Customer</h4>
                    <div className="space-y-1">
                      <p className="font-medium">{booking.customer_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {booking.customer_email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {booking.customer_phone}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Trip Info */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Detail Trip</h4>
                    <div className="space-y-2">
                      {booking.package && (
                        <>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.package.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">
                            {booking.package.destination}
                          </p>
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(booking.trip_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {booking.adult_pax} dewasa, {booking.child_pax} anak, {booking.infant_pax} bayi
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Amount */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-muted-foreground">Total Booking</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(booking.total_amount)}
                    </span>
                  </div>

                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/${locale}/console/bookings/${booking.id}`}>
                      Lihat Detail Booking
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Data booking tidak tersedia</p>
              )}
            </CardContent>
          </Card>

          {/* Rejection Reason (if applicable) */}
          {payment.verification_status === 'rejected' && payment.verification_notes && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-red-800">
                  <X className="h-4 w-4" />
                  Alasan Penolakan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">{payment.verification_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Verification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Aksi Verifikasi
              </CardTitle>
              <CardDescription>
                Approve, reject, atau minta informasi tambahan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentVerificationForm
                paymentId={payment.id}
                bookingCode={booking?.booking_code}
                amount={payment.amount}
                currentStatus={payment.verification_status || 'pending'}
                onSuccess={handleRefresh}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

