/**
 * KOL Trip Detail Client Component
 * Shows full KOL trip details with booking form
 */

'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  Sparkles,
  Users,
  X,
  Youtube,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';

type KolTripDetail = {
  id: string;
  slug: string;
  kol: {
    name: string;
    handle: string | null;
    platform: string | null;
    photoUrl: string | null;
    bio: string | null;
  };
  tripDate: string;
  maxParticipants: number;
  currentParticipants: number;
  spotsAvailable: number;
  isSoldOut: boolean;
  pricing: {
    basePrice: number;
    kolFee: number;
    finalPrice: number;
  };
  media: {
    heroImageUrl: string | null;
    videoUrl: string | null;
    galleryUrls: string[];
  };
  chatGroupId: string | null;
  package: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    destination: string;
    province: string;
    duration: string;
    durationDays: number;
    durationNights: number;
    thumbnailUrl: string | null;
    inclusions: string[];
    exclusions: string[];
    itinerary: Array<{
      day: number;
      title: string;
      activities: string[];
    }>;
    meetingPoints: Array<{
      name: string;
      address: string;
      time: string;
    }>;
    minPax: number;
    maxPax: number;
  } | null;
};

type KolTripDetailClientProps = {
  locale: string;
  slug: string;
};

function getPlatformIcon(platform: string | null, className = 'h-5 w-5') {
  switch (platform?.toLowerCase()) {
    case 'instagram':
      return <Instagram className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      );
    default:
      return <Sparkles className={className} />;
  }
}

export function KolTripDetailClient({ locale, slug }: KolTripDetailClientProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<KolTripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pax, setPax] = useState(1);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  const [isInclusionsOpen, setIsInclusionsOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchTripDetail();
  }, [slug]);

  const fetchTripDetail = async () => {
    try {
      const res = await fetch(`/api/public/kol/${slug}`);
      if (!res.ok) {
        if (res.status === 404 || res.status === 410) {
          toast.error('Trip tidak ditemukan atau sudah tidak tersedia');
          router.push(`/${locale}/kol`);
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setTrip(data.trip);
    } catch (error) {
      logger.error('Failed to fetch KOL trip', error);
      toast.error('Gagal memuat detail trip');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Trip Bareng ${trip?.kol.name}`,
      text: trip?.package?.name || 'Trip Eksklusif',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link berhasil disalin!');
    }
  };

  const handleBook = async () => {
    if (!trip) return;

    setIsBooking(true);

    // Redirect to booking wizard with KOL trip context
    const params = new URLSearchParams({
      packageId: trip.package?.id || '',
      kolTripId: trip.id,
      date: trip.tripDate,
      pax: pax.toString(),
    });

    router.push(`/${locale}/book?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <Sparkles className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">Trip Tidak Ditemukan</h2>
        <p className="mt-2 text-muted-foreground">
          Trip yang kamu cari mungkin sudah tidak tersedia.
        </p>
        <Link href={`/${locale}/kol`}>
          <Button className="mt-4">Lihat Trip Lainnya</Button>
        </Link>
      </div>
    );
  }

  const totalPrice = trip.pricing.finalPrice * pax;

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-background/95 px-4 py-3 backdrop-blur-sm sm:relative sm:bg-transparent">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Hero Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-violet-200 to-purple-200 sm:mx-4 sm:rounded-2xl">
        {(trip.media.heroImageUrl || trip.package?.thumbnailUrl) ? (
          <Image
            src={trip.media.heroImageUrl || trip.package?.thumbnailUrl || ''}
            alt={trip.kol.name}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Sparkles className="h-20 w-20 text-violet-400" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* KOL Badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-white shadow-lg">
            {trip.kol.photoUrl ? (
              <Image
                src={trip.kol.photoUrl}
                alt={trip.kol.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white">
                {trip.kol.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-white">
            <h2 className="text-lg font-bold drop-shadow-md">{trip.kol.name}</h2>
            {trip.kol.handle && (
              <div className="flex items-center gap-1 text-sm text-white/90">
                {getPlatformIcon(trip.kol.platform, 'h-4 w-4')}
                <span>{trip.kol.handle}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          {trip.spotsAvailable <= 5 && trip.spotsAvailable > 0 && (
            <Badge className="bg-orange-500 text-white shadow-lg">
              Sisa {trip.spotsAvailable} spot!
            </Badge>
          )}
          {trip.isSoldOut && (
            <Badge className="bg-red-500 text-white shadow-lg">Sold Out</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Package Title */}
        <div>
          <h1 className="text-2xl font-bold">{trip.package?.name || 'Trip Eksklusif'}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {trip.package?.destination}, {trip.package?.province}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {trip.package?.duration}
            </span>
          </div>
        </div>

        {/* Trip Info Card */}
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tanggal Trip</p>
                <p className="font-semibold">
                  {format(new Date(trip.tripDate), 'dd MMM yyyy', { locale: localeId })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peserta</p>
                <p className="font-semibold">
                  {trip.currentParticipants}/{trip.maxParticipants}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KOL Bio */}
        {trip.kol.bio && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getPlatformIcon(trip.kol.platform, 'h-4 w-4')}
                Tentang {trip.kol.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{trip.kol.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {trip.package?.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tentang Trip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {trip.package.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Itinerary */}
        {trip.package?.itinerary && trip.package.itinerary.length > 0 && (
          <Collapsible open={isItineraryOpen} onOpenChange={setIsItineraryOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Itinerary</CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      isItineraryOpen ? 'rotate-180' : ''
                    }`}
                  />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {trip.package.itinerary.map((day) => (
                    <div key={day.day} className="rounded-lg bg-muted/50 p-3">
                      <p className="font-semibold text-primary">
                        Day {day.day}: {day.title}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {day.activities.map((activity, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Inclusions/Exclusions */}
        <Collapsible open={isInclusionsOpen} onOpenChange={setIsInclusionsOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Termasuk & Tidak Termasuk</CardTitle>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    isInclusionsOpen ? 'rotate-180' : ''
                  }`}
                />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
                {/* Inclusions */}
                <div>
                  <p className="mb-2 text-sm font-medium text-green-600">Termasuk:</p>
                  <ul className="space-y-1.5">
                    {trip.package?.inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions */}
                <div>
                  <p className="mb-2 text-sm font-medium text-red-600">Tidak Termasuk:</p>
                  <ul className="space-y-1.5">
                    {trip.package?.exclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Meeting Points */}
        {trip.package?.meetingPoints && trip.package.meetingPoints.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                Titik Kumpul
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {trip.package.meetingPoints.map((point, idx) => (
                <div key={idx} className="rounded-lg bg-muted/50 p-3">
                  <p className="font-medium">{point.name}</p>
                  <p className="text-sm text-muted-foreground">{point.address}</p>
                  <Badge variant="secondary" className="mt-2">
                    <Clock className="mr-1 h-3 w-3" />
                    {point.time}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Chat Group CTA */}
        {trip.chatGroupId && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-800">Join Group Chat</p>
                <p className="text-sm text-green-700">
                  Setelah booking, kamu akan diinvite ke group chat eksklusif!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background p-4 shadow-lg">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          {/* Pax Selector */}
          <div className="flex items-center gap-2 rounded-lg border p-1">
            <button
              onClick={() => setPax(Math.max(1, pax - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
              disabled={pax <= 1 || trip.isSoldOut}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-semibold">{pax}</span>
            <button
              onClick={() => setPax(Math.min(trip.spotsAvailable, pax + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
              disabled={pax >= trip.spotsAvailable || trip.isSoldOut}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Price & Book */}
          <div className="flex flex-1 items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">
                Rp {totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={handleBook}
              disabled={trip.isSoldOut || isBooking}
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : trip.isSoldOut ? (
                'Sold Out'
              ) : (
                <>
                  Book Now
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

