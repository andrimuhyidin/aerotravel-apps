/**
 * Step 1: Package Selection + Date
 * 
 * Features:
 * - Package selector (bottom sheet)
 * - Date quick selector
 * - Trust signals
 * - Real-time pricing preview
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package as PackageIcon, MapPin, Calendar, Star, Users, ChevronRight } from 'lucide-react';
import { PackageSelectorSheet } from './components/package-selector-sheet';
import { DateQuickSelector } from './components/date-quick-selector';
import { TrustSignals } from './components/trust-signals';
import { formatCurrency } from '@/lib/partner/package-utils';

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
      if (response.ok) {
        const data = await response.json();
        setPackageData(data.package);
      }
    } catch (error) {
      console.error('Failed to load package:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: PackageData) => {
    setPackageData(pkg);
    onChange({ packageId: pkg.id, tripDate });
  };

  const handleDateChange = (date: Date | null) => {
    onChange({ packageId, tripDate: date });
  };

  const canProceed = packageId && tripDate;

  return (
    <div className="space-y-3">
      {/* Package Selection Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              1
            </div>
            Pilih Paket Wisata
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {packageData ? (
            <div className="space-y-3">
              {/* Selected Package Display */}
              <div className="flex gap-3 p-3 border rounded-lg bg-gradient-to-br from-card to-card/50">
                {/* Thumbnail */}
                <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {packageData.thumbnailUrl ? (
                    <img
                      src={packageData.thumbnailUrl}
                      alt={packageData.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <PackageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Package Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm mb-1 truncate">{packageData.name}</h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <MapPin className="h-2.5 w-2.5 mr-0.5" />
                      {packageData.destination}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {packageData.duration.label}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-primary">
                    Mulai {formatCurrency(packageData.pricingTiers[0]?.ntaPrice || 0)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSheetOpen(true)}
                  className="shrink-0 h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Trust Signals */}
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
              className="w-full h-20 border-2 border-dashed hover:border-primary/50 hover:bg-primary/5"
              disabled={loading}
            >
              <div className="text-center">
                <PackageIcon className="h-7 w-7 mx-auto mb-1.5 text-muted-foreground" />
                <p className="font-medium text-sm">Pilih Paket Wisata</p>
                <p className="text-xs text-muted-foreground">
                  Tap untuk browse katalog
                </p>
              </div>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Date Selection Card */}
      {packageId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Tanggal Keberangkatan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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

      {/* Next Button */}
      <Button onClick={onNext} disabled={!canProceed} className="w-full h-11 shadow-lg shadow-primary/20" size="lg">
        Lanjutkan ke Data Pemesan
      </Button>
    </div>
  );
}

