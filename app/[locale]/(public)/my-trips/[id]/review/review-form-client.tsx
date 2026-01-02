/**
 * Review Form Client Component
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import confetti from 'canvas-confetti';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Berikan rating').max(5),
  review: z.string().min(10, 'Review minimal 10 karakter').max(1000),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

type TripInfo = {
  id: string;
  code: string;
  tripDate: string;
  packageName: string;
  packageSlug: string;
  destination: string;
};

type ReviewFormClientProps = {
  locale: string;
  tripId: string;
};

export function ReviewFormClient({ locale, tripId }: ReviewFormClientProps) {
  const router = useRouter();
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      review: '',
    },
  });

  const selectedRating = form.watch('rating');

  useEffect(() => {
    fetchTripInfo();
  }, [tripId]);

  const fetchTripInfo = async () => {
    try {
      const res = await fetch(`/api/user/trips/${tripId}`);
      if (!res.ok) throw new Error('Trip not found');
      
      const data = await res.json();
      
      // Check if already reviewed
      if (data.trip.hasReview) {
        toast.info('Anda sudah memberikan review untuk trip ini');
        router.push(`/${locale}/my-trips/${tripId}`);
        return;
      }
      
      // Check if trip is completed
      if (data.trip.status !== 'completed') {
        toast.error('Review hanya bisa diberikan setelah trip selesai');
        router.push(`/${locale}/my-trips/${tripId}`);
        return;
      }
      
      setTripInfo({
        id: data.trip.id,
        code: data.trip.code,
        tripDate: data.trip.tripDate,
        packageName: data.trip.package?.name || 'Paket Wisata',
        packageSlug: data.trip.package?.slug || '',
        destination: data.trip.package?.destination || '-',
      });
    } catch (error) {
      logger.error('Failed to fetch trip info', error);
      toast.error('Gagal memuat informasi trip');
      router.push(`/${locale}/my-trips`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ReviewFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/user/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: tripId,
          rating: data.rating,
          review: data.review,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Gagal mengirim review');
      }

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success('Terima kasih atas review Anda!');
      router.push(`/${locale}/my-trips/${tripId}`);
    } catch (error) {
      logger.error('Failed to submit review', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim review');
      setSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Buruk';
      case 2: return 'Kurang';
      case 3: return 'Cukup';
      case 4: return 'Bagus';
      case 5: return 'Sangat Bagus';
      default: return 'Berikan Rating';
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-6">
      {/* Header */}
      <div className="px-4 pb-4 pt-2 flex items-center gap-3">
        <Link
          href={`/${locale}/my-trips/${tripId}`}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Tulis Review</h1>
          <p className="text-xs text-muted-foreground">Bagikan pengalaman Anda</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Trip Info */}
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
              <span className="text-2xl">🏝️</span>
            </div>
            <div>
              <h2 className="font-bold">{tripInfo?.packageName}</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {tripInfo?.destination}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Star Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <Card className="border-primary/20">
                    <CardContent className="p-6 text-center">
                      <FormLabel className="text-lg font-bold block mb-4">
                        Bagaimana pengalaman Anda?
                      </FormLabel>
                      <div className="flex justify-center gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => field.onChange(star)}
                            className="p-1 transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              className={cn(
                                'h-10 w-10 transition-colors',
                                (hoveredRating || selectedRating) >= star
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              )}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-lg font-semibold text-primary">
                        {getRatingLabel(hoveredRating || selectedRating)}
                      </p>
                      <FormMessage />
                    </CardContent>
                  </Card>
                </FormItem>
              )}
            />

            {/* Review Text */}
            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Ceritakan pengalaman Anda
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Apa yang paling Anda sukai dari trip ini? Tips untuk traveler lain?"
                      rows={5}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground text-right">
                    {field.value.length}/1000 karakter
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold gap-2"
              disabled={submitting || selectedRating === 0}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Star className="h-5 w-5" />
                  Kirim Review
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

