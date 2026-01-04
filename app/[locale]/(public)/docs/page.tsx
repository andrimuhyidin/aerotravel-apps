/**
 * Documentation Page
 * Route: /[locale]/docs
 * User guides and system documentation
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import {
  Book,
  FileText,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Documentation - Aero Travel',
    description: 'User guides and documentation for Aero Travel system',
    alternates: {
      canonical: `${baseUrl}/${locale}/docs`,
    },
  };
}

const docSections = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of using the Aero Travel system',
    icon: Book,
    href: '#getting-started',
    items: [
      'System Overview',
      'First Login',
      'Dashboard Navigation',
      'User Roles',
    ],
  },
  {
    title: 'Bookings Management',
    description: 'How to manage bookings, trips, and customers',
    icon: FileText,
    href: '#bookings',
    items: [
      'Creating Bookings',
      'Managing Trip Schedules',
      'Customer Communication',
      'Payment Processing',
    ],
  },
  {
    title: 'Operations',
    description: 'Daily operations, scheduling, and resource management',
    icon: LayoutDashboard,
    href: '#operations',
    items: [
      'Trip Scheduling',
      'Live Tracking',
      'Asset Management',
      'Inventory Control',
    ],
  },
  {
    title: 'Team Management',
    description: 'Managing guides, staff, and partners',
    icon: Users,
    href: '#team',
    items: [
      'User Management',
      'Guide Contracts',
      'Partner Onboarding',
      'Role Permissions',
    ],
  },
  {
    title: 'Settings & Configuration',
    description: 'System settings for admins',
    icon: Settings,
    href: '#settings',
    items: [
      'General Settings',
      'Integration Setup',
      'API Configuration',
      'Notification Settings',
    ],
  },
  {
    title: 'Security & Compliance',
    description: 'Security practices and regulatory compliance',
    icon: Shield,
    href: '#security',
    items: [
      'Data Security',
      'Audit Logs',
      'GDPR Compliance',
      'Business Licenses',
    ],
  },
];

export default async function DocsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section className="py-12">
      <Container>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Welcome to the Aero Travel documentation. Find guides, tutorials, and
              reference materials to help you get the most out of the system.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-3 mb-12">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Book className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Quick Start Guide</p>
                  <p className="text-sm text-muted-foreground">5 min read</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">FAQ</p>
                  <p className="text-sm text-muted-foreground">Common questions</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Get Support</p>
                  <p className="text-sm text-muted-foreground">Contact us</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documentation Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {docSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Contact Support */}
          <div className="mt-12 text-center">
            <Card className="bg-muted/50">
              <CardContent className="py-8">
                <h3 className="text-xl font-semibold mb-2">Need more help?</h3>
                <p className="text-muted-foreground mb-4">
                  Our support team is here to assist you with any questions.
                </p>
                <div className="flex justify-center gap-4">
                  <Link
                    href={`/${locale}/console/tickets`}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Support Ticket
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  );
}

