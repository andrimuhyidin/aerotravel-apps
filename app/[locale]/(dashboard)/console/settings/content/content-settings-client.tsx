/**
 * Content Settings Client
 * Manage email templates, notification templates, legal pages, FAQs, about, and landing pages
 */

'use client';

import { FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailTemplateEditor } from '@/components/admin/email-template-editor';
import { NotificationTemplateEditor } from '@/components/admin/notification-template-editor';
import { LegalPagesManager } from '@/components/admin/legal-pages-manager';
import { FAQsManager } from '@/components/admin/faqs-manager';
import { AboutManager } from '@/components/admin/about-manager';
import { LandingManager } from '@/components/admin/landing-manager';
import { SettingsCategory } from '@/components/admin/settings/settings-category';

export function ContentSettingsClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Content</h1>
          <p className="text-sm text-muted-foreground">
            Email templates, notification templates, legal pages, FAQs, dan landing pages
          </p>
        </div>
      </div>

      <Tabs defaultValue="email-templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto gap-1 p-1">
          <TabsTrigger value="email-templates">Email</TabsTrigger>
          <TabsTrigger value="notif-templates">Notifikasi</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="landing">Landing</TabsTrigger>
          <TabsTrigger value="email-settings">Email Config</TabsTrigger>
        </TabsList>

        <TabsContent value="email-templates" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Email Templates</h2>
              <p className="text-sm text-muted-foreground">
                Kelola template email untuk booking confirmation, reminders, dll
              </p>
            </div>
            <EmailTemplateEditor />
          </div>
        </TabsContent>

        <TabsContent value="notif-templates" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Notification Templates</h2>
              <p className="text-sm text-muted-foreground">
                Kelola template push notification dan in-app notification
              </p>
            </div>
            <NotificationTemplateEditor />
          </div>
        </TabsContent>

        <TabsContent value="legal" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Legal Pages</h2>
              <p className="text-sm text-muted-foreground">
                Terms of Service, Privacy Policy, dan dokumen legal lainnya
              </p>
            </div>
            <LegalPagesManager />
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">FAQs</h2>
              <p className="text-sm text-muted-foreground">
                Frequently Asked Questions untuk halaman bantuan
              </p>
            </div>
            <FAQsManager />
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">About Page</h2>
              <p className="text-sm text-muted-foreground">
                Konten halaman tentang kami
              </p>
            </div>
            <AboutManager />
          </div>
        </TabsContent>

        <TabsContent value="landing" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Landing Pages</h2>
              <p className="text-sm text-muted-foreground">
                Kelola konten landing pages
              </p>
            </div>
            <LandingManager />
          </div>
        </TabsContent>

        <TabsContent value="email-settings" className="mt-6">
          <SettingsCategory
            title="Email Configuration"
            description="Konfigurasi email sender, SMTP, dan lainnya"
            prefixes={['email.']}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

