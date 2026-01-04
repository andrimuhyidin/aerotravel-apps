/**
 * Influencer / KOL Application Page
 * Uses generic /api/user/roles/apply endpoint with role = 'kol'
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { toast } from 'sonner';

type PageProps = {
  params: { locale: string };
};

const influencerApplicationSchema = z.object({
  platform: z.string().min(2, 'Platform wajib diisi (Instagram, TikTok, dll)'),
  handle: z
    .string()
    .min(2, 'Username wajib diisi')
    .max(100, 'Username terlalu panjang'),
  followers: z
    .string()
    .regex(/^[0-9]+$/, 'Isi dengan angka saja')
    .optional()
    .or(z.literal('')),
  niche: z
    .string()
    .min(3, 'Niche / fokus konten wajib diisi')
    .max(160, 'Maksimal 160 karakter'),
  portfolioUrl: z
    .string()
    .url('Link portofolio tidak valid')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .min(10, 'Ceritakan sedikit tentang diri dan rencana kolaborasi')
    .max(1000, 'Maksimal 1000 karakter'),
});

type InfluencerApplicationPayload = z.infer<typeof influencerApplicationSchema>;

export default function InfluencerApplyPage({ params }: PageProps) {
  const { locale } = params;
  const router = useRouter();

  const form = useForm<InfluencerApplicationPayload>({
    resolver: zodResolver(influencerApplicationSchema),
    defaultValues: {
      platform: '',
      handle: '',
      followers: '',
      niche: '',
      portfolioUrl: '',
      message: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: InfluencerApplicationPayload) {
    try {
      const followersNumber = values.followers
        ? Number.parseInt(values.followers, 10)
        : undefined;

      const details = [
        `Platform: ${values.platform}`,
        `Handle: ${values.handle}`,
        followersNumber ? `Followers: ${followersNumber}` : null,
        `Niche: ${values.niche}`,
        values.portfolioUrl ? `Portfolio: ${values.portfolioUrl}` : null,
        '',
        `Note: ${values.message}`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await fetch('/api/user/roles/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'kol',
          message: details,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || 'Gagal mengirim pengajuan');
      }

      toast.success('Pengajuan program Influencer Trip berhasil dikirim');
      router.push(`/${locale}/influencer`);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Terjadi kesalahan, coba lagi');
    }
  }

  return (
    <div className="flex min-h-[100vh] flex-col bg-background">
      <main className="flex-1 pb-8">
        <Section spacing="lg">
          <Container>
            <div className="mb-4 text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Form Pendaftaran Influencer Trip
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Isi data di bawah ini. Tim Aero akan melakukan kurasi dan
                menghubungi kamu jika sesuai dengan kebutuhan campaign.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform Utama</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Instagram, TikTok, YouTube"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username / Handle</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="@namaakun"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Followers (perkiraan)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: 25000"
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niche / Fokus Konten</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Travel keluarga, diving, lifestyle, dll"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="portfolioUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link Portofolio (Opsional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: linktr.ee/nama, deck Notion, atau campaign sebelumnya"
                          {...field}
                        />
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
                      <FormLabel>
                        Ceritakan singkat tentang diri & rencana kolaborasi
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder="Contoh: Saya fokus membuat konten trip laut, biasanya membawa 15-20 orang setiap trip, dan ingin membuat series Influencer Trip bersama Aero."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Mengirim pengajuan...' : 'Kirim Pengajuan'}
                </Button>
              </form>
            </Form>
          </Container>
        </Section>
      </main>
    </div>
  );
}


