/**
 * Partner Booking Wizard Client Component - REDESIGNED
 * 3-Step booking flow with ultra-compact mobile-native design
 * Follows design language from booking list page
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package as PackageIcon,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import confetti from 'canvas-confetti';

import { useQueryClient } from '@tanstack/react-query';
import queryKeys from '@/lib/queries/query-keys';
import { usePartnerAuth } from '@/hooks/use-partner-auth';
import { logger } from '@/lib/utils/logger';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Form } from '@/components/ui/form';
import {
  calculateMargin,
  calculateNTATotal,
  formatCurrency,
  type QuickInfoPackage,
} from '@/lib/partner/package-utils';
import { getWalletBalance, type WalletBalance } from '@/lib/partner/wallet';
import { cn } from '@/lib/utils';

// Import step components
import { StepPackage } from './step-package';
import { StepCustomer } from './step-customer';
import { StepReview } from './step-review';

const STEPS = [
  { id: 1, label: 'Paket & Tanggal', icon: PackageIcon },
  { id: 2, label: 'Customer & Peserta', icon: Users },
  { id: 3, label: 'Review & Bayar', icon: Check },
];

const bookingWizardSchema = z.object({
  packageId: z.string().min(1, 'Pilih paket terlebih dahulu'),
  tripDate: z.date({ message: 'Pilih tanggal trip' }),
  customerId: z.string().optional(),
  customerName: z.string().min(3, 'Nama customer minimal 3 karakter'),
  customerPhone: z.string().min(10, 'Nomor telepon tidak valid'),
  customerEmail: z.string().email('Email tidak valid').optional().or(z.literal('')),
  adultPax: z.number().min(1, 'Minimal 1 orang dewasa'),
  childPax: z.number().min(0).default(0).optional(),
  infantPax: z.number().min(0).default(0).optional(),
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(['wallet', 'external'], {
    message: 'Pilih metode pembayaran',
  }),
});

type BookingWizardFormData = z.infer<typeof bookingWizardSchema>;

type BookingWizardClientProps = {
  locale: string;
  initialPackageId?: string;
};

export function BookingWizardClient({
  locale,
  initialPackageId,
}: BookingWizardClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { partnerId } = usePartnerAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Data states
  const [packageData, setPackageData] = useState<QuickInfoPackage | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);

  const form = useForm<BookingWizardFormData>({
    resolver: zodResolver(bookingWizardSchema),
    defaultValues: {
      packageId: initialPackageId || '',
      adultPax: 1,
      childPax: 0,
      infantPax: 0,
      paymentMethod: 'wallet',
      specialRequests: '',
    },
  });

  // Watch form values for summary calculation
  const values = form.watch();

  // Load initial data
  useEffect(() => {
    if (values.packageId) {
      loadPackageData(values.packageId);
    }
  }, [values.packageId]);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  const loadPackageData = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/partner/packages/${id}/quick-info`);
      if (!res.ok) throw new Error('Failed to fetch package');
      
      const data = await res.json();
      setPackageData(data.package);
      logger.info('Package data loaded successfully', { packageId: id });
    } catch (e) {
      logger.error('Failed to load package data', e, { packageId: id });
      toast.error('Gagal memuat data paket. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const res = await fetch('/api/partner/wallet/balance');
      if (!res.ok) throw new Error('Failed to fetch wallet balance');
      const data = await res.json();
      setWalletBalance(data);
      logger.info('Wallet balance loaded successfully');
    } catch (e) {
      logger.error('Failed to load wallet balance', e);
      // Don't show toast for wallet - it's not critical
    }
  };

  // Calculations
  const ntaTotal =
    packageData && packageData.pricingTiers.length > 0
      ? calculateNTATotal(
          values.adultPax || 1,
          values.childPax || 0,
          values.infantPax || 0,
          packageData.pricingTiers
        )
      : 0;

  const margin =
    packageData && packageData.pricingTiers.length > 0
      ? calculateMargin(
          values.adultPax || 2,
          values.childPax || 0,
          values.infantPax || 0,
          packageData.pricingTiers
        )
      : 0;

  const publishTotal = ntaTotal + margin;
  const totalPax = (values.adultPax || 0) + (values.childPax || 0) + (values.infantPax || 0);

  const handleNext = async () => {
    let fields: any[] = [];
    if (currentStep === 1) fields = ['packageId', 'tripDate'];
    if (currentStep === 2) fields = ['customerName', 'customerPhone', 'adultPax'];

    const valid = await form.trigger(fields);
    if (valid && currentStep < 3) {
      setCurrentStep((s) => s + 1);
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (data: BookingWizardFormData) => {
    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      
      toast.success('Booking berhasil dibuat!');
      router.push(`/${locale}/partner/bookings`);
    } catch (error) {
      toast.error('Gagal membuat booking');
      setSubmitting(false);
    }
  };

  const canProceed =
    currentStep === 1
      ? values.packageId && values.tripDate
      : currentStep === 2
      ? values.customerName && values.customerPhone && values.adultPax >= 1
      : true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-muted/30 pb-[180px]">
      {/* Ultra-Compact Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/partner/packages`}
              className="p-1.5 -ml-1.5 hover:bg-muted rounded-full shrink-0 active:scale-95 transition-transform"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-sm font-bold">Buat Booking</h1>
              <p className="text-[10px] text-muted-foreground">
                Step {currentStep} dari {STEPS.length}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            Draft
          </Badge>
        </div>
        
        {/* Step Navigation Indicators - Clickable */}
        <div className="px-4 pb-2 flex items-center justify-center gap-2">
          {STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;
            const isClickable = stepNumber < currentStep || (stepNumber === currentStep);
            
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && handleStepChange(stepNumber)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-medium whitespace-nowrap',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && !isActive && 'bg-green-50 text-green-700 hover:bg-green-100',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground cursor-not-allowed',
                  isClickable && !isActive && 'cursor-pointer active:scale-95'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0',
                  isActive && 'bg-white/20',
                  isCompleted && !isActive && 'bg-green-600 text-white'
                )}>
                  {isCompleted && !isActive ? <Check className="h-3 w-3" /> : stepNumber}
                </div>
                <span className="text-xs font-medium">{step.title}</span>
              </button>
            );
          })}
        </div>
        
        {/* Animated Gradient Progress Bar */}
        <div className="h-1 bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-blue-500 to-primary transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Step 1: Package & Date */}
            {currentStep === 1 && (
              <div className="animate-in slide-in-from-right duration-300">
                <StepPackage
                  packageId={values.packageId}
                  tripDate={values.tripDate}
                  onChange={(data) => {
                    if (data.packageId !== undefined)
                      form.setValue('packageId', data.packageId);
                    if (data.tripDate !== undefined)
                      form.setValue('tripDate', data.tripDate);
                  }}
                  onNext={handleNext}
                />
              </div>
            )}

            {/* Step 2: Customer & Participants */}
            {currentStep === 2 && (
              <div className="animate-in slide-in-from-right duration-300">
                <StepCustomer
                  customerName={values.customerName}
                  customerPhone={values.customerPhone}
                  customerEmail={values.customerEmail}
                  adultPax={values.adultPax}
                  childPax={values.childPax}
                  infantPax={values.infantPax}
                  specialRequests={values.specialRequests}
                  onChange={(data) => {
                    if (data.customerId !== undefined)
                      form.setValue('customerId', data.customerId);
                    if (data.customerName !== undefined)
                      form.setValue('customerName', data.customerName);
                    if (data.customerPhone !== undefined)
                      form.setValue('customerPhone', data.customerPhone);
                    if (data.customerEmail !== undefined)
                      form.setValue('customerEmail', data.customerEmail);
                    if (data.adultPax !== undefined)
                      form.setValue('adultPax', data.adultPax);
                    if (data.childPax !== undefined)
                      form.setValue('childPax', data.childPax);
                    if (data.infantPax !== undefined)
                      form.setValue('infantPax', data.infantPax);
                    if (data.specialRequests !== undefined)
                      form.setValue('specialRequests', data.specialRequests);
                  }}
                  onNext={handleNext}
                  onBack={handlePrev}
                />
              </div>
            )}

            {/* Step 3: Review & Payment */}
            {currentStep === 3 && (
              <div className="animate-in slide-in-from-right duration-300">
                <StepReview
                  packageName={packageData?.name}
                  destination={packageData?.destination || undefined}
                  tripDate={values.tripDate}
                  customerName={values.customerName}
                  customerPhone={values.customerPhone}
                  customerEmail={values.customerEmail}
                  adultPax={values.adultPax}
                  childPax={values.childPax}
                  infantPax={values.infantPax}
                  specialRequests={values.specialRequests}
                  ntaTotal={ntaTotal}
                  publishTotal={publishTotal}
                  commission={margin}
                  paymentMethod={values.paymentMethod}
                  onPaymentMethodChange={(method) =>
                    form.setValue('paymentMethod', method)
                  }
                  onEdit={handleStepChange}
                  onSubmit={() => form.handleSubmit(handleSubmit)()}
                  onBack={handlePrev}
                  submitting={submitting}
                />
              </div>
            )}
          </form>
        </Form>
      </div>

      {/* Floating Collapsible Summary Card - Always visible, positioned above nav bar */}
      {packageData && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 pointer-events-none">
          <div className="mx-auto max-w-md px-4 pointer-events-auto">
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
              <Card className="shadow-[0_-4px_24px_rgba(0,0,0,0.15)] border-primary/20">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        Total Estimasi
                        {summaryOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(ntaTotal)}
                      </span>
                    </div>
                    <Badge variant="default" className="text-xs">
                      {totalPax} Pax
                    </Badge>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-3 pb-3 pt-0 space-y-2 border-t text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paket</span>
                      <span className="font-medium truncate max-w-[180px]">
                        {packageData?.name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal</span>
                      <span className="font-medium">
                        {values.tripDate
                          ? format(values.tripDate, 'd MMM yyyy', { locale: id })
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peserta</span>
                      <span className="font-medium">
                        {values.adultPax} Dewasa
                        {values.childPax && values.childPax > 0
                          ? `, ${values.childPax} Anak`
                          : ''}
                      </span>
                    </div>
                    {margin > 0 && (
                      <div className="flex justify-between text-green-600 font-semibold pt-2 border-t">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Komisi Anda
                        </span>
                        <span>{formatCurrency(margin)}</span>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Enhanced Floating Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrev}
                className="w-12 h-12 shrink-0 active:scale-95 transition-transform"
                disabled={submitting}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
            <Button
              type="button"
              onClick={currentStep === 3 ? () => form.handleSubmit(handleSubmit)() : handleNext}
              disabled={!canProceed || submitting}
              className={cn(
                'flex-1 h-12 font-semibold shadow-lg transition-all active:scale-95',
                currentStep === 3
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-green-500/30'
                  : 'shadow-primary/20'
              )}
            >
              {submitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : currentStep === 3 ? (
                <>
                  <CheckCircle2 className="h-6 w-6 mr-2" />
                  Konfirmasi Booking
                </>
              ) : (
                <>
                  Lanjutkan
                  <ArrowRight className="h-6 w-6 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
