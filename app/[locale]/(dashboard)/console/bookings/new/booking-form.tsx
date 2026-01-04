'use client';

import { CalendarIcon, Loader2, Minus, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

type BookingFormProps = {
  locale: string;
};

type Package = {
  id: string;
  name: string;
  destination: string;
  duration_days: number;
  branch_id: string;
  package_prices: { min_pax: number; max_pax: number; price_publish: number }[];
};

export function BookingForm({ locale }: BookingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Form state
  const [selectedPackage, setSelectedPackage] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [adultPax, setAdultPax] = useState(2);
  const [childPax, setChildPax] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Load packages on mount
  useState(() => {
    async function loadPackages() {
      const { data } = await supabase
        .from('packages')
        .select(
          'id, name, destination, duration_days, branch_id, package_prices(min_pax, max_pax, price_publish)'
        )
        .eq('status', 'published');
      setPackages((data as unknown as Package[]) || []);
      setLoadingPackages(false);
    }
    loadPackages();
  });

  const selectedPkg = packages.find((p) => p.id === selectedPackage);
  const totalPax = adultPax + childPax;

  // Calculate price based on tier
  const getPrice = () => {
    if (!selectedPkg) return 0;
    const prices = selectedPkg.package_prices || [];
    const tier = prices.find(
      (p) => totalPax >= p.min_pax && totalPax <= p.max_pax
    );
    return tier?.price_publish || prices[0]?.price_publish || 0;
  };

  const pricePerAdult = getPrice();
  const pricePerChild = Math.round(pricePerAdult * 0.7); // 30% discount for child
  const subtotal = pricePerAdult * adultPax + pricePerChild * childPax;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  const generateBookingCode = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${date}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!selectedPkg) throw new Error('Pilih paket wisata');
      if (!tripDate) throw new Error('Pilih tanggal trip');
      if (!customerName) throw new Error('Nama customer wajib diisi');
      if (!customerPhone) throw new Error('No. telepon wajib diisi');

      const bookingData = {
        branch_id: selectedPkg.branch_id,
        package_id: selectedPkg.id,
        booking_code: generateBookingCode(),
        trip_date: tripDate,
        source: 'admin',
        adult_pax: adultPax,
        child_pax: childPax,
        infant_pax: 0,
        price_per_adult: pricePerAdult,
        price_per_child: pricePerChild,
        subtotal: subtotal,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: subtotal,
        status: 'pending_payment',
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone,
        special_requests: specialRequests || null,
      };

      const { error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData as never);

      if (insertError) throw insertError;

      router.push(`/${locale}/console/bookings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Package Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Pilih Paket</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPackages ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {packages.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                        selectedPackage === pkg.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="package"
                        value={pkg.id}
                        checked={selectedPackage === pkg.id}
                        onChange={(e) => setSelectedPackage(e.target.value)}
                        className="sr-only"
                      />
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.destination} • {pkg.duration_days} hari
                      </p>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trip Date & Pax */}
          <Card>
            <CardHeader>
              <CardTitle>Jadwal & Peserta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tripDate">Tanggal Keberangkatan</Label>
                <div className="relative mt-1">
                  <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="tripDate"
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Dewasa</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdultPax(Math.max(1, adultPax - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-lg font-medium">
                      {adultPax}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdultPax(adultPax + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Anak (2-5 thn)</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setChildPax(Math.max(0, childPax - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-lg font-medium">
                      {childPax}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setChildPax(childPax + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Data Pemesan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Nama Lengkap *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="customerPhone">No. WhatsApp *</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08123456789"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="specialRequests">
                  Catatan / Permintaan Khusus
                </Label>
                <textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Vegetarian, kamar terpisah, dll..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPkg ? (
                <>
                  <div>
                    <p className="font-medium">{selectedPkg.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPkg.destination}
                    </p>
                  </div>

                  {tripDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(tripDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    {adultPax} dewasa
                    {childPax > 0 && `, ${childPax} anak`}
                  </div>

                  <hr />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        Dewasa ({adultPax}x {formatPrice(pricePerAdult)})
                      </span>
                      <span>{formatPrice(pricePerAdult * adultPax)}</span>
                    </div>
                    {childPax > 0 && (
                      <div className="flex justify-between">
                        <span>
                          Anak ({childPax}x {formatPrice(pricePerChild)})
                        </span>
                        <span>{formatPrice(pricePerChild * childPax)}</span>
                      </div>
                    )}
                  </div>

                  <hr />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground">
                  Pilih paket untuk melihat ringkasan
                </p>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !selectedPackage}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Buat Booking'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
