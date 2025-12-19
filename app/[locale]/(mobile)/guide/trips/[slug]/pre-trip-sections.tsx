'use client';

/**
 * Pre-Trip Sections
 * Helper components untuk section-section di tab Persiapan
 */

import { AlertTriangle, Package, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RiskAssessmentDialog } from './risk-assessment-dialog';

type PreTripSectionsProps = {
  tripId: string;
  locale: string;
  isLeadGuide: boolean;
};

/**
 * Equipment Checklist Section Card
 * Link ke equipment checklist page
 */
export function EquipmentChecklistSection({ tripId, locale }: { tripId: string; locale: string }) {
  return (
    <Card className="border-0 shadow-sm border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">Equipment Checklist</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Pastikan semua peralatan lengkap dan dalam kondisi baik sebelum trip
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-9 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
            asChild
          >
            <Link href={`/${locale}/guide/trips/${tripId}/equipment`}>
              Buka
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Risk Assessment Section Card
 * Trigger dialog untuk risk assessment
 */
export function RiskAssessmentSection({ tripId, locale: _locale, isLeadGuide }: PreTripSectionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isLeadGuide) {
    return null; // Only Lead Guide can do risk assessment
  }

  return (
    <>
      <Card className="border-0 shadow-sm border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">Pre-Trip Risk Assessment</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Evaluasi risiko sebelum memulai trip. Wajib untuk memulai trip
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 h-9 text-xs border-amber-200 text-amber-700 hover:bg-amber-100"
              onClick={() => setDialogOpen(true)}
            >
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
              Buka
            </Button>
          </div>
        </CardContent>
      </Card>

      <RiskAssessmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onComplete={(canStart) => {
          setDialogOpen(false);
          // onComplete dari RiskAssessmentDialog sudah handle start trip logic
          // canStart indicates if trip can be started (risk level low/medium)
          // Dialog akan trigger start trip jika canStart = true
        }}
        tripId={tripId}
      />
    </>
  );
}
