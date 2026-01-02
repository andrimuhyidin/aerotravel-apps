/**
 * Trip Detail Client Component
 * Displays trip details with document downloads
 */

'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Download,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';

import { LiveTrackingSection } from './live-tracking-section';
import { WaiverSection } from './waiver-section';

type TripDetail = {
  id: string;
  code: string;
  tripDate: string;
  totalPax: number;
  adultPax: number;
  childPax: number;
  infantPax: number;
  totalAmount: number;
  status: string;
  specialRequests: string | null;
  createdAt: string;
  paidAt: string | null;
  bookerName: string;
  bookerPhone: string;
  bookerEmail: string;
  package: {
    id: string;
    name: string;
    slug: string;
    destination: string;
    province: string;
    duration: string;
    inclusions: string[];
    exclusions: string[];
    meetingPoints: { name: string; address: string; time: string }[];
  } | null;
  hasReview: boolean;
};

type TripDetailClientProps = {
  locale: string;
  tripId: string;
};

export function TripDetailClient({ locale, tripId }: TripDetailClientProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingVoucher, setDownloadingVoucher] = useState(false);
  const [downloadingItinerary, setDownloadingItinerary] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    fetchTripDetail();
  }, [tripId]);

  const fetchTripDetail = async () => {
    try {
      const res = await fetch(`/api/user/trips/${tripId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Trip tidak ditemukan');
          router.push(`/${locale}/my-trips`);
          return;
        }
        throw new Error('Failed to fetch trip');
      }
      
      const data = await res.json();
      setTrip(data.trip);
    } catch (error) {
      logger.error('Failed to fetch trip detail', error);
      toast.error('Gagal memuat detail trip');
    } finally {
      setLoading(false);
    }
  };

  const downloadVoucher = async () => {
    setDownloadingVoucher(true);
    try {
      const res = await fetch(`/api/user/trips/${tripId}/documents/voucher`);
      if (!res.ok) throw new Error('Failed to download voucher');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${trip?.code || tripId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Voucher berhasil diunduh');
    } catch (error) {
      logger.error('Failed to download voucher', error);
      toast.error('Gagal mengunduh voucher');
    } finally {
      setDownloadingVoucher(false);
    }
  };

  const downloadItinerary = async () => {
    setDownloadingItinerary(true);
    try {
      const res = await fetch(`/api/user/trips/${tripId}/documents/itinerary`);
      if (!res.ok) throw new Error('Failed to download itinerary');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `itinerary-${trip?.code || tripId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Itinerary berhasil diunduh');
    } catch (error) {
      logger.error('Failed to download itinerary', error);
      toast.error('Gagal mengunduh itinerary');
    } finally {
      setDownloadingItinerary(false);
    }
  };

  const downloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const res = await fetch(`/api/user/bookings/${tripId}/invoice`);
      if (!res.ok) throw new Error('Failed to download invoice');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${trip?.code || tripId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice berhasil diunduh');
    } catch (error) {
      logger.error('Failed to download invoice', error);
      toast.error('Gagal mengunduh invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700">Lunas</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700">Terkonfirmasi</Badge>;
      case 'pending':
        return <Badge variant="secondary">Menunggu Pembayaran</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-700">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canDownloadDocuments = trip?.status === 'paid' || trip?.status === 'confirmed' || trip?.status === 'completed';
  const canReview = trip?.status === 'completed' && !trip?.hasReview;
  const tripDate = trip?.tripDate ? new Date(trip.tripDate) : null;
  const isPastTrip = tripDate && tripDate < new Date();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-4 text-center py-12">
        <p className="text-muted-foreground">Trip tidak ditemukan</p>
        <Link href={`/${locale}/my-trips`}>
          <Button variant="link">Kembali ke Daftar Trip</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-6">
      {/* Header */}
      <div className="px-4 pb-4 pt-2 flex items-center gap-3">
        <Link
          href={`/${locale}/my-trips`}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Detail Trip</h1>
          <p className="text-xs text-muted-foreground">Kode: {trip.code}</p>
        </div>
        {getStatusBadge(trip.status)}
      </div>

      <div className="px-4 space-y-4">
        {/* Package Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
                <span className="text-4xl">🏝️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg truncate">
                  {trip.package?.name || 'Paket Wisata'}
                </h2>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {trip.package?.destination || '-'}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {trip.package?.duration || '-'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Informasi Trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Tanggal Keberangkatan</span>
              </div>
              <span className="font-bold">
                {tripDate ? format(tripDate, 'EEEE, d MMM yyyy', { locale: localeId }) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span>Jumlah Peserta</span>
              </div>
              <span className="font-bold">
                {trip.adultPax} Dewasa
                {trip.childPax > 0 && `, ${trip.childPax} Anak`}
                {trip.infantPax > 0 && `, ${trip.infantPax} Bayi`}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Total Pembayaran</span>
              <span className="text-lg font-bold text-primary">
                Rp {trip.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Waiver Section - Show for confirmed/paid trips */}
        {trip.tripDate && (trip.status === 'paid' || trip.status === 'confirmed') && (
          <WaiverSection tripId={tripId} tripDate={trip.tripDate} tripStatus={trip.status} />
        )}

        {/* Live Tracking Section - Show for confirmed/paid trips on trip day */}
        {trip.tripDate && (trip.status === 'paid' || trip.status === 'confirmed') && (
          <LiveTrackingSection tripId={tripId} tripDate={trip.tripDate} />
        )}

        {/* Booker Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Data Pemesan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <p className="font-medium">{trip.bookerName}</p>
              <p className="text-muted-foreground">{trip.bookerPhone}</p>
              <p className="text-muted-foreground">{trip.bookerEmail}</p>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        {canDownloadDocuments && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dokumen Trip
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={downloadVoucher}
                disabled={downloadingVoucher}
              >
                {downloadingVoucher ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium">Voucher</p>
                  <p className="text-xs text-muted-foreground">E-Ticket & Bukti Pembayaran</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={downloadItinerary}
                disabled={downloadingItinerary}
              >
                {downloadingItinerary ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium">Itinerary</p>
                  <p className="text-xs text-muted-foreground">Jadwal & Detail Perjalanan</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={downloadInvoice}
                disabled={downloadingInvoice}
              >
                {downloadingInvoice ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium">Invoice</p>
                  <p className="text-xs text-muted-foreground">Bukti Pembayaran & Tagihan</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Meeting Point */}
        {trip.package?.meetingPoints && trip.package.meetingPoints.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Titik Berkumpul
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trip.package.meetingPoints.map((point, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium text-sm">{point.name}</p>
                  <p className="text-xs text-muted-foreground">{point.address}</p>
                  <p className="text-xs font-medium text-primary mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {point.time}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* What's Included */}
        {trip.package?.inclusions && trip.package.inclusions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Yang Termasuk</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {trip.package.inclusions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Review CTA */}
        {canReview && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-4 text-center">
              <Star className="h-10 w-10 mx-auto text-amber-400 mb-2" />
              <h3 className="font-bold mb-1">Bagaimana Trip Anda?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Berikan penilaian untuk membantu traveler lainnya
              </p>
              <Link href={`/${locale}/my-trips/${tripId}/review`}>
                <Button className="w-full gap-2">
                  <Star className="h-4 w-4" />
                  Tulis Review
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Contact Support */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Ada pertanyaan tentang trip ini?
            </p>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/6285157787800?text=Halo, saya ingin bertanya tentang booking ${trip.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
              <a href="tel:+6285157787800" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  Telepon
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

