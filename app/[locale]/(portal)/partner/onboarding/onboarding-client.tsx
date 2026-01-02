/**
 * Partner Onboarding Client Component
 * Multi-step onboarding flow for new partners
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import {
  ArrowRight,
  Check,
  Loader2,
  Package,
  Settings,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Selamat Datang',
    description: 'Setup awal untuk memulai menggunakan Partner Portal',
    icon: Check,
  },
  {
    id: 2,
    title: 'Setup Whitelabel',
    description: 'Kustomisasi branding invoice Anda (opsional)',
    icon: Settings,
  },
  {
    id: 3,
    title: 'Top-up Wallet',
    description: 'Isi saldo wallet untuk melakukan booking',
    icon: Wallet,
  },
  {
    id: 4,
    title: 'Buat Booking Pertama',
    description: 'Pelajari cara membuat booking untuk customer',
    icon: Package,
  },
];

export function OnboardingClient({ locale }: { locale: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [hasWhitelabel, setHasWhitelabel] = useState(false);
  const [hasBookings, setHasBookings] = useState(false);

  useEffect(() => {
    checkProgress();
  }, []);

  const checkProgress = async () => {
    try {
      setLoading(true);

      // Check wallet balance
      const balanceRes = await fetch('/api/partner/wallet/balance');
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setWalletBalance(balanceData.balance || 0);
      }

      // Check whitelabel settings
      const whitelabelRes = await fetch('/api/partner/whitelabel');
      if (whitelabelRes.ok) {
        const whitelabelData = await whitelabelRes.json();
        setHasWhitelabel(
          !!(whitelabelData.companyName || whitelabelData.companyLogoUrl)
        );
      }

      // Check bookings
      const bookingsRes = await fetch('/api/partner/bookings?limit=1');
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setHasBookings((bookingsData.bookings?.length || 0) > 0);
      }

      // Determine current step
      if (hasBookings) {
        setCurrentStep(4); // Completed
      } else if (walletBalance !== null && walletBalance >= 1000000) {
        setCurrentStep(4); // Ready for first booking
      } else if (hasWhitelabel) {
        setCurrentStep(3); // Need to top-up
      } else {
        setCurrentStep(2); // Need whitelabel setup
      }
    } catch (error) {
      logger.error('Failed to check onboarding progress', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    router.push(`/${locale}/partner/dashboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentStepData = ONBOARDING_STEPS[currentStep - 1]!;

  return (
    <div className="space-y-6 py-6 px-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Selamat Datang di Partner Portal!</h1>
        <p className="text-muted-foreground">
          Ikuti langkah-langkah berikut untuk memulai
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {ONBOARDING_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                      currentStep >= step.id
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      currentStep >= step.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p>
                Selamat datang di Partner Portal AeroTravel! Platform ini
                memungkinkan Anda untuk:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Browse paket wisata dengan harga NTA</li>
                <li>Membuat booking untuk customer Anda</li>
                <li>Mengelola wallet dan deposit</li>
                <li>Generate invoice dengan branding Anda</li>
                <li>Melacak komisi dan kinerja</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Mari kita mulai dengan setup awal!
              </p>
            </div>
          )}

          {/* Step 2: Whitelabel Setup */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p>
                Kustomisasi branding invoice Anda dengan logo dan informasi
                perusahaan. Ini akan membuat invoice terlihat profesional dengan
                identitas brand Anda.
              </p>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push(`/${locale}/partner/whitelabel`)}
                >
                  Setup Whitelabel
                </Button>
                <Button variant="outline" onClick={handleSkip}>
                  Lewati (Bisa setup nanti)
                </Button>
              </div>
              {hasWhitelabel && (
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                  ✅ Whitelabel sudah di-setup!
                </div>
              )}
            </div>
          )}

          {/* Step 3: Wallet Top-up */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p>
                Untuk melakukan booking, Anda perlu memiliki saldo di wallet.
                Minimum top-up adalah Rp 1.000.000.
              </p>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Saldo Wallet Saat Ini:
                </div>
                <div className="text-2xl font-bold">
                  {walletBalance !== null
                    ? formatCurrency(walletBalance)
                    : 'Rp 0'}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push(`/${locale}/partner/wallet`)}
                >
                  Top-up Wallet
                </Button>
                <Button variant="outline" onClick={handleSkip}>
                  Lewati (Bisa top-up nanti)
                </Button>
              </div>
              {walletBalance !== null && walletBalance >= 1000000 && (
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                  ✅ Wallet sudah memiliki saldo cukup!
                </div>
              )}
            </div>
          )}

          {/* Step 4: First Booking */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p>
                Sekarang Anda siap untuk membuat booking pertama! Pelajari cara
                membuat booking dengan mengikuti wizard berikut.
              </p>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() =>
                    router.push(`/${locale}/partner/packages`)
                  }
                >
                  Browse Paket
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/${locale}/partner/bookings/new`)
                  }
                >
                  Buat Booking Langsung
                </Button>
              </div>
              {hasBookings && (
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                  ✅ Anda sudah membuat booking pertama!
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Sebelumnya
          </Button>
        )}
        <div className="flex-1" />
        {currentStep < 4 ? (
          <Button onClick={handleNext}>
            Lanjutkan
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleComplete} size="lg">
            Selesai & Ke Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

