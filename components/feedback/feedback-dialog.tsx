/**
 * Feedback Dialog Component
 * Modal dialog for collecting user feedback
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { feedbackSchema, type FeedbackPayload, useFeedbackSubmit } from '@/lib/feedback/feedback-service';
import { MessageSquare, Bug, Lightbulb, AlertCircle, Heart, Camera } from 'lucide-react';

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
  defaultType?: FeedbackPayload['feedbackType'];
}

const feedbackTypeConfig = {
  bug: {
    icon: Bug,
    label: 'Bug Report',
    description: 'Laporkan masalah teknis atau error',
    color: 'text-red-500',
  },
  feature_request: {
    icon: Lightbulb,
    label: 'Fitur Baru',
    description: 'Usulkan fitur atau improvement',
    color: 'text-yellow-500',
  },
  general: {
    icon: MessageSquare,
    label: 'Umum',
    description: 'Feedback atau saran umum',
    color: 'text-blue-500',
  },
  complaint: {
    icon: AlertCircle,
    label: 'Keluhan',
    description: 'Sampaikan keluhan Anda',
    color: 'text-orange-500',
  },
  praise: {
    icon: Heart,
    label: 'Pujian',
    description: 'Beri apresiasi untuk fitur yang bagus',
    color: 'text-pink-500',
  },
};

export function FeedbackDialog({ trigger, defaultType }: FeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { submit, isSubmitting } = useFeedbackSubmit();

  const form = useForm<FeedbackPayload>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedbackType: defaultType || 'general',
      title: '',
      description: '',
      category: undefined,
      userEmail: '',
      userName: '',
      screenshots: [],
    },
  });

  const selectedType = form.watch('feedbackType');
  const TypeIcon = feedbackTypeConfig[selectedType].icon;

  async function onSubmit(values: FeedbackPayload) {
    const result = await submit(values);
    if (result.success) {
      form.reset();
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Kirim Feedback
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className={`h-5 w-5 ${feedbackTypeConfig[selectedType].color}`} />
            Kirim Feedback
          </DialogTitle>
          <DialogDescription>
            Bantu kami meningkatkan layanan dengan memberikan feedback Anda
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Feedback Type */}
            <FormField
              control={form.control}
              name="feedbackType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Feedback *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe feedback" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(feedbackTypeConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${config.color}`} />
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {config.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori (opsional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ui_ux">UI/UX</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="functionality">Functionality</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ringkasan singkat feedback Anda"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Minimal 5 karakter</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan detail feedback Anda di sini..."
                      rows={6}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Minimal 20 karakter. Semakin detail, semakin baik.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Info (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nama Anda"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Untuk follow-up jika diperlukan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Screenshot Upload Placeholder */}
            <div className="p-4 border border-dashed rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Camera className="h-4 w-4" />
                <span>Screenshot upload (Coming soon)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Fitur upload screenshot akan segera tersedia
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Mengirim...' : 'Kirim Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Quick Feedback Button (Floating or Inline)
 */
interface QuickFeedbackButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

export function QuickFeedbackButton({ className, variant = 'floating' }: QuickFeedbackButtonProps) {
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <FeedbackDialog
          trigger={
            <Button size="lg" className="rounded-full shadow-lg">
              <MessageSquare className="mr-2 h-5 w-5" />
              Feedback
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <FeedbackDialog
      trigger={
        <Button variant="outline" size="sm" className={className}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Kirim Feedback
        </Button>
      }
    />
  );
}

