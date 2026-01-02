/**
 * Public Booking Wizard Client Component
 * 4-Step booking flow for B2C customers with Xendit payment integration
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  trackFunnelStep,
  FUNNEL_STEPS,
  trackBookingComplete,
} from '@/lib/analytics/journey-tracker';
import { trackCheckoutProgress, trackAddPaymentInfo } from '@/lib/analytics/analytics';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

// Import step components
import { StepPackagePublic } from './step-package';
import { StepDatePublic } from './step-date';
import { StepPassengersPublic } from './step-passengers';
import { StepPaymentPublic } from './step-payment';

const STEPS = [
  { id: 1, label: 'Paket', icon: MapPin },
  { id: 2, label: 'Tanggal', icon: Calendar },
  { id: 3, label: 'Peserta', icon: Users },
  { id: 4, label: 'Bayar', icon: CreditCard },
];

// Booking form schema
const bookingSchema = z.object({
  packageId: z.string().min(1, 'Pilih paket terlebih dahulu'),
  packageSlug: z.string().optional(),
  tripDate: z.date({ message: 'Pilih tanggal trip' }),
  // Primary contact (booker)
  bookerName: z.string().min(3, 'Nama minimal 3 karakter'),
  bookerPhone: z.string().min(10, 'Nomor telepon tidak valid'),
  bookerEmail: z.string().email('Email tidak valid'),
  // Passengers
  adultPax: z.number().min(1, 'Minimal 1 orang dewasa'),
  childPax: z.number().min(0).default(0),
  infantPax: z.number().min(0).default(0),
  passengers: z.array(z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    type: z.enum(['adult', 'child', 'infant']),
    identityNumber: z.string().optional(),
    phone: z.string().optional(),
  })).optional(),
  specialRequests: z.string().optional(),
  // Terms
  agreedToTerms: z.boolean().refine((v) => v === true, 'Anda harus menyetujui syarat dan ketentuan'),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

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

export function BookingWizardClient() {
  const t = useTranslations('booking');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPackageSlug = searchParams.get('package');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [packageData, setPackageData] = useState<PackageData | null>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      packageId: '',
      packageSlug: initialPackageSlug || '',
      adultPax: 2,
      childPax: 0,
      infantPax: 0,
      passengers: [],
      specialRequests: '',
      agreedToTerms: false,
    },
  });

  const values = form.watch();

  // Track booking start on mount
  useEffect(() => {
    trackFunnelStep(FUNNEL_STEPS.START_BOOKING, {
      packageSlug: initialPackageSlug,
    });
    trackCheckoutProgress({
      step: 1,
      stepName: 'Paket',
    });
  }, []);

  // Load package data if slug provided
  useEffect(() => {
    if (initialPackageSlug && !packageData) {
      loadPackageBySlug(initialPackageSlug);
    }
  }, [initialPackageSlug]);

  const loadPackageBySlug = async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/packages/${slug}`);
      if (!res.ok) throw new Error('Package not found');
      
      const data = await res.json();
      setPackageData(data.package);
      form.setValue('packageId', data.package.id);
      form.setValue('packageSlug', data.package.slug);
      logger.info('Package loaded', { slug });
    } catch (error) {
      logger.error('Failed to load package', error, { slug });
      toast.error('Paket tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!packageData) return 0;
    const { adultPax, childPax, infantPax } = values;
    return (
      (adultPax || 0) * packageData.pricing.adultPrice +
      (childPax || 0) * packageData.pricing.childPrice +
      (infantPax || 0) * packageData.pricing.infantPrice
    );
  };

  const totalPrice = calculateTotal();
  const totalPax = (values.adultPax || 0) + (values.childPax || 0) + (values.infantPax || 0);

  // Step navigation
  const handleNext = async () => {
    let fieldsToValidate: (keyof BookingFormData)[] = [];
    
    if (currentStep === 1) fieldsToValidate = ['packageId'];
    if (currentStep === 2) fieldsToValidate = ['tripDate'];
    if (currentStep === 3) fieldsToValidate = ['bookerName', 'bookerPhone', 'bookerEmail', 'adultPax'];
    
    const valid = await form.trigger(fieldsToValidate);
    if (valid && currentStep < 4) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Track funnel step
      const stepMap: Record<number, typeof FUNNEL_STEPS[keyof typeof FUNNEL_STEPS]> = {
        2: FUNNEL_STEPS.SELECT_DATE,
        3: FUNNEL_STEPS.FILL_DETAILS,
        4: FUNNEL_STEPS.SELECT_PAYMENT,
      };
      const funnelStep = stepMap[nextStep];
      if (funnelStep) {
        trackFunnelStep(funnelStep, {
          packageId: form.getValues('packageId'),
          step: nextStep,
        });
      }

      // Track checkout progress
      trackCheckoutProgress({
        step: nextStep,
        stepName: STEPS[nextStep - 1]?.label || '',
      });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit booking
  const handleSubmit = async (data: BookingFormData) => {
    setSubmitting(true);
    try {
      // Create booking
      const bookingRes = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: data.packageId,
          tripDate: data.tripDate.toISOString(),
          bookerName: data.bookerName,
          bookerPhone: data.bookerPhone,
          bookerEmail: data.bookerEmail,
          adultPax: data.adultPax,
          childPax: data.childPax,
          infantPax: data.infantPax,
          passengers: data.passengers,
          specialRequests: data.specialRequests,
          totalAmount: totalPrice,
        }),
      });

      if (!bookingRes.ok) {
        const error = await bookingRes.json();
        throw new Error(error.message || 'Gagal membuat booking');
      }

      const booking = await bookingRes.json();

      // Create payment invoice via Xendit
      const paymentRes = await fetch('/api/public/bookings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          bookingCode: booking.code,
          amount: totalPrice,
          payerEmail: data.bookerEmail,
          payerName: data.bookerName,
          payerPhone: data.bookerPhone,
          description: `Booking ${booking.code} - ${packageData?.name}`,
        }),
      });

      if (!paymentRes.ok) {
        throw new Error('Gagal membuat invoice pembayaran');
      }

      const payment = await paymentRes.json();

      // Redirect to Xendit checkout page
      // Track payment info added
      trackAddPaymentInfo({
        transactionId: booking.id,
        value: totalPrice,
        paymentType: 'xendit',
      });

      // Track payment processing step
      trackFunnelStep(FUNNEL_STEPS.PAYMENT_PROCESSING, {
        bookingId: booking.id,
        packageId: data.packageId,
        value: totalPrice,
      });

      if (payment.invoiceUrl) {
        window.location.href = payment.invoiceUrl;
      } else {
        toast.success('Booking berhasil! Silakan lakukan pembayaran.');
        router.push(`/id/payment/${booking.id}`);
      }
    } catch (error) {
      logger.error('Booking submission failed', error);
      toast.error(error instanceof Error ? error.message : 'Gagal membuat booking');
      setSubmitting(false);
    }
  };

  // Check if can proceed to next step
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!values.packageId;
      case 2:
        return !!values.tripDate;
      case 3:
        return values.bookerName?.length >= 3 && 
               values.bookerPhone?.length >= 10 && 
               values.bookerEmail?.includes('@') &&
               values.adultPax >= 1;
      case 4:
        return values.agreedToTerms;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      {/* Step Header */}
      <div className="px-4 pb-4 pt-2">
        <h1 className="text-lg font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          Step {currentStep} dari 4
        </p>
      </div>

      {/* Step Indicator */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                    currentStep >= step.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-[10px] font-medium',
                    currentStep >= step.id
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-6 sm:w-10',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Step 1: Package Selection */}
            {currentStep === 1 && (
              <div className="animate-in slide-in-from-right duration-300">
                <StepPackagePublic
                  packageData={packageData}
                  onPackageSelect={(pkg) => {
                    setPackageData(pkg);
                    form.setValue('packageId', pkg.id);
                    form.setValue('packageSlug', pkg.slug);
                  }}
                  loading={loading}
                />
              </div>
            )}

            {/* Step 2: Date Selection */}
            {currentStep === 2 && (
              <div className="animate-in slide-in-from-right duration-300">
                <StepDatePublic
                  packageId={values.packageId}
                  selectedDate={values.tripDate}
                  onDateSelect={(date) => form.setValue('tripDate', date)}
                />
              </div>
            )}

            {/* Step 3: Passengers */}
            {currentStep === 3 && (
              <div className="animate-in slide-in-from-right duration-300">
                <StepPassengersPublic
                  form={form}
                  packageData={packageData}
                />
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <div className="animate-in slide-in-from-right duration-300">
                <StepPaymentPublic
                  form={form}
                  packageData={packageData}
                  totalPrice={totalPrice}
                  totalPax={totalPax}
                />
              </div>
            )}
          </form>
        </Form>
      </div>

      {/* Price Summary Bar */}
      {packageData && currentStep > 1 && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total ({totalPax} orang)</p>
              <p className="text-lg font-bold text-primary">
                Rp {totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
            {values.tripDate && (
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(values.tripDate, 'd MMM yyyy', { locale: id })}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="border-t bg-background px-4 py-4">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={submitting}
              className="h-12"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            type="button"
            onClick={currentStep === 4 ? () => form.handleSubmit(handleSubmit)() : handleNext}
            disabled={!canProceed() || submitting}
            className={cn(
              'flex-1 h-12 font-semibold shadow-lg',
              currentStep === 4
                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
                : ''
            )}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : currentStep === 4 ? (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Bayar Sekarang
              </>
            ) : (
              <>
                Lanjutkan
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
