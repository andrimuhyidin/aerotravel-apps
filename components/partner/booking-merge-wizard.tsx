/**
 * Booking Merge Wizard Component
 * Step-by-step wizard untuk merge multiple bookings
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, ArrowRight, Users, Calendar, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { formatCurrency } from '@/lib/partner/package-utils';

type Booking = {
  id: string;
  bookingCode: string;
  packageId: string;
  packageName: string;
  tripDate: string;
  status: string;
  adultPax: number;
  childPax: number;
  infantPax: number;
  totalAmount: number;
};

type BookingMergeWizardProps = {
  open: boolean;
  onClose: () => void;
  onMergeComplete?: (mergedBookingId: string) => void;
};

export function BookingMergeWizard({
  open,
  onClose,
  onMergeComplete,
}: BookingMergeWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [mergeInto, setMergeInto] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    canMerge: boolean;
    reason?: string;
    bookings?: Booking[];
  } | null>(null);
  const [merging, setMerging] = useState(false);

  // Load available bookings
  useEffect(() => {
    if (open) {
      loadAvailableBookings();
    } else {
      // Reset state when closed
      setStep(1);
      setSelectedBookings(new Set());
      setMergeInto(null);
      setValidation(null);
    }
  }, [open]);

  const loadAvailableBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await fetch('/api/partner/bookings?status=draft,pending_payment,confirmed&limit=100');
      if (!response.ok) throw new Error('Failed to load bookings');

      const data = await response.json();
      const bookings = (data.bookings || []).map((b: unknown) => {
        const booking = b as {
          id: string;
          booking_code: string;
          package_id: string;
          package: { name: string } | null;
          trip_date: string;
          status: string;
          adult_pax: number;
          child_pax: number;
          infant_pax: number;
          total_amount: number;
        };
        return {
          id: booking.id,
          bookingCode: booking.booking_code,
          packageId: booking.package_id,
          packageName: booking.package?.name || 'Unknown Package',
          tripDate: booking.trip_date,
          status: booking.status,
          adultPax: booking.adult_pax,
          childPax: booking.child_pax,
          infantPax: booking.infant_pax,
          totalAmount: Number(booking.total_amount),
        };
      });

      setAvailableBookings(bookings);
    } catch (error) {
      logger.error('Failed to load bookings for merge', error);
      toast.error('Gagal memuat bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleBookingToggle = (bookingId: string) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
      if (mergeInto === bookingId) {
        setMergeInto(null);
      }
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const handleValidateMerge = async () => {
    if (selectedBookings.size < 2) {
      toast.error('Pilih minimal 2 bookings untuk merge');
      return;
    }

    setLoading(true);
    try {
      const bookingIds = Array.from(selectedBookings);
      const response = await fetch(
        `/api/partner/bookings/merge?bookingIds=${bookingIds.join(',')}`
      );

      if (!response.ok) throw new Error('Failed to validate');

      const data = await response.json();
      setValidation(data);

      if (data.canMerge && data.bookings) {
        // Set first booking as merge target by default
        if (!mergeInto) {
          setMergeInto(data.bookings[0]!.id);
        }
        setStep(2);
      } else {
        toast.error(data.reason || 'Bookings tidak bisa di-merge');
      }
    } catch (error) {
      logger.error('Failed to validate merge', error);
      toast.error('Gagal validasi merge');
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!mergeInto || selectedBookings.size < 2) {
      toast.error('Pilih booking target merge');
      return;
    }

    setMerging(true);
    try {
      const bookingIds = Array.from(selectedBookings);
      const response = await fetch('/api/partner/bookings/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingIds,
          mergeInto,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to merge');
      }

      const data = await response.json();
      toast.success(data.message || 'Bookings berhasil di-merge');
      
      if (onMergeComplete) {
        onMergeComplete(data.mergedBookingId);
      }
      
      onClose();
    } catch (error) {
      logger.error('Failed to merge bookings', error);
      toast.error(error instanceof Error ? error.message : 'Gagal merge bookings');
    } finally {
      setMerging(false);
    }
  };

  const selectedBookingsList = Array.from(selectedBookings)
    .map((id) => availableBookings.find((b) => b.id === id))
    .filter(Boolean) as Booking[];

  const mergedTotals = selectedBookingsList.reduce(
    (acc, b) => ({
      adultPax: acc.adultPax + b.adultPax,
      childPax: acc.childPax + b.childPax,
      infantPax: acc.infantPax + b.infantPax,
      totalAmount: acc.totalAmount + b.totalAmount,
    }),
    { adultPax: 0, childPax: 0, infantPax: 0, totalAmount: 0 }
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge Bookings</DialogTitle>
          <DialogDescription>
            Gabungkan beberapa bookings menjadi satu booking
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pilih minimal 2 bookings dengan package dan tanggal trip yang sama
            </p>

            {loadingBookings ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Tidak ada bookings yang bisa di-merge
                  </p>
                ) : (
                  availableBookings.map((booking) => (
                    <Card
                      key={booking.id}
                      className={`cursor-pointer transition-colors ${
                        selectedBookings.has(booking.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleBookingToggle(booking.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedBookings.has(booking.id)}
                            onCheckedChange={() => handleBookingToggle(booking.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{booking.bookingCode}</span>
                              <Badge variant="outline">{booking.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {booking.packageName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(booking.tripDate).toLocaleDateString('id-ID')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {booking.adultPax + booking.childPax + booking.infantPax} pax
                              </div>
                              <div>{formatCurrency(booking.totalAmount)}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {selectedBookings.size > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">
                    Selected: {selectedBookings.size} bookings
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Total: {mergedTotals.adultPax + mergedTotals.childPax + mergedTotals.infantPax} pax
                    {' • '}
                    {formatCurrency(mergedTotals.totalAmount)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 2 && validation && validation.bookings && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Bookings bisa di-merge</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Pilih booking target merge:</p>
              {validation.bookings.map((booking) => (
                <Card
                  key={booking.id}
                  className={`cursor-pointer transition-colors ${
                    mergeInto === booking.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setMergeInto(booking.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={mergeInto === booking.id}
                        onChange={() => setMergeInto(booking.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{booking.bookingCode}</span>
                          {mergeInto === booking.id && (
                            <Badge>Target Merge</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.adultPax + booking.childPax + booking.infantPax} pax
                          {' • '}
                          {formatCurrency(booking.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm">Merged Booking Preview</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div>
                  <strong>Total Pax:</strong> {mergedTotals.adultPax + mergedTotals.childPax + mergedTotals.infantPax} (
                  {mergedTotals.adultPax} dewasa, {mergedTotals.childPax} anak, {mergedTotals.infantPax} bayi)
                </div>
                <div>
                  <strong>Total Amount:</strong> {formatCurrency(mergedTotals.totalAmount)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Bookings lain akan di-mark sebagai merged dan tidak akan muncul di list
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleValidateMerge}
                disabled={selectedBookings.size < 2 || loading}
              >
                {loading ? 'Validating...' : 'Validate & Continue'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleMerge}
                disabled={!mergeInto || merging}
              >
                {merging ? 'Merging...' : 'Confirm Merge'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

