/**
 * Booking Wizard Client Component
 * Handles interactive booking flow
 */

'use client';

import {
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  MapPin,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

const STEPS = [
  { id: 1, label: 'Paket', icon: MapPin },
  { id: 2, label: 'Tanggal', icon: Calendar },
  { id: 3, label: 'Peserta', icon: Users },
  { id: 4, label: 'Bayar', icon: CreditCard },
];

export function BookingWizardClient() {
  const t = useTranslations('booking');
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pb-4 pt-6">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          Ikuti langkah-langkah berikut untuk booking
        </p>
      </div>

      {/* Step Indicator */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                    currentStep >= step.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
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
                  className={`mt-1.5 text-[10px] font-medium ${
                    currentStep >= step.id
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Paket Wisata</h2>
              <p className="text-sm text-muted-foreground">
                Pilih paket wisata yang ingin Anda booking
              </p>
              {/* Package selection will go here */}
              <div className="rounded-xl bg-muted/50 p-8 text-center">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Pilih paket dari halaman Explore
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Tanggal</h2>
              <p className="text-sm text-muted-foreground">
                Pilih tanggal keberangkatan
              </p>
              <div className="rounded-xl bg-muted/50 p-8 text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Kalender akan ditampilkan di sini
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Data Peserta</h2>
              <p className="text-sm text-muted-foreground">
                Masukkan data peserta trip
              </p>
              <div className="rounded-xl bg-muted/50 p-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Form data peserta akan ditampilkan di sini
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pembayaran</h2>
              <p className="text-sm text-muted-foreground">
                Pilih metode pembayaran
              </p>
              <div className="rounded-xl bg-muted/50 p-8 text-center">
                <CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Opsi pembayaran akan ditampilkan di sini
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-5">
        <Button
          className="h-12 w-full gap-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25"
          onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 4))}
          disabled={currentStep === 4}
        >
          {currentStep === 4 ? 'Bayar Sekarang' : 'Lanjutkan'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
