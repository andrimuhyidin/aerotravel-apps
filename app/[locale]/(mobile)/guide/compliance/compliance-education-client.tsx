'use client';

/**
 * Compliance Education Client Component
 * Educational content explaining compliance standards and procedures
 */

import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Globe,
  Link as LinkIcon,
  Shield,
  TreePine,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type ComplianceEducationClientProps = {
  locale: string;
};

type ComplianceStandard = {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  features: string[];
  benefits: string[];
};

const STANDARDS: ComplianceStandard[] = [
  {
    id: 'iso-21101',
    name: 'ISO 21101',
    code: 'Adventure Tourism Safety',
    description: 'Standar internasional untuk keselamatan wisata petualangan',
    icon: Shield,
    color: 'bg-blue-500',
    features: ['Risk Assessment', 'Equipment Checklist', 'Safety Briefing'],
    benefits: ['Mencegah kecelakaan', 'Melindungi nyawa', 'Legal compliance'],
  },
  {
    id: 'iso-45001',
    name: 'ISO 45001',
    code: 'Occupational Health & Safety',
    description: 'Standar untuk keselamatan kerja',
    icon: Users,
    color: 'bg-green-500',
    features: ['SOS System', 'Incident Reporting', 'Training Records'],
    benefits: ['Melindungi guide dari risiko kerja', 'Memastikan lingkungan kerja aman', 'Career development'],
  },
  {
    id: 'iso-14001',
    name: 'ISO 14001',
    code: 'Environmental Management',
    description: 'Standar untuk pengelolaan lingkungan',
    icon: TreePine,
    color: 'bg-emerald-500',
    features: ['Waste Tracking', 'Carbon Footprint'],
    benefits: ['Melindungi lingkungan laut', 'Sustainability untuk masa depan', 'Ecosystem protection'],
  },
  {
    id: 'chse',
    name: 'CHSE',
    code: 'Cleanliness, Health, Safety, Environment',
    description: 'Standar Indonesia untuk pariwisata',
    icon: CheckCircle2,
    color: 'bg-amber-500',
    features: ['Semua fitur safety & hygiene'],
    benefits: ['Sertifikasi CHSE', 'Kepercayaan customer', 'Legal compliance'],
  },
  {
    id: 'uu-pdp',
    name: 'UU PDP',
    code: 'Undang-Undang Perlindungan Data Pribadi',
    description: 'Perlindungan data pribadi penumpang',
    icon: FileText,
    color: 'bg-purple-500',
    features: ['Data Masking', 'Consent Management', 'Auto-Deletion'],
    benefits: ['Legal compliance', 'Kepercayaan penumpang', 'Privacy protection'],
  },
];

const FEATURE_MAPPING = [
  {
    feature: 'Risk Assessment',
    standards: ['ISO 21101', 'ISO 45001'],
    link: '/guide/trips/[slug]',
  },
  {
    feature: 'Equipment Checklist',
    standards: ['ISO 21101', 'CHSE'],
    link: '/guide/trips/[slug]/equipment',
  },
  {
    feature: 'Waste Tracking',
    standards: ['ISO 14001', 'CHSE'],
    link: '/guide/trips/[slug]',
  },
  {
    feature: 'Manifest Privacy',
    standards: ['UU PDP'],
    link: '/guide/trips/[slug]',
  },
  {
    feature: 'Training Records',
    standards: ['ISO 45001', 'CHSE'],
    link: '/guide/training',
  },
];

export function ComplianceEducationClient({ locale }: ComplianceEducationClientProps) {
  const [readSections, setReadSections] = useState<Set<string>>(new Set());
  const [engagementScore, setEngagementScore] = useState(0);

  // Track section read
  const trackReadMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const res = await fetch('/api/guide/compliance/education/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_id: sectionId }),
      });

      if (!res.ok) {
        throw new Error('Failed to track reading');
      }

      return res.json();
    },
    onSuccess: (_, sectionId) => {
      setReadSections((prev) => new Set([...prev, sectionId]));
      const newScore = ((readSections.size + 1) / 6) * 100;
      setEngagementScore(newScore);
    },
    onError: (error) => {
      logger.warn('Failed to track compliance education read', { error });
      // Don't show error to user, just continue
    },
  });

  const handleSectionRead = (sectionId: string) => {
    if (!readSections.has(sectionId)) {
      trackReadMutation.mutate(sectionId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Compliance Education</h1>
        <p className="text-sm sm:text-base text-slate-600">
          Pelajari mengapa aplikasi ini memiliki banyak prosedur compliance dan standar yang diikuti
        </p>
      </div>

      {/* Engagement Progress */}
      {engagementScore > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Progress Pembacaan</span>
                <span className="text-slate-600">{Math.round(engagementScore)}%</span>
              </div>
              <Progress value={engagementScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Introduction Section */}
      <Card
        id="introduction"
        onMouseEnter={() => handleSectionRead('introduction')}
        className="border-blue-200 bg-blue-50/50"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Mengapa Aplikasi Ini Sangat Ketat?
          </CardTitle>
          <CardDescription>
            Semua prosedur ada untuk melindungi semua pihak
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-700">
            Aplikasi ini dirancang dengan standar compliance yang ketat untuk memastikan keselamatan,
            keamanan, dan kualitas layanan. Setiap prosedur yang harus Anda ikuti memiliki alasan yang
            jelas dan manfaat untuk semua pihak.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-white p-3 text-center">
              <Users className="mx-auto h-8 w-8 text-blue-600" />
              <p className="mt-2 text-sm font-medium">Guide</p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <Users className="mx-auto h-8 w-8 text-green-600" />
              <p className="mt-2 text-sm font-medium">Passenger</p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <Globe className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-2 text-sm font-medium">Company</p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <TreePine className="mx-auto h-8 w-8 text-amber-600" />
              <p className="mt-2 text-sm font-medium">Environment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standards Overview */}
      <Card
        id="standards"
        onMouseEnter={() => handleSectionRead('standards')}
      >
        <CardHeader>
          <CardTitle>Compliance Standards Overview</CardTitle>
          <CardDescription>
            Standar internasional dan nasional yang diikuti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" className="w-full">
            {STANDARDS.map((standard) => {
              const Icon = standard.icon;
              return (
                <AccordionItem key={standard.id} value={standard.id}>
                  <AccordionTrigger value={standard.id}>
                    <div className="flex items-center gap-3">
                      <div className={`${standard.color} rounded-lg p-2 text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{standard.name}</div>
                        <div className="text-xs text-slate-500">{standard.code}</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent value={standard.id} className="space-y-4 pt-4">
                    <p className="text-slate-700">{standard.description}</p>
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">Fitur Terkait:</p>
                      <div className="flex flex-wrap gap-2">
                        {standard.features.map((feature) => (
                          <Badge key={feature} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">Manfaat:</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {standard.benefits.map((benefit, idx) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Feature-to-Compliance Mapping */}
      <Card
        id="feature-mapping"
        onMouseEnter={() => handleSectionRead('feature-mapping')}
      >
        <CardHeader>
          <CardTitle>Feature-to-Compliance Mapping</CardTitle>
          <CardDescription>
            Setiap fitur di aplikasi terkait dengan compliance standard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {FEATURE_MAPPING.map((mapping, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="mb-2 font-medium text-slate-900">{mapping.feature}</div>
                <div className="flex flex-wrap gap-2">
                  {mapping.standards.map((standard) => (
                    <Badge key={standard} variant="secondary">
                      {standard}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits for All Parties */}
      <Card
        id="benefits"
        onMouseEnter={() => handleSectionRead('benefits')}
      >
        <CardHeader>
          <CardTitle>Benefits for All Parties</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" className="w-full">
            <AccordionItem value="guide">
              <AccordionTrigger value="guide">Untuk Guide</AccordionTrigger>
              <AccordionContent value="guide" className="space-y-2 pt-4">
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Perlindungan hukum jika terjadi insiden</li>
                  <li>Training yang meningkatkan skill</li>
                  <li>Environment yang lebih aman untuk bekerja</li>
                  <li>Career development melalui compliance records</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="passenger">
              <AccordionTrigger value="passenger">Untuk Passenger</AccordionTrigger>
              <AccordionContent value="passenger" className="space-y-2 pt-4">
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Keamanan selama trip</li>
                  <li>Privasi data terjaga</li>
                  <li>Service quality yang konsisten</li>
                  <li>Trust & confidence</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="company">
              <AccordionTrigger value="company">Untuk Company</AccordionTrigger>
              <AccordionContent value="company" className="space-y-2 pt-4">
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Legal compliance</li>
                  <li>Insurance coverage</li>
                  <li>Reputation & brand value</li>
                  <li>Operational efficiency</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="environment">
              <AccordionTrigger value="environment">Untuk Environment</AccordionTrigger>
              <AccordionContent value="environment" className="space-y-2 pt-4">
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Sustainable tourism</li>
                  <li>Marine ecosystem protection</li>
                  <li>Carbon footprint reduction</li>
                  <li>Future generations</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card
        id="quick-links"
        onMouseEnter={() => handleSectionRead('quick-links')}
      >
        <CardHeader>
          <CardTitle>Quick Links to Compliance Features</CardTitle>
          <CardDescription>
            Akses langsung ke fitur compliance di aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Link href={`/${locale}/guide/trips`}>
              <Button variant="outline" className="w-full justify-start">
                <LinkIcon className="mr-2 h-4 w-4" />
                Complete Risk Assessment
              </Button>
            </Link>
            <Link href={`/${locale}/guide/trips`}>
              <Button variant="outline" className="w-full justify-start">
                <LinkIcon className="mr-2 h-4 w-4" />
                Check Equipment
              </Button>
            </Link>
            <Link href={`/${locale}/guide/training`}>
              <Button variant="outline" className="w-full justify-start">
                <LinkIcon className="mr-2 h-4 w-4" />
                View Training Status
              </Button>
            </Link>
            <Link href={`/${locale}/guide/trips`}>
              <Button variant="outline" className="w-full justify-start">
                <LinkIcon className="mr-2 h-4 w-4" />
                Log Waste
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

