/**
 * Feedback Form Client
 * Form to create new feedback
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';

const feedbackSchema = z.object({
  feedback_type: z.enum([
    'general',
    'app_improvement',
    'work_environment',
    'compensation',
    'training',
    'safety',
    'suggestion',
  ]),
  rating: z.number().min(1).max(10).optional(),
  title: z.string().min(1, 'Judul wajib diisi').max(200, 'Judul maksimal 200 karakter'),
  message: z
    .string()
    .min(10, 'Pesan minimal 10 karakter')
    .max(5000, 'Pesan maksimal 5000 karakter'),
  is_anonymous: z.boolean().optional().default(false),
});

type FeedbackFormData = z.input<typeof feedbackSchema>;

type FeedbackFormClientProps = {
  locale: string;
};

const feedbackTypes = [
  { value: 'general', label: 'Umum' },
  { value: 'app_improvement', label: 'Perbaikan App' },
  { value: 'work_environment', label: 'Lingkungan Kerja' },
  { value: 'compensation', label: 'Kompensasi' },
  { value: 'training', label: 'Pelatihan' },
  { value: 'safety', label: 'Keselamatan' },
  { value: 'suggestion', label: 'Saran' },
];

export function FeedbackFormClient({ locale }: FeedbackFormClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback_type: 'general',
      is_anonymous: false,
      title: '',
      message: '',
    },
  });

  const createFeedback = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const res = await fetch('/api/guide/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_type: data.feedback_type,
          rating: data.rating,
          title: data.title,
          message: data.message,
          is_anonymous: data.is_anonymous ?? false,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || errorData.details || 'Failed to create feedback';
        throw new Error(errorMessage);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.feedback.all() });
      toast.success('Feedback berhasil dikirim!');
      router.push(`/${locale}/guide/feedback`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengirim feedback');
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    try {
      await createFeedback.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulir Feedback</CardTitle>
        <CardDescription>
          Feedback Anda akan membantu kami meningkatkan layanan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="feedback_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Feedback</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-4"
                    >
                      {feedbackTypes.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={type.value} id={type.value} />
                          <Label htmlFor={type.value} className="cursor-pointer">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (Opsional)</FormLabel>
                  <FormDescription>
                    Berikan rating 1-10 untuk kepuasan Anda
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      placeholder="1-10"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? parseInt(value) : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl>
                    <Input placeholder="Ringkasan feedback Anda" {...field} />
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
                  <FormLabel>Pesan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan feedback Anda secara detail..."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimal 10 karakter, maksimal 5000 karakter
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_anonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Kirim sebagai Anonim</FormLabel>
                    <FormDescription>
                      Feedback Anda akan dikirim tanpa menampilkan identitas
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Feedback'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${locale}/guide/feedback`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Batal
                </Link>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
