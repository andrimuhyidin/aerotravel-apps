'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  Eye,
  EyeOff,
  Loader2,
  Mic,
  Save,
  Sparkles,
  TestTube,
  Image as ImageIcon,
} from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/glass-card';

// Form schema
const aiSettingsSchema = z.object({
  provider: z.enum(['gemini', 'openai', 'anthropic']),
  model: z.string().min(1, 'Model is required'),
  api_key: z.string().optional(),
  max_tokens: z.number().min(100).max(32000),
  temperature: z.number().min(0).max(2),
  rate_limit_rpm: z.number().min(1).max(1000),
  speech_enabled: z.boolean(),
  speech_api_key: z.string().optional(),
  vision_enabled: z.boolean(),
});

type AISettingsFormData = z.infer<typeof aiSettingsSchema>;

// Model options per provider
const modelOptions: Record<string, { value: string; label: string }[]> = {
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended)' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommended)' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
};

export function AISettingsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSpeechKey, setShowSpeechKey] = useState(false);

  const form = useForm<AISettingsFormData>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      api_key: '',
      max_tokens: 4096,
      temperature: 0.7,
      rate_limit_rpm: 60,
      speech_enabled: false,
      speech_api_key: '',
      vision_enabled: true,
    },
  });

  const selectedProvider = form.watch('provider');

  const onSubmit = async (data: AISettingsFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('AI configuration has been updated successfully.');
    } catch {
      toast.error('Failed to save AI settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/admin/settings/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: form.getValues('provider'),
          api_key: form.getValues('api_key'),
          model: form.getValues('model'),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Connected to ${form.getValues('provider')} API successfully.`);
      } else {
        throw new Error(result.message || 'Connection failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not connect to AI provider.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Provider & Model Card */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Provider</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset model when provider changes
                        const models = modelOptions[value];
                        if (models?.[0]) {
                          form.setValue('model', models[0].value);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gemini">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Google Gemini
                          </div>
                        </SelectItem>
                        <SelectItem value="openai">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            OpenAI
                          </div>
                        </SelectItem>
                        <SelectItem value="anthropic">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            Anthropic
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose your AI provider. Gemini recommended for cost-effectiveness.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelOptions[selectedProvider]?.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the AI model to use.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6" />

            {/* API Key */}
            <FormField
              control={form.control}
              name="api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="Enter your API key"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testConnection}
                        disabled={isTesting || !field.value}
                      >
                        {isTesting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <TestTube className="h-4 w-4 mr-2" />
                        )}
                        Test
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    API key is encrypted before storage. Leave empty to use .env fallback.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </GlassCard>

          {/* Model Parameters Card */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4">Model Parameters</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="max_tokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Max Tokens: <Badge variant="secondary">{field.value}</Badge>
                    </FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        min={100}
                        max={32000}
                        step={100}
                        className="mt-2"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum tokens per response (100 - 32000).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Temperature: <Badge variant="secondary">{field.value.toFixed(1)}</Badge>
                    </FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        min={0}
                        max={2}
                        step={0.1}
                        className="mt-2"
                      />
                    </FormControl>
                    <FormDescription>
                      Lower = more focused, Higher = more creative.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate_limit_rpm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Rate Limit: <Badge variant="secondary">{field.value} RPM</Badge>
                    </FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        min={1}
                        max={1000}
                        step={10}
                        className="mt-2"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum requests per minute.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </GlassCard>

          {/* Features Card */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4">AI Features</h2>

            <div className="space-y-6">
              {/* Vision/OCR */}
              <FormField
                control={form.control}
                name="vision_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        <FormLabel className="text-base">Vision / OCR</FormLabel>
                      </div>
                      <FormDescription>
                        Enable image analysis and OCR for document processing.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Speech-to-Text */}
              <FormField
                control={form.control}
                name="speech_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        <FormLabel className="text-base">Speech-to-Text</FormLabel>
                      </div>
                      <FormDescription>
                        Enable voice input transcription.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('speech_enabled') && (
                <FormField
                  control={form.control}
                  name="speech_api_key"
                  render={({ field }) => (
                    <FormItem className="ml-4 pl-4 border-l">
                      <FormLabel>Speech API Key (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showSpeechKey ? 'text' : 'password'}
                            placeholder="Uses AI API key if empty"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowSpeechKey(!showSpeechKey)}
                          >
                            {showSpeechKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Separate API key for speech services. Leave empty to use main AI key.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </GlassCard>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

