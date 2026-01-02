/**
 * Gallery Client Component
 * Shows trip photos with review-gated unlock
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Camera,
  Download,
  Image as ImageIcon,
  Loader2,
  Lock,
  MapPin,
  Send,
  Star,
  X,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type Photo = {
  id: string;
  url: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  uploadedAt: string;
  blurred: boolean;
};

type GalleryData = {
  tripId: string;
  tripCode: string;
  tripDate: string;
  package: {
    id: string;
    name: string;
    destination: string;
  } | null;
  hasReview: boolean;
  unlocked: boolean;
  photos: Photo[];
  totalPhotos: number;
};

type GalleryClientProps = {
  tripId: string;
  locale: string;
};

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          className="p-1"
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300 hover:text-amber-200'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function GalleryClient({ tripId, locale }: GalleryClientProps) {
  const [data, setData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // Review form state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/user/trips/${tripId}/photos`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Silakan login untuk melihat foto');
          return;
        }
        if (response.status === 403) {
          setError('Anda bukan peserta trip ini');
          return;
        }
        throw new Error('Failed to fetch');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      logger.error('Failed to fetch gallery', err);
      setError('Gagal memuat galeri');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Berikan rating terlebih dahulu');
      return;
    }
    if (reviewText.length < 10) {
      toast.error('Review minimal 10 karakter');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/user/trips/${tripId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review: reviewText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit');
      }

      toast.success('Review berhasil! Foto sudah terbuka.');
      fetchData(); // Refresh to show unlocked photos
    } catch (error) {
      logger.error('Failed to submit review', error);
      toast.error('Gagal mengirim review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (photo: Photo) => {
    if (!photo.url) return;
    
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aerotravel-${tripId}-${photo.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Foto berhasil diunduh!');
    } catch {
      toast.error('Gagal mengunduh foto');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Link href={`/${locale}`}>
          <Button variant="outline" className="mt-4">Kembali</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">Galeri Trip</h1>
          <p className="text-xs text-muted-foreground">#{data.tripCode}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Camera className="h-3 w-3" />
          {data.totalPhotos} foto
        </div>
      </div>

      {/* Trip Info */}
      {data.package && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                🏝️
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-sm">{data.package.name}</h2>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {data.package.destination}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(data.tripDate), 'd MMM yyyy', { locale: localeId })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Required Banner */}
      {!data.unlocked && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
              <Lock className="h-4 w-4" />
              Review untuk Membuka Foto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-amber-700">
              Bagikan pengalaman trip Anda untuk membuka akses foto HD dan download.
            </p>
            
            {/* Star Rating */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-amber-800">Rating Anda</p>
              <StarRating rating={rating} onRate={setRating} />
            </div>

            {/* Review Text */}
            <Textarea
              placeholder="Ceritakan pengalaman trip Anda... (min. 10 karakter)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-[100px] bg-white"
            />

            <Button 
              onClick={handleSubmitReview} 
              disabled={submitting || rating === 0 || reviewText.length < 10}
              className="w-full"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Kirim Review & Buka Foto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Photo Grid */}
      {data.photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada foto tersedia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {data.photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => data.unlocked && setSelectedPhoto(photo)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md bg-muted',
                !data.unlocked && 'cursor-not-allowed'
              )}
            >
              {photo.thumbnailUrl ? (
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.caption || 'Trip photo'}
                  className={cn(
                    'h-full w-full object-cover',
                    photo.blurred && 'blur-lg scale-110'
                  )}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {photo.blurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Lock className="h-6 w-6 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && data.unlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          <img
            src={selectedPhoto.url || selectedPhoto.thumbnailUrl || ''}
            alt={selectedPhoto.caption || 'Trip photo'}
            className="max-h-[80vh] max-w-[90vw] object-contain"
          />

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            {selectedPhoto.caption && (
              <p className="text-sm text-white">{selectedPhoto.caption}</p>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDownload(selectedPhoto)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download HD
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

