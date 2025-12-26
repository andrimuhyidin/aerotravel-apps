/**
 * Booking Flow Client - Main Orchestrator
 * 
 * 3-Step Flow:
 * 1. Package Selection + Date
 * 2. Customer Details + Pax Count
 * 3. Review + Payment
 * 
 * Features:
 * - Auto-save draft
 * - Analytics tracking
 * - Draft recovery
 * - Real-time pricing
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingDraft } from '@/hooks/use-booking-draft';
import { useBookingAnalytics } from '@/hooks/use-booking-analytics';
import { usePartnerAuth } from '@/hooks/use-partner-auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { StepPackage } from './step-package';
import { StepCustomer } from './step-customer';
import { StepReview } from './step-review';
import { PricingSummarySticky } from './components/pricing-summary-sticky';

const STEP_LABELS = ['Pilih Paket & Tanggal', 'Data Pemesan', 'Review & Bayar'];

type FormData = {
  // Step 1
  packageId?: string;
  packageName?: string;
  destination?: string;
  tripDate?: Date | null;
  
  // Step 2
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  adultPax?: number;
  childPax?: number;
  infantPax?: number;
  specialRequests?: string;
  
  // Step 3
  paymentMethod?: 'wallet' | 'external';
  
  // Pricing
  ntaTotal?: number;
  publishTotal?: number;
  commission?: number;
};

type BookingFlowClientProps = {
  locale: string;
  preselectedPackageId?: string;
};

export function BookingFlowClient({
  locale,
  preselectedPackageId,
}: BookingFlowClientProps) {
  const router = useRouter();
  const { partnerId } = usePartnerAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    packageId: preselectedPackageId,
    adultPax: 2,
    childPax: 0,
    infantPax: 0,
    paymentMethod: 'wallet',
    ntaTotal: 0,
    publishTotal: 0,
    commission: 0,
  });

  const { saveDraft, draft, hasDraft, clearDraft } = useBookingDraft();
  const { trackStart, trackStepCompleted, trackCompleted, trackAbandoned } = useBookingAnalytics();

  const startTime = usePerformance();

  // Track start on mount
  useEffect(() => {
    trackStart();
  }, [trackStart]);

  // Auto-save draft whenever formData changes
  useEffect(() => {
    if (formData.packageId) {
      saveDraft({
        ...formData,
        draftId: draft?.draftId,
        formData: formData,
      });
    }
  }, [formData, draft?.draftId, saveDraft]);

  // Track step changes
  useEffect(() => {
    trackStepCompleted(STEP_LABELS[currentStep - 1] || '', { step: currentStep });
  }, [currentStep, trackStepCompleted]);

  // Fetch package data when packageId changes
  const fetchPackageData = async (packageId: string) => {
    try {
      const response = await fetch(`/api/partner/packages/${packageId}/quick-info`);
      if (response.ok) {
        const data = await response.json();
        const pkg = data.package;
        
        // Update formData with package details
        setFormData(prev => ({
          ...prev,
          packageName: pkg.name,
          destination: pkg.destination,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch package data:', error);
    }
  };

  // Calculate pricing when relevant fields change
  useEffect(() => {
    if (formData.packageId && formData.adultPax) {
      calculatePricing();
    }
  }, [formData.packageId, formData.adultPax, formData.childPax, formData.infantPax]);

  const calculatePricing = async () => {
    if (!formData.packageId) return;

    try {
      // Fetch package pricing data
      const response = await fetch(`/api/partner/packages/${formData.packageId}/quick-info`);
      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }

      const data = await response.json();
      const pkg = data.package;
      const totalPax = (formData.adultPax || 0) + (formData.childPax || 0);

      // Find appropriate pricing tier based on total pax
      const pricingTier = pkg.pricingTiers?.find((tier: any) => {
        return totalPax >= tier.minPax && totalPax <= tier.maxPax;
      }) || pkg.pricingTiers?.[0];

      if (!pricingTier) {
        console.warn('No pricing tier found for pax count:', totalPax);
        return;
      }

      // Calculate totals
      // Adult + Child pay full price, infants are free (typically)
      const ntaPerPax = pricingTier.ntaPrice;
      const publishPerPax = pricingTier.publishPrice;

      const adultTotal = (formData.adultPax || 0) * ntaPerPax;
      const childTotal = (formData.childPax || 0) * ntaPerPax; // Children pay full price in most packages
      const infantTotal = 0; // Infants typically free

      const ntaTotal = adultTotal + childTotal + infantTotal;
      const publishTotal = (formData.adultPax || 0) * publishPerPax + (formData.childPax || 0) * publishPerPax;
      const commission = publishTotal - ntaTotal;

      setFormData(prev => ({
        ...prev,
        ntaTotal,
        publishTotal,
        commission,
      }));
    } catch (error) {
      console.error('Failed to calculate pricing:', error);
      // Keep existing prices or set to 0
    }
  };

  const handleStepDataChange = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    
    // If package changed, fetch fresh pricing data
    if (data.packageId && data.packageId !== formData.packageId) {
      fetchPackageData(data.packageId);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGoToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    if (!partnerId || !formData.packageId || !formData.tripDate) {
      toast.error('Data tidak lengkap');
      return;
    }

    setSubmitting(true);

    try {
      const timeToComplete = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch('/api/partner/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          packageId: formData.packageId,
          tripDate: formData.tripDate.toISOString(),
          adultPax: formData.adultPax || 2,
          childPax: formData.childPax || 0,
          infantPax: formData.infantPax || 0,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || '',
          specialRequests: formData.specialRequests || '',
          paymentMethod: formData.paymentMethod || 'wallet',
          // Tracking fields
          draftId: draft?.draftId,
          conversionSource: preselectedPackageId ? 'package_detail' : draft?.draftId ? 'draft_resume' : 'fast_booking',
          timeToComplete,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const data = await response.json();
      const bookingId = data.booking?.id || data.id || 'temp-id';

      // Track completion
      trackCompleted(bookingId, draft?.draftId);

      // Clear draft
      clearDraft();

      toast.success('Booking berhasil dibuat!');

      // Redirect to success page
      router.push(`/${locale}/partner/bookings/success/${bookingId}`);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Gagal membuat booking. Silakan coba lagi.');
      trackAbandoned('review', 'submission_error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-muted/30 pb-32">
      {/* Ultra-Compact Header with Integrated Progress */}
      <div className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="px-4 py-2 border-b border-border/30">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/partner/bookings`}
              className="p-1 -ml-1 hover:bg-muted rounded-full shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold leading-tight">Buat Booking</h1>
              <p className="text-[10px] text-muted-foreground">
                Step {currentStep}/3 • {STEP_LABELS[currentStep - 1]}
              </p>
            </div>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  step <= currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="px-4 py-4 space-y-4">
        {currentStep === 1 && (
          <StepPackage
            packageId={formData.packageId}
            tripDate={formData.tripDate}
            onChange={handleStepDataChange}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <StepCustomer
            customerName={formData.customerName}
            customerPhone={formData.customerPhone}
            customerEmail={formData.customerEmail}
            adultPax={formData.adultPax}
            childPax={formData.childPax}
            infantPax={formData.infantPax}
            specialRequests={formData.specialRequests}
            onChange={handleStepDataChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <StepReview
            packageName={formData.packageName}
            destination={formData.destination}
            tripDate={formData.tripDate}
            customerName={formData.customerName}
            customerPhone={formData.customerPhone}
            customerEmail={formData.customerEmail}
            adultPax={formData.adultPax}
            childPax={formData.childPax}
            infantPax={formData.infantPax}
            specialRequests={formData.specialRequests}
            ntaTotal={formData.ntaTotal || 0}
            publishTotal={formData.publishTotal || 0}
            commission={formData.commission || 0}
            paymentMethod={formData.paymentMethod}
            onPaymentMethodChange={(method) => handleStepDataChange({ paymentMethod: method })}
            onEdit={handleGoToStep}
            onSubmit={handleSubmit}
            onBack={handleBack}
            submitting={submitting}
          />
        )}
      </div>

      {/* Draft Recovery Prompt */}
      {hasDraft() && currentStep === 1 && draft && !formData.packageId && (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-40 animate-in slide-in-from-bottom">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Lanjutkan booking sebelumnya?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (draft.formData) {
                  setFormData(draft.formData as FormData);
                  toast.success('Draft berhasil dimuat!');
                }
              }}
              className="flex-1"
            >
              Lanjutkan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearDraft}
              className="flex-1"
            >
              Buang
            </Button>
          </div>
        </div>
      )}

      {/* Sticky Pricing Summary (Only show when price > 0) */}
      {formData.ntaTotal && formData.ntaTotal > 0 && formData.publishTotal && formData.publishTotal > 0 && (
        <PricingSummarySticky
          ntaTotal={formData.ntaTotal}
          commission={formData.commission || 0}
          totalAmount={formData.publishTotal}
          paymentMethod={formData.paymentMethod || 'wallet'}
          onPaymentMethodChange={(method) => handleStepDataChange({ paymentMethod: method })}
          showBreakdown={currentStep === 3}
        />
      )}
    </div>
  );
}

// Helper hook for performance tracking
function usePerformance() {
  const [startTime] = useState(Date.now());
  return startTime;
}

