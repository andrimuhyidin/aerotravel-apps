'use client';

/**
 * Incident Report Prompt Component
 * Prompt guide to report incident after check-out
 */

import { AlertTriangle, CheckCircle2, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type IncidentReportPromptProps = {
  tripId: string;
  locale?: string;
  onDismiss: () => void;
};

export function IncidentReportPrompt({
  tripId,
  locale = 'id',
  onDismiss,
}: IncidentReportPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
        <div className="flex-1 space-y-2">
          <AlertTitle className="text-amber-900">
            Ada Insiden Selama Trip?
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            <p className="text-sm">
              Jika ada masalah, insiden, atau hal yang perlu dilaporkan selama
              trip, silakan buat laporan sekarang.
            </p>
          </AlertDescription>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              asChild
            >
              <Link href={`/${locale}/guide/incidents?tripId=${tripId}`}>
                <FileText className="mr-2 h-4 w-4" />
                Laporkan Insiden
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300"
              onClick={handleDismiss}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Tidak Ada Masalah
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0 text-amber-600 hover:text-amber-700"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
