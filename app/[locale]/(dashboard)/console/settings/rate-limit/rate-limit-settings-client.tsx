'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  Database,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Save,
  Shield,
  Sparkles,
  TestTube,
  Zap,
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/glass-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Form schema
const rateLimitSettingsSchema = z.object({
  enabled: z.boolean(),
  redis_url: z.string().optional(),
  redis_token: z.string().optional(),
  default_limit: z.number().min(10).max(1000),
  ai_limit: z.number().min(1).max(500),
  api_limit: z.number().min(10).max(1000),
  auth_limit: z.number().min(1).max(50),
});

type RateLimitSettingsFormData = z.infer<typeof rateLimitSettingsSchema>;

export function RateLimitSettingsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const form = useForm<RateLimitSettingsFormData>({
    resolver: zodResolver(rateLimitSettingsSchema),
    defaultValues: {
      enabled: true,
      redis_url: '',
      redis_token: '',
      default_limit: 100,
      ai_limit: 60,
      api_limit: 200,
      auth_limit: 10,
    },
  });

  const isEnabled = form.watch('enabled');

  const onSubmit = async (data: RateLimitSettingsFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Rate limiting configuration has been updated successfully.');
    } catch {
      toast.error('Failed to save Rate Limit settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/admin/settings/rate-limit/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redis_url: form.getValues('redis_url'),
          redis_token: form.getValues('redis_token'),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Connected to Redis. Latency: ${result.latency || 'N/A'}ms`);
      } else {
        throw new Error(result.message || 'Connection failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not connect to Redis.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Enable/Disable Card */}
          <GlassCard className="p-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <FormLabel className="text-lg font-semibold">Rate Limiting</FormLabel>
                    </div>
                    <FormDescription>
                      Protect APIs from abuse by limiting requests per time window.
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
          </GlassCard>

          {isEnabled && (
            <>
              {/* Redis Connection Card */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Redis Connection</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure Upstash Redis for distributed rate limiting. Get your credentials at{' '}
                  <a
                    href="https://upstash.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    upstash.com
                  </a>
                </p>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="redis_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redis REST URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showUrl ? 'text' : 'password'}
                              placeholder="https://your-redis.upstash.io"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowUrl(!showUrl)}
                            >
                              {showUrl ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upstash Redis REST API URL.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="redis_token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redis REST Token</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type={showToken ? 'text' : 'password'}
                                placeholder="AYXwAS..."
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowToken(!showToken)}
                              >
                                {showToken ? (
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
                              disabled={
                                isTesting ||
                                !form.getValues('redis_url') ||
                                !field.value
                              }
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
                          Token is encrypted before storage. Leave empty to use .env fallback.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </GlassCard>

              {/* Rate Limits Card */}
              <GlassCard className="p-6">
                <h2 className="text-lg font-semibold mb-4">Rate Limits (Requests per Minute)</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure rate limits for different types of API requests.
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Default Limit */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Default API
                      </CardTitle>
                      <CardDescription>General API requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="default_limit"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">{field.value} RPM</Badge>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={10}
                                max={1000}
                                step={10}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* AI Limit */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Endpoints
                      </CardTitle>
                      <CardDescription>Chat, Vision, Speech APIs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="ai_limit"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">{field.value} RPM</Badge>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={1}
                                max={500}
                                step={5}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* API Limit */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Public API
                      </CardTitle>
                      <CardDescription>External API consumers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="api_limit"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">{field.value} RPM</Badge>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={10}
                                max={1000}
                                step={10}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Auth Limit */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Authentication
                      </CardTitle>
                      <CardDescription>Login, Register, Password reset</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="auth_limit"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">{field.value} RPM</Badge>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={1}
                                max={50}
                                step={1}
                              />
                            </FormControl>
                            <FormDescription className="text-xs mt-2">
                              Keep low to prevent brute-force attacks.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </GlassCard>
            </>
          )}

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

