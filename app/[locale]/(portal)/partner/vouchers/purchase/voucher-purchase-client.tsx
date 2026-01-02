/**
 * Voucher Purchase Client Component
 * Form to purchase a gift voucher
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  Check,
  CreditCard,
  Gift,
  Mail,
  MessageSquare,
  Phone,
  User,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const PRESET_AMOUNTS = [100000, 250000, 500000, 1000000, 2500000, 5000000];

const voucherSchema = z.object({
  amount: z.number().min(100000, 'Minimal Rp 100.000'),
  recipientName: z.string().min(2, 'Nama penerima minimal 2 karakter'),
  recipientEmail: z.string().email('Email tidak valid').optional().or(z.literal('')),
  recipientPhone: z.string().min(10, 'Nomor HP tidak valid').optional().or(z.literal('')),
  senderName: z.string().min(2, 'Nama pengirim minimal 2 karakter'),
  message: z.string().max(200, 'Pesan maksimal 200 karakter').optional(),
  deliveryMethod: z.enum(['email', 'whatsapp', 'both']),
}).refine((data) => data.recipientEmail || data.recipientPhone, {
  message: 'Email atau nomor HP harus diisi',
  path: ['recipientEmail'],
});

type VoucherFormData = z.infer<typeof voucherSchema>;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type VoucherPurchaseClientProps = {
  locale: string;
};

export function VoucherPurchaseClient({ locale }: VoucherPurchaseClientProps) {
  const router = useRouter();
  const [customAmount, setCustomAmount] = useState<string>('');

  const form = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      amount: 500000,
      recipientName: '',
      recipientEmail: '',
      recipientPhone: '',
      senderName: '',
      message: '',
      deliveryMethod: 'email',
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: VoucherFormData) => {
      return apiClient.post('/api/partner/vouchers/purchase', data);
    },
    onSuccess: (response: any) => {
      toast.success('Voucher berhasil dibeli!');
      router.push(`/${locale}/partner/vouchers/${response.voucherId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal membeli voucher');
    },
  });

  const selectedAmount = form.watch('amount');

  const handlePresetAmount = (amount: number) => {
    form.setValue('amount', amount);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    const numValue = parseInt(value.replace(/\D/g, '')) || 0;
    form.setValue('amount', numValue);
  };

  const handleSubmit = form.handleSubmit((data) => {
    purchaseMutation.mutate(data);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Beli Gift Voucher"
        description="Berikan hadiah travel voucher untuk customer"
        backHref={`/${locale}/partner/vouchers`}
      />

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4 px-4">
          {/* Amount Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="h-5 w-5 text-primary" />
                Nominal Voucher
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={selectedAmount === amount && !customAmount ? 'default' : 'outline'}
                    className="h-12"
                    onClick={() => handlePresetAmount(amount)}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>

              <div className="relative">
                <Label className="text-xs text-muted-foreground">Nominal Kustom</Label>
                <div className="mt-1 flex items-center">
                  <span className="absolute left-3 text-sm text-muted-foreground">Rp</span>
                  <Input
                    type="text"
                    placeholder="1,000,000"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {form.formState.errors.amount && (
                <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Recipient Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5 text-primary" />
                Penerima
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Penerima</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="john@example.com" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor WhatsApp</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="6281234567890" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>Untuk pengiriman via WhatsApp</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sender & Message */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5 text-primary" />
                Pengirim & Pesan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pengirim</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama Anda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pesan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Selamat ulang tahun! Semoga perjalanan berikutnya menyenangkan."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Maksimal 200 karakter</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Delivery Method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Metode Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="deliveryMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-2"
                      >
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border p-3',
                            field.value === 'email' && 'border-primary bg-primary/5'
                          )}
                        >
                          <RadioGroupItem value="email" />
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>Email</span>
                        </label>
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border p-3',
                            field.value === 'whatsapp' && 'border-primary bg-primary/5'
                          )}
                        >
                          <RadioGroupItem value="whatsapp" />
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>WhatsApp</span>
                        </label>
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border p-3',
                            field.value === 'both' && 'border-primary bg-primary/5'
                          )}
                        >
                          <RadioGroupItem value="both" />
                          <Check className="h-4 w-4 text-muted-foreground" />
                          <span>Email & WhatsApp</span>
                        </label>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Pembayaran</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(selectedAmount)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Akan dipotong dari saldo wallet Anda
              </p>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={purchaseMutation.isPending}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {purchaseMutation.isPending ? 'Memproses...' : 'Bayar & Kirim Voucher'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

