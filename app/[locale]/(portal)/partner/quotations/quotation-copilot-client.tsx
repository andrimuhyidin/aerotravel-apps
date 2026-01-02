/**
 * Quotation Copilot Client Component
 * AI-powered quotation generation from natural language
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Calculator,
  Check,
  FileText,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/finance/shadow-pnl';
import { logger } from '@/lib/utils/logger';
import { QuotationRefinementUI } from '@/components/partner/quotation-refinement-ui';
import type { DraftQuotation, QuotationSuggestion } from '@/lib/ai/quotation-copilot';

const EXAMPLE_PROMPTS = [
  '6 pax family, Pahawang 10-12 Des, Rp 2.5jt/pax budget',
  '10 orang, Pisang Island, 15-17 Januari, max 3 juta',
  'Honeymoon 2 pax, romantic package, weekend ini',
  'Grup kantor 20 orang, outbound activity, budget 2jt/pax',
];

export function QuotationCopilotClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quotation, setQuotation] = useState<DraftQuotation | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<QuotationSuggestion | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setQuotation(null);
    setSelectedPackage(null);

    try {
      const response = await fetch('/api/partner/ai/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit tercapai. Silakan tunggu sebentar.');
          return;
        }
        throw new Error('Failed to generate quotation');
      }

      const data = await response.json();
      setQuotation(data.quotation);
      setRemaining(data.remaining);

      if (data.quotation.suggestions.length === 0) {
        toast.warning('Tidak ada paket yang sesuai dengan kriteria Anda');
      } else {
        toast.success(`Ditemukan ${data.quotation.suggestions.length} paket yang cocok!`);
        setSelectedPackage(data.quotation.selectedPackage || null);
      }
    } catch (error) {
      logger.error('Quotation generation error', error);
      toast.error('Gagal generate quotation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setQuotation(null);
    setSelectedPackage(null);
    setShowRefinement(false);
  };

  const handleSelectPackage = (pkg: QuotationSuggestion) => {
    setSelectedPackage(pkg);
  };

  const handleRefined = (refined: DraftQuotation) => {
    setQuotation(refined);
    setSelectedPackage(refined.selectedPackage || null);
    setShowRefinement(false);
    toast.success('Quotation berhasil diperbarui');
  };

  const handleCreateBooking = () => {
    if (selectedPackage) {
      // Navigate to booking creation with pre-filled data
      const params = new URLSearchParams({
        packageId: selectedPackage.packageId,
        paxCount: selectedPackage.paxCount.toString(),
        tripDate: selectedPackage.tripDate,
      });
      router.push(`/partner/bookings/new?${params.toString()}`);
    }
  };

  if (showRefinement && quotation) {
    return (
      <QuotationRefinementUI
        originalQuotation={quotation}
        onRefined={handleRefined}
        onCancel={() => setShowRefinement(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/60">
          <Wand2 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">AI Quotation Copilot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buat quotation dari deskripsi natural language
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Deskripsikan Kebutuhan Customer
          </CardTitle>
          <CardDescription>
            Tulis dalam bahasa natural, seperti berbicara dengan rekan kerja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: 6 pax family, Pahawang 10-12 Des, budget Rp 2.5jt/pax..."
            className="min-h-[100px] resize-none"
            disabled={isLoading}
          />

          {/* Example Prompts */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Contoh:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1 px-2"
                  onClick={() => setPrompt(example)}
                  disabled={isLoading}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Quotation
                </>
              )}
            </Button>
            {quotation && (
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {remaining !== null && (
            <p className="text-xs text-muted-foreground text-center">
              {remaining} request tersisa hari ini
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {quotation && (
        <>
          {/* Package Suggestions */}
          {quotation.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paket yang Cocok</CardTitle>
                <CardDescription>
                  Pilih paket untuk quotation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quotation.suggestions.map((pkg) => (
                  <div
                    key={pkg.packageId}
                    onClick={() => handleSelectPackage(pkg)}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all',
                      selectedPackage?.packageId === pkg.packageId
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{pkg.packageName}</p>
                          <Badge variant="secondary" className="text-xs">
                            {pkg.matchScore}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{pkg.destination}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{pkg.paxCount} pax</span>
                          <span>{pkg.tripDate}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold">{formatCurrency(pkg.pricePerPax)}</p>
                        <p className="text-xs text-muted-foreground">/pax</p>
                        <p className="text-xs text-green-600 mt-1">
                          Margin: {formatCurrency(pkg.margin)}
                        </p>
                      </div>
                    </div>
                    {selectedPackage?.packageId === pkg.packageId && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">{pkg.reasoning}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quotation Preview */}
          {selectedPackage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Draft Quotation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Package Info */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold">{selectedPackage.packageName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPackage.destination}</p>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tanggal</p>
                      <p className="font-medium">{selectedPackage.tripDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jumlah Pax</p>
                      <p className="font-medium">{selectedPackage.paxCount} orang</p>
                    </div>
                  </div>
                </div>

                {/* Itinerary Preview */}
                {quotation.itinerary && quotation.itinerary.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Itinerary</h4>
                    <div className="space-y-2">
                      {quotation.itinerary.slice(0, 3).map((day) => (
                        <div key={day.day} className="text-sm">
                          <p className="font-medium">Day {day.day}</p>
                          {day.activities.slice(0, 2).map((act, idx) => (
                            <p key={idx} className="text-muted-foreground ml-4">
                              {act.time} - {act.activity}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Pricing Breakdown */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Pricing Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({selectedPackage.paxCount} pax × {formatCurrency(selectedPackage.pricePerPax)})</span>
                      <span>{formatCurrency(quotation.pricingBreakdown.subtotal)}</span>
                    </div>
                    {quotation.pricingBreakdown.tax && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PPN 11%</span>
                        <span>{formatCurrency(quotation.pricingBreakdown.tax)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span>{formatCurrency(quotation.pricingBreakdown.total)}</span>
                    </div>
                    {quotation.pricingBreakdown.deposit && (
                      <div className="flex justify-between text-primary">
                        <span>Deposit (50%)</span>
                        <span>{formatCurrency(quotation.pricingBreakdown.deposit)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* T&C */}
                <div>
                  <h4 className="font-medium mb-2">Syarat & Ketentuan</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {quotation.termsAndConditions.map((tc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                        {tc}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRefinement(true)}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Refine
                  </Button>
                  <Button className="flex-1" onClick={handleCreateBooking}>
                    Create Booking
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {quotation.notes && (
            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

