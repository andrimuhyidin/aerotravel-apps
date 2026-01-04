/**
 * Corporate Booking Wizard Client Component
 * Multi-step booking form for corporate employees
 */

'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Loader2,
  MapPin,
  Package,
  Plus,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';

type Passenger = {
  id: string;
  name: string;
  type: 'adult' | 'child' | 'infant';
  dateOfBirth?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  specialRequests?: string;
};

type PackageDetail = {
  id: string;
  name: string;
  destination: string;
  duration: string;
  durationDays: number;
  durationNights: number;
  minPax: number;
  maxPax: number;
  pricePerAdult: number;
  pricePerChild: number;
  includes: string[];
  mainImage: string | null;
};

type BookingWizardClientProps = {
  locale: string;
  initialPackageId?: string;
};

const STEPS = ['Pilih Paket', 'Detail Perjalanan', 'Data Penumpang', 'Konfirmasi'];

export function BookingWizardClient({
  locale,
  initialPackageId,
}: BookingWizardClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialPackageId ? 1 : 0);

  // Form state
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    initialPackageId || null
  );
  const [tripDate, setTripDate] = useState('');
  const [passengers, setPassengers] = useState<Passenger[]>([
    { id: '1', name: '', type: 'adult' },
  ]);
  const [notes, setNotes] = useState('');
  const [requestNotes, setRequestNotes] = useState('');

  // Fetch package details
  const { data: packageDetail, isLoading: packageLoading } =
    useQuery<PackageDetail>({
      queryKey: queryKeys.corporate.packages.detail(selectedPackageId || ''),
      queryFn: async () => {
        const response = await apiClient.get(
          `/api/partner/corporate/packages?search=&limit=50`
        );
        const packages = (response.data as { packages: PackageDetail[] }).packages;
        const pkg = packages.find((p) => p.id === selectedPackageId);
        if (!pkg) throw new Error('Package not found');
        return pkg;
      },
      enabled: !!selectedPackageId,
    });

  // Fetch packages list for step 0
  const { data: packagesData } = useQuery({
    queryKey: queryKeys.corporate.packages.list(),
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/partner/corporate/packages?limit=50`
      );
      return response.data as { packages: PackageDetail[] };
    },
    enabled: currentStep === 0,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        '/api/partner/corporate/bookings',
        {
          packageId: selectedPackageId,
          tripDate,
          passengers: passengers.map((p) => ({
            name: p.name,
            type: p.type,
            dateOfBirth: p.dateOfBirth,
            idNumber: p.idNumber,
            phone: p.phone,
            email: p.email,
            specialRequests: p.specialRequests,
          })),
          notes,
          requestNotes,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Booking berhasil dibuat! Menunggu persetujuan PIC.');
      router.push(`/${locale}/corporate/approvals`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat booking');
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      {
        id: Date.now().toString(),
        name: '',
        type: 'adult',
      },
    ]);
  };

  const removePassenger = (id: string) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((p) => p.id !== id));
    }
  };

  const updatePassenger = (id: string, field: keyof Passenger, value: string) => {
    setPassengers(
      passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const calculateTotal = () => {
    if (!packageDetail) return 0;
    const adults = passengers.filter((p) => p.type === 'adult').length;
    const children = passengers.filter((p) => p.type === 'child').length;
    return (
      adults * packageDetail.pricePerAdult +
      children * packageDetail.pricePerChild
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!selectedPackageId;
      case 1:
        return !!tripDate;
      case 2:
        return (
          passengers.length > 0 &&
          passengers.every((p) => p.name.trim().length >= 2)
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      createBookingMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>
        <h1 className="text-xl font-bold">Booking Baru</h1>
        <p className="text-sm text-muted-foreground">
          Buat permintaan booking perjalanan
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div
            key={step}
            className={`flex items-center ${
              index < STEPS.length - 1 ? 'flex-1' : ''
            }`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm font-medium">{STEPS[currentStep]}</p>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 0: Select Package */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pilih paket perjalanan untuk booking
              </p>
              <div className="grid gap-3">
                {packagesData?.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPackageId === pkg.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => setSelectedPackageId(pkg.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{pkg.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {pkg.destination}
                          <span>•</span>
                          {pkg.duration}
                        </div>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatCurrency(pkg.pricePerAdult)}/pax
                        </p>
                      </div>
                      {selectedPackageId === pkg.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Trip Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {packageLoading ? (
                <Skeleton className="h-40" />
              ) : packageDetail ? (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{packageDetail.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {packageDetail.destination} • {packageDetail.duration}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        {formatCurrency(packageDetail.pricePerAdult)}/pax
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Tanggal Perjalanan *</Label>
                <Input
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label>Catatan Perjalanan (opsional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan khusus untuk perjalanan..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Passengers */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Data penumpang ({passengers.length} orang)
                </p>
                {packageDetail && passengers.length < packageDetail.maxPax && (
                  <Button variant="outline" size="sm" onClick={addPassenger}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {passengers.map((passenger, index) => (
                  <div
                    key={passenger.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Penumpang {index + 1}
                      </p>
                      {passengers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removePassenger(passenger.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Nama Lengkap *</Label>
                        <Input
                          value={passenger.name}
                          onChange={(e) =>
                            updatePassenger(passenger.id, 'name', e.target.value)
                          }
                          placeholder="Nama sesuai KTP"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Tipe</Label>
                        <Select
                          value={passenger.type}
                          onValueChange={(value) =>
                            updatePassenger(
                              passenger.id,
                              'type',
                              value as 'adult' | 'child' | 'infant'
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="adult">Dewasa</SelectItem>
                            <SelectItem value="child">Anak (2-12 th)</SelectItem>
                            <SelectItem value="infant">Bayi (&lt;2 th)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>No. HP</Label>
                        <Input
                          value={passenger.phone || ''}
                          onChange={(e) =>
                            updatePassenger(passenger.id, 'phone', e.target.value)
                          }
                          placeholder="08xxx"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={passenger.email || ''}
                          onChange={(e) =>
                            updatePassenger(passenger.id, 'email', e.target.value)
                          }
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                {/* Package Summary */}
                {packageDetail && (
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{packageDetail.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {packageDetail.destination} • {packageDetail.duration}
                      </p>
                    </div>
                  </div>
                )}

                {/* Trip Date */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {tripDate &&
                        format(new Date(tripDate), 'EEEE, d MMMM yyyy', {
                          locale: idLocale,
                        })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tanggal Perjalanan
                    </p>
                  </div>
                </div>

                {/* Passengers */}
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{passengers.length} Penumpang</p>
                    <p className="text-sm text-muted-foreground">
                      {passengers.filter((p) => p.type === 'adult').length} Dewasa,{' '}
                      {passengers.filter((p) => p.type === 'child').length} Anak,{' '}
                      {passengers.filter((p) => p.type === 'infant').length} Bayi
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Dewasa ({passengers.filter((p) => p.type === 'adult').length}x)
                  </span>
                  <span>
                    {packageDetail &&
                      formatCurrency(
                        packageDetail.pricePerAdult *
                          passengers.filter((p) => p.type === 'adult').length
                      )}
                  </span>
                </div>
                {passengers.filter((p) => p.type === 'child').length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>
                      Anak ({passengers.filter((p) => p.type === 'child').length}x)
                    </span>
                    <span>
                      {packageDetail &&
                        formatCurrency(
                          packageDetail.pricePerChild *
                            passengers.filter((p) => p.type === 'child').length
                        )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Request Notes */}
              <div className="space-y-2">
                <Label>Catatan untuk PIC (opsional)</Label>
                <Textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Alasan atau catatan untuk approval..."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Catatan ini akan dilihat oleh PIC saat melakukan approval
                </p>
              </div>

              {/* Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Perhatian:</strong> Booking ini akan dikirim ke PIC
                  untuk persetujuan. Anda akan mendapat notifikasi setelah
                  booking disetujui atau ditolak.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kembali
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!canProceed() || createBookingMutation.isPending}
          className="flex-1"
        >
          {createBookingMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Memproses...
            </>
          ) : currentStep === STEPS.length - 1 ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Kirim Booking
            </>
          ) : (
            <>
              Lanjut
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

