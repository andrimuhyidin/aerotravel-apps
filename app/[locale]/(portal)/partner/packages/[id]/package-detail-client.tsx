/**
 * Partner Package Detail Client Component - ENHANCED
 * Interactive gallery, enhanced booking widget, reviews, and improved UX
 * Uses TanStack Query with realtime availability updates
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/shared/breadcrumb';
import { PhotoGalleryLightbox } from '@/components/partner/photo-gallery-lightbox';
import { EnhancedBookingWidget } from '@/components/partner/enhanced-booking-widget';
import { PackageReviewsSection } from '@/components/partner/package-reviews-section';
import { SimilarPackagesCarousel } from '@/components/partner/similar-packages-carousel';
import { PackageFAQSection } from '@/components/partner/package-faq-section';
import { PackageQAWidget } from '@/components/partner/package-qa-widget';
import { formatCurrency } from '@/lib/partner/package-utils';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { useAvailabilityRealtime } from '@/hooks/use-availability-realtime';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  MapPin,
  Package as PackageIcon,
  Users,
  Star,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ItineraryDay } from '@/lib/guide/itinerary';
import { getFeatureTracker } from '@/lib/analytics/feature-tracker';
import { usePerformanceMonitoring } from '@/lib/analytics/performance-monitor';
import { QuickFeedbackButton } from '@/components/feedback/feedback-dialog';

type PackageDetail = {
  id: string;
  name: string;
  description: string | null;
  destination: string;
  province: string;
  duration_days: number;
  duration_nights: number;
  min_pax: number;
  max_pax: number;
  package_type: string;
  inclusions: string[] | null;
  exclusions: string[] | null;
  thumbnail_url: string | null;
  itineraryDays?: ItineraryDay[];
  gallery_urls?: string[] | null;
  meeting_point?: string | null;
  package_prices: Array<{
    min_pax: number;
    max_pax: number;
    price_publish: number;
    price_nta: number;
  }>;
  ratings?: {
    averageRating: number;
    totalReviews: number;
  };
};

export function PackageDetailClient({
  locale,
  packageId,
}: {
  locale: string;
  packageId: string;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('description');
  const [isSticky, setIsSticky] = useState(false);
  const tracker = getFeatureTracker();

  // Track performance metrics
  usePerformanceMonitoring('package_detail');

  // Fetch package data with TanStack Query
  const { data: packageData, isLoading: loading, error } = useQuery<PackageDetail>({
    queryKey: queryKeys.partner.packages.list({ id: packageId }),
    queryFn: async () => {
      const response = await apiClient.get<{ package: PackageDetail }>(
        `/api/partner/packages/${packageId}`
      );
      return response.data.package;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Setup realtime availability updates
  const { onUpdate, isSubscribed } = useAvailabilityRealtime(packageId);

  // Handle realtime updates
  useEffect(() => {
    onUpdate((update) => {
      // Invalidate cache when availability changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.partner.packages.list({ id: packageId }),
      });
      toast.info(`Ketersediaan paket diperbarui: ${update.availableSlots} slot tersisa`);
    });
  }, [onUpdate, queryClient, packageId]);

  useEffect(() => {
    // Track page view and feature usage
    tracker.trackPageView('photo_gallery_lightbox');
    tracker.trackFeatureUse('booking_widget', 'view', packageId);

    const handleScroll = () => {
      setIsSticky(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [packageId, tracker]);

  if (loading) {
    return <PackageDetailSkeleton />;
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <EmptyState
            icon={PackageIcon}
            title="Paket tidak ditemukan"
            description="Paket wisata yang Anda cari tidak tersedia"
            action={
              <Button asChild>
                <Link href={`/${locale}/partner/packages`}>
                  Kembali ke Katalog
                </Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const images = packageData.gallery_urls && packageData.gallery_urls.length > 0
    ? packageData.gallery_urls
    : packageData.thumbnail_url
    ? [packageData.thumbnail_url]
    : [];

  const pricingTiers = packageData.package_prices.map((tier) => ({
    minPax: tier.min_pax,
    maxPax: tier.max_pax,
    ntaPrice: tier.price_nta,
    publishPrice: tier.price_publish,
    margin: tier.price_publish - tier.price_nta,
  }));

  const breadcrumbItems = [
    { label: 'Paket Wisata', href: `/${locale}/partner/packages` },
    { label: packageData.destination, href: `/${locale}/partner/packages?destination=${packageData.destination}` },
    { label: packageData.name },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Breadcrumb */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button (Mobile) */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4 md:hidden"
        >
          <Link href={`/${locale}/partner/packages`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{packageData.package_type}</Badge>
                {packageData.ratings && packageData.ratings.totalReviews > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{packageData.ratings.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({packageData.ratings.totalReviews})</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                {packageData.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{packageData.destination}, {packageData.province}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {packageData.duration_days}D{packageData.duration_nights}N
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {packageData.min_pax}-{packageData.max_pax} Pax
                  </span>
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            <PhotoGalleryLightbox images={images} alt={packageData.name} />

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
                <TabsTrigger value="description">Deskripsi</TabsTrigger>
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="pricing">Harga</TabsTrigger>
                <TabsTrigger value="policies">Kebijakan</TabsTrigger>
                <TabsTrigger value="reviews">
                  Reviews
                  {packageData.ratings && packageData.ratings.totalReviews > 0 && (
                    <Badge variant="secondary" className="ml-1 rounded-full px-1.5 min-w-[20px] text-xs">
                      {packageData.ratings.totalReviews}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="faq" className="hidden lg:block">FAQ</TabsTrigger>
              </TabsList>

              {/* Description Tab */}
              <TabsContent value="description" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tentang Paket Ini</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-line">
                      {packageData.description || 'Deskripsi paket tidak tersedia.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Inclusions & Exclusions */}
                <div className="grid md:grid-cols-2 gap-4">
                  {packageData.inclusions && packageData.inclusions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-600" />
                          Termasuk
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {packageData.inclusions.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {packageData.exclusions && packageData.exclusions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <X className="h-5 w-5 text-red-600" />
                          Tidak Termasuk
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {packageData.exclusions.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <X className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Meeting Point */}
                {packageData.meeting_point && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Titik Kumpul
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {packageData.meeting_point}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Itinerary Tab */}
              <TabsContent value="itinerary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rencana Perjalanan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {packageData.itineraryDays && packageData.itineraryDays.length > 0 ? (
                      <div className="space-y-6">
                        {packageData.itineraryDays.map((day, idx) => (
                          <div key={idx} className="relative pl-8 pb-6 border-l-2 border-primary/30 last:border-l-0 last:pb-0">
                            <div className="absolute left-0 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                              {day.dayNumber}
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-bold text-lg">{day.title || `Hari ${day.dayNumber}`}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Full Day</span>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                                {(day as any).description || day.activities?.join(', ') || 'Tidak ada deskripsi'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Itinerary belum tersedia untuk paket ini.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Harga & Komisi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 text-sm font-semibold">Jumlah Pax</th>
                            <th className="text-right p-3 text-sm font-semibold">Harga NTA</th>
                            <th className="text-right p-3 text-sm font-semibold">Harga Publish</th>
                            <th className="text-right p-3 text-sm font-semibold">Komisi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricingTiers.map((tier, idx) => {
                            const marginPercent = tier.ntaPrice > 0 ? (tier.margin / tier.ntaPrice) * 100 : 0;
                            return (
                              <tr key={idx} className="border-b last:border-b-0">
                                <td className="p-3 text-sm">
                                  {tier.minPax === tier.maxPax
                                    ? `${tier.minPax} pax`
                                    : `${tier.minPax}-${tier.maxPax} pax`}
                                </td>
                                <td className="p-3 text-sm text-right font-medium">
                                  {formatCurrency(tier.ntaPrice)}
                                </td>
                                <td className="p-3 text-sm text-right text-muted-foreground">
                                  {formatCurrency(tier.publishPrice)}
                                </td>
                                <td className="p-3 text-sm text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(tier.margin)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {marginPercent.toFixed(0)}%
                                    </Badge>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Policies Tab */}
              <TabsContent value="policies" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Kebijakan & Ketentuan</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none">
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Kebijakan Pembatalan</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Pembatalan 30 hari sebelum keberangkatan: Refund 100%</li>
                          <li>Pembatalan 15-29 hari sebelum keberangkatan: Refund 50%</li>
                          <li>Pembatalan kurang dari 14 hari: Tidak ada refund</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Ketentuan Umum</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Minimal peserta harus terpenuhi untuk keberangkatan</li>
                          <li>Harga dapat berubah sewaktu-waktu</li>
                          <li>Dokumen perjalanan wajib dibawa</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <PackageReviewsSection packageId={packageId} />
              </TabsContent>

              {/* FAQ Tab */}
              <TabsContent value="faq" className="mt-6">
                <PackageFAQSection packageId={packageId} />
              </TabsContent>
            </Tabs>

            {/* AI Q&A Widget */}
            <div className="pt-4">
              <PackageQAWidget packageId={packageId} packageName={packageData.name} />
            </div>

            {/* Similar Packages */}
            <div className="pt-6">
              <SimilarPackagesCarousel packageId={packageId} locale={locale} />
            </div>
          </div>

          {/* Right Column - Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <EnhancedBookingWidget
              packageId={packageData.id}
              packageName={packageData.name}
              pricingTiers={pricingTiers}
              minPax={packageData.min_pax}
              maxPax={packageData.max_pax}
              isInstantConfirm={true}
              locale={locale}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t shadow-lg p-4 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Mulai dari</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(pricingTiers[0]?.ntaPrice || 0)}
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href={`/${locale}/partner/bookings/new?packageId=${packageId}`}>
              <Zap className="h-4 w-4" />
              Book Now
            </Link>
          </Button>
        </div>
      </div>

      {/* Floating Feedback Button */}
      <QuickFeedbackButton variant="floating" className="lg:bottom-20" />
    </div>
  );
}

// Loading Skeleton
function PackageDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
