/**
 * WhatsApp Bot Client Component
 * Bot configuration, templates, and logs
 */

'use client';

import {
  Bot,
  MessageSquare,
  Phone,
  Settings,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type WhatsappBotClientProps = {
  locale: string;
};

// Mock data
const BOT_CONFIG = {
  isEnabled: true,
  autoReply: true,
  workingHours: '08:00 - 22:00',
  provider: 'Fonnte',
};

const TEMPLATES = [
  { id: 1, name: 'Greeting', trigger: 'hi|hello|halo', response: 'Halo! Selamat datang di MyAeroTravel. Ada yang bisa kami bantu?' },
  { id: 2, name: 'Price Inquiry', trigger: 'harga|price|berapa', response: 'Untuk info harga, silakan kunjungi website kami atau hubungi tim sales.' },
  { id: 3, name: 'Booking Status', trigger: 'status|booking', response: 'Untuk cek status booking, mohon informasikan kode booking Anda.' },
];

const RECENT_LOGS = [
  { id: 1, phone: '+628123456789', message: 'Halo, mau tanya harga paket Pahawang', response: 'Auto-reply sent', time: '5 min ago' },
  { id: 2, phone: '+628987654321', message: 'Status booking saya gimana?', response: 'Forwarded to ops', time: '15 min ago' },
  { id: 3, phone: '+628111222333', message: 'Ada paket promo?', response: 'AI response sent', time: '1 hour ago' },
];

export function WhatsappBotClient({ locale }: WhatsappBotClientProps) {
  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Bot className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>WhatsApp Bot Status</CardTitle>
                <CardDescription>Connected via {BOT_CONFIG.provider}</CardDescription>
              </div>
            </div>
            <Badge variant={BOT_CONFIG.isEnabled ? 'default' : 'secondary'}>
              {BOT_CONFIG.isEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>Auto Reply</span>
              </div>
              <Switch checked={BOT_CONFIG.autoReply} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Working Hours</span>
              </div>
              <span className="text-sm font-medium">{BOT_CONFIG.workingHours}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>AI Integration</span>
              </div>
              <Badge variant="outline">Gemini</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Response Templates</CardTitle>
                <Button size="sm">Add Template</Button>
              </div>
              <CardDescription>
                Auto-reply templates based on keyword triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TEMPLATES.map((template) => (
                  <div key={template.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{template.name}</span>
                      <Badge variant="outline">{template.trigger}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.response}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>
                Latest bot interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RECENT_LOGS.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 rounded-lg border p-4">
                    <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.phone}</span>
                        <span className="text-xs text-muted-foreground">{log.time}</span>
                      </div>
                      <p className="text-sm mb-2">{log.message}</p>
                      <Badge variant="secondary">{log.response}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Settings</CardTitle>
              <CardDescription>
                Configure bot behavior and integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Settings configuration coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

