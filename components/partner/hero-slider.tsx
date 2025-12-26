/**
 * Hero Slider Component
 * Swipeable banner carousel untuk dashboard home (superapp style)
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  background: string; // gradient or image URL
  textColor?: 'light' | 'dark';
};

type HeroSliderProps = {
  slides?: HeroSlide[];
  autoPlayInterval?: number;
};

export function HeroSlider({
  slides: customSlides,
  autoPlayInterval = 5000,
}: HeroSliderProps) {
  const params = useParams();
  const locale = params.locale as string;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Default slides jika tidak ada custom
  const defaultSlides: HeroSlide[] = [
    {
      id: '1',
      title: 'Selamat Datang di Partner Portal',
      subtitle: 'Kelola bisnis travel Anda dengan mudah',
      ctaText: 'Buat Booking Sekarang',
      ctaHref: `/${locale}/partner/bookings/new`,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: 'light',
    },
    {
      id: '2',
      title: 'Promo Paket Spesial',
      subtitle: 'Komisi hingga 25% untuk paket pilihan',
      ctaText: 'Lihat Paket',
      ctaHref: `/${locale}/partner/packages`,
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      textColor: 'light',
    },
    {
      id: '3',
      title: 'Raih Rewards Lebih Banyak',
      subtitle: 'Tukar poin dengan hadiah menarik',
      ctaText: 'Lihat Rewards',
      ctaHref: `/${locale}/partner/rewards`,
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      textColor: 'light',
    },
  ];

  const slides = customSlides || defaultSlides;

  // Auto play
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-md">
      {/* Slide Content */}
      <div
        className="relative px-6 py-8 transition-all duration-500"
        style={{ background: currentSlideData?.background }}
      >
        <div className="relative z-10">
          <h2
            className={cn(
              'mb-2 text-xl font-bold leading-tight',
              currentSlideData?.textColor === 'light'
                ? 'text-white'
                : 'text-gray-900'
            )}
          >
            {currentSlideData?.title}
          </h2>
          {currentSlideData?.subtitle && (
            <p
              className={cn(
                'mb-4 text-sm',
                currentSlideData.textColor === 'light'
                  ? 'text-white/90'
                  : 'text-gray-700'
              )}
            >
              {currentSlideData.subtitle}
            </p>
          )}
          {currentSlideData?.ctaText && currentSlideData?.ctaHref && (
            <Link href={currentSlideData.ctaHref}>
              <Button
                size="sm"
                className={cn(
                  'shadow-lg',
                  currentSlideData.textColor === 'light'
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'bg-primary text-white hover:bg-primary/90'
                )}
              >
                {currentSlideData.ctaText}
              </Button>
            </Link>
          )}
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={cn(
                'absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-all hover:scale-110',
                currentSlideData?.textColor === 'light'
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-black/20 text-black hover:bg-black/30'
              )}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className={cn(
                'absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-all hover:scale-110',
                currentSlideData?.textColor === 'light'
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-black/20 text-black hover:bg-black/30'
              )}
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === currentSlide
                  ? 'w-6 bg-white'
                  : 'w-1.5 bg-white/50 hover:bg-white/70'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
