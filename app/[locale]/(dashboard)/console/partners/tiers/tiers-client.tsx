/**
 * Partner Tiers Management Client Component
 * Admin interface for viewing and managing partner tiers
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Calculator,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Partner = {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  partner_tier: string | null;
  tier_auto_calculated: boolean | null;
  tier_assigned_at: string | null;
};

type TierCalculation = {
  tier: string;
  reason: string;
  bookingCount: number;
  totalRevenue: number;
  nextTier?: string;
  progressToNextTier?: number;
};

async function fetchPartners() {
  const response = await fetch('/api/admin/partners');
  if (!response.ok) {
    throw new Error('Failed to fetch partners');
  }
  return response.json() as Promise<{ partners: Partner[] }>;
}

async function fetchTierDetails(partnerId: string) {
  const response = await fetch(`/api/admin/partners/${partnerId}/tier`);
  if (!response.ok) {
    throw new Error('Failed to fetch tier details');
  }
  return response.json() as Promise<{
    currentTier: string;
    calculatedTier: string;
    isAutoCalculated: boolean;
    calculation: TierCalculation;
  }>;
}

async function overrideTier(
  partnerId: string,
  tier: string,
  reason?: string
) {
  const response = await fetch(`/api/admin/partners/${partnerId}/tier`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, reason }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to override tier');
  }
  return response.json();
}

async function recalculateTier(partnerId: string) {
  const response = await fetch(`/api/admin/partners/${partnerId}/tier`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to recalculate tier');
  }
  return response.json();
}

type TiersClientProps = {
  locale: string;
};

export function TiersClient({ locale: _locale }: TiersClientProps) {
  const queryClient = useQueryClient();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideTierValue, setOverrideTierValue] = useState<string>('bronze');
  const [overrideReason, setOverrideReason] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'partners', 'tiers'],
    queryFn: fetchPartners,
  });

  const { data: tierDetails, isLoading: tierDetailsLoading } = useQuery({
    queryKey: ['admin', 'partners', 'tier', selectedPartner?.id],
    queryFn: () => fetchTierDetails(selectedPartner!.id),
    enabled: !!selectedPartner && showTierDialog,
  });

  const overrideMutation = useMutation({
    mutationFn: ({ partnerId, tier, reason }: { partnerId: string; tier: string; reason?: string }) =>
      overrideTier(partnerId, tier, reason),
    onSuccess: () => {
      toast.success('Tier overridden successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      setShowOverrideDialog(false);
      setSelectedPartner(null);
      setOverrideReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: (partnerId: string) => recalculateTier(partnerId),
    onSuccess: () => {
      toast.success('Tier recalculated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      if (selectedPartner) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'partners', 'tier', selectedPartner.id],
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const partners = data?.partners || [];

  const handleViewTier = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowTierDialog(true);
  };

  const handleOverride = (partner: Partner) => {
    setSelectedPartner(partner);
    setOverrideTierValue(partner.partner_tier || 'bronze');
    setShowOverrideDialog(true);
  };

  const handleRecalculate = (partnerId: string) => {
    recalculateMutation.mutate(partnerId);
  };

  const confirmOverride = () => {
    if (!selectedPartner) return;
    overrideMutation.mutate({
      partnerId: selectedPartner.id,
      tier: overrideTierValue,
      reason: overrideReason || undefined,
    });
  };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'bronze':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Partner Tier Management</h1>
        <p className="text-muted-foreground">
          View and manage partner tiers, override tiers, and recalculate
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load partners</p>
        </div>
      )}

      {!isLoading && !error && partners.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No partners found</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && partners.length > 0 && (
        <div className="space-y-4">
          {partners.map((partner) => (
            <Card key={partner.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {partner.company_name || partner.full_name}
                      <Badge className={getTierColor(partner.partner_tier)}>
                        {partner.partner_tier?.toUpperCase() || 'BRONZE'}
                      </Badge>
                      {partner.tier_auto_calculated ? (
                        <Badge variant="outline">Auto</Badge>
                      ) : (
                        <Badge variant="outline">Manual</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {partner.email} • {partner.full_name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewTier(partner)}
                    >
                      <Award className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRecalculate(partner.id)}
                      disabled={recalculateMutation.isPending}
                    >
                      {recalculateMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Recalculate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOverride(partner)}
                    >
                      Override
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Tier Details Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tier Details</DialogTitle>
            <DialogDescription>
              View tier calculation details for{' '}
              {selectedPartner?.company_name || selectedPartner?.full_name}
            </DialogDescription>
          </DialogHeader>

          {tierDetailsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!tierDetailsLoading && tierDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Current Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      className={`${getTierColor(tierDetails.currentTier)} text-lg`}
                    >
                      {tierDetails.currentTier.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {tierDetails.isAutoCalculated ? 'Auto-calculated' : 'Manually assigned'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Calculated Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      className={`${getTierColor(tierDetails.calculatedTier)} text-lg`}
                    >
                      {tierDetails.calculatedTier.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Calculation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Reason</Label>
                    <p className="font-medium">{tierDetails.calculation.reason}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Booking Count</Label>
                      <p className="font-medium">{tierDetails.calculation.bookingCount}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Revenue</Label>
                      <p className="font-medium">
                        Rp {tierDetails.calculation.totalRevenue.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  {tierDetails.calculation.nextTier && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Progress to Next Tier</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${tierDetails.calculation.progressToNextTier || 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {tierDetails.calculation.progressToNextTier?.toFixed(0) || 0}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Next tier: {tierDetails.calculation.nextTier.toUpperCase()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTierDialog(false)}>
              Close
            </Button>
            {selectedPartner && (
              <Button
                onClick={() => {
                  setShowTierDialog(false);
                  handleOverride(selectedPartner);
                }}
              >
                Override Tier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Tier Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Partner Tier</DialogTitle>
            <DialogDescription>
              Manually set tier for{' '}
              {selectedPartner?.company_name || selectedPartner?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tier</Label>
              <Select value={overrideTierValue} onValueChange={setOverrideTierValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for manual override..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOverrideDialog(false);
                setOverrideReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmOverride}
              disabled={overrideMutation.isPending}
            >
              {overrideMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Overriding...
                </>
              ) : (
                'Override Tier'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

