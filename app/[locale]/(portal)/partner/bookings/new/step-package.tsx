/**
 * Step 1: Package Selection + Date - REDESIGNED
 * Ultra-compact mobile-native design with trust signals
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package as PackageIcon, MapPin, Calendar, Star, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { PackageSelectorSheet } from './components/package-selector-sheet';
import { DateQuickSelector } from './components/date-quick-selector';
import { TrustSignals } from './components/trust-signals';
import { formatCurrency } from '@/lib/partner/package-utils';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

type PackageData = {
  id: string;
  name: string;
  destination: string | null;
  duration: {
    days: number;
    nights: number;
    label: string;
  };
  thumbnailUrl?: string;
  pricingTiers: Array<{
    minPax: number;
    maxPax: number;
    publishPrice: number;
    ntaPrice: number;
    margin: number;
  }>;
  ratings?: {
    average: number;
    count: number;
  };
  urgency: {
    bookingCountToday: number;
    lastBookedAt?: string;
  };
  availability: {
    status: 'high' | 'medium' | 'low';
    label: string;
  };
};

type StepPackageProps = {
  packageId?: string;
  tripDate?: Date | null;
  onChange: (data: { packageId?: string; tripDate?: Date | null }) => void;
  onNext: () => void;
};

export function StepPackage({ packageId, tripDate, onChange, onNext }: StepPackageProps) {
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Load package data when packageId changes
  useEffect(() => {
    if (packageId) {
      loadPackageData(packageId);
    }
  }, [packageId]);

  const loadPackageData = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/partner/packages/${id}/quick-info`);
      if (!response.ok) throw new Error('Failed to load package');
      
      const data = await response.json();
      setPackageData(data.package);
      logger.info('Package quick info loaded', { packageId: id });
    } catch (error) {
      logger.error('Failed to load package quick info', error, { packageId: id });
      toast.error('Gagal memuat informasi paket');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: PackageData) => {
    setPackageData(pkg);
    onChange({ packageId: pkg.id, tripDate });
    setSheetOpen(false);
  };

  const handleDateChange = (date: Date | null) => {
    onChange({ packageId, tripDate: date });
  };

  const canProceed = packageId && tripDate;

  return (
    <div className="space-y-3">
      {/* Package Selection Card - Ultra Compact */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              1
            </div>
            Pilih Paket Wisata
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {packageData ? (
            <div className="space-y-2">
              {/* Selected Package Display - Compact */}
              <div className="flex gap-2 p-2 border rounded-lg bg-gradient-to-br from-card to-muted/20 active:scale-[0.99] transition-transform">
                {/* Thumbnail */}
                <div className="h-14 w-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {packageData.thumbnailUrl ? (
                    <img
                      src={packageData.thumbnailUrl}
                      alt={packageData.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <PackageIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Package Info - Compact */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs mb-0.5 truncate leading-tight">
                    {packageData.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-1.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      <MapPin className="h-2.5 w-2.5 mr-0.5" />
                      {packageData.destination}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      {packageData.duration.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-primary">
                      Mulai {formatCurrency(packageData.pricingTiers[0]?.ntaPrice || 0)}
                    </p>
                    {packageData.ratings && packageData.ratings.average > 0 && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{packageData.ratings.average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSheetOpen(true)}
                  className="shrink-0 h-7 w-7 active:scale-95 transition-transform"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Trust Signals - Compact */}
              <TrustSignals
                ratings={packageData.ratings}
                bookingCountToday={packageData.urgency.bookingCountToday}
                commission={packageData.pricingTiers[0]?.margin}
              />
            </div>
          ) : (
            <Button
              onClick={() => setSheetOpen(true)}
              variant="outline"
              className="w-full h-16 border-2 border-dashed hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99] transition-all"
              disabled={loading}
            >
              <div className="text-center">
                <PackageIcon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="font-medium text-xs">Pilih Paket Wisata</p>
                <p className="text-[10px] text-muted-foreground">
                  Tap untuk browse katalog
                </p>
              </div>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Date Selection Card - Only show when package is selected */}
      {packageId && (
        <Card className="border-border/50 shadow-sm animate-in slide-in-from-bottom duration-300">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Tanggal Keberangkatan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <DateQuickSelector value={tripDate} onChange={handleDateChange} />
          </CardContent>
        </Card>
      )}

      {/* Package Selector Sheet */}
      <PackageSelectorSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSelect={handlePackageSelect}
        selectedPackageId={packageId}
      />

      {/* Inline Navigation */}
      <div className="flex gap-3 pt-4 border-t">
        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          className="flex-1 h-11 shadow-sm active:scale-95 transition-transform"
        >
          Lanjutkan ke Data Pemesan
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
