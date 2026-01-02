/**
 * Component: MRA-TP Certifications List
 * Purpose: Display guide's MRA-TP certifications with status
 */

'use client';

import { AlertCircle, Award, CheckCircle, Clock, FileText, Upload, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/utils/logger';

type MRATPCertification = {
  id: string;
  certification_type: string;
  certificate_number: string | null;
  issuing_authority: string | null;
  issued_date: string;
  expiry_date: string | null;
  document_url: string | null;
  status: 'pending' | 'verified' | 'expired' | 'rejected';
  verified_at: string | null;
  created_at: string;
};

type CompetencyAssessment = {
  id: string;
  certification_type: string;
  assessment_date: string;
  overall_score: number;
  result: 'competent' | 'not_yet_competent' | 'pending';
  notes: string | null;
  certificate_number: string | null;
  certificate_url: string | null;
};

type MRATPCertificationsListProps = {
  userId: string;
};

const CERT_TYPE_LABELS: Record<string, string> = {
  tour_guide_level_1: 'Tour Guide Level 1',
  tour_guide_level_2: 'Tour Guide Level 2',
  tour_guide_level_3: 'Tour Guide Level 3',
  tour_leader: 'Tour Leader',
  eco_guide: 'Eco Guide',
  adventure_guide: 'Adventure Guide',
  cultural_guide: 'Cultural Guide',
  marine_guide: 'Marine Guide',
  bnsp_tour_guide: 'BNSP Tour Guide',
  bnsp_tour_leader: 'BNSP Tour Leader',
  other_mra_tp: 'Other MRA-TP',
};

export function MRATPCertificationsList({ userId }: MRATPCertificationsListProps) {
  const [certifications, setCertifications] = useState<MRATPCertification[]>([]);
  const [assessments, setAssessments] = useState<CompetencyAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch certifications
        const certRes = await fetch('/api/guide/certifications/mra-tp');
        const certData = await certRes.json();
        if (certData.certifications) {
          setCertifications(certData.certifications);
        }

        // Fetch assessments
        const assessRes = await fetch('/api/guide/certifications/competency');
        const assessData = await assessRes.json();
        if (assessData.assessments) {
          setAssessments(assessData.assessments);
        }
      } catch (error) {
        logger.error('Failed to fetch MRA-TP data', error, { userId });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Memuat sertifikasi...</div>;
  }

  return (
    <Tabs defaultValue="certifications" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="certifications">Sertifikat</TabsTrigger>
        <TabsTrigger value="assessments">Kompetensi</TabsTrigger>
      </TabsList>

      {/* Certifications Tab */}
      <TabsContent value="certifications" className="space-y-4">
        {certifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Belum ada sertifikat MRA-TP terdaftar
                </p>
                <Button size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Sertifikat
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          certifications.map((cert) => (
            <Card key={cert.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {CERT_TYPE_LABELS[cert.certification_type] || cert.certification_type}
                    </CardTitle>
                    {cert.certificate_number && (
                      <CardDescription className="mt-1">
                        No. {cert.certificate_number}
                      </CardDescription>
                    )}
                  </div>
                  <StatusBadge status={cert.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {cert.issuing_authority && (
                  <div className="flex items-start gap-2">
                    <Award className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{cert.issuing_authority}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Terbit: {new Date(cert.issued_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
                {cert.expiry_date && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Berlaku hingga: {new Date(cert.expiry_date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                )}
                {cert.document_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <a href={cert.document_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Lihat Dokumen
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      {/* Assessments Tab */}
      <TabsContent value="assessments" className="space-y-4">
        {assessments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <Award className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Belum ada assessment kompetensi
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          assessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {CERT_TYPE_LABELS[assessment.certification_type] ||
                        assessment.certification_type}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(assessment.assessment_date).toLocaleDateString('id-ID')}
                    </CardDescription>
                  </div>
                  <CompetencyBadge result={assessment.result} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="font-medium">Skor Total</span>
                  <span className="text-lg font-bold">{assessment.overall_score}/100</span>
                </div>
                {assessment.notes && (
                  <p className="text-muted-foreground">{assessment.notes}</p>
                )}
                {assessment.certificate_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <a
                      href={assessment.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Lihat Sertifikat
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function StatusBadge({ status }: { status: MRATPCertification['status'] }) {
  switch (status) {
    case 'verified':
      return (
        <Badge className="bg-success/10 text-success hover:bg-success/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          Terverifikasi
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          Menunggu
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Kadaluarsa
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          Ditolak
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

function CompetencyBadge({ result }: { result: CompetencyAssessment['result'] }) {
  switch (result) {
    case 'competent':
      return (
        <Badge className="bg-success/10 text-success hover:bg-success/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          Kompeten
        </Badge>
      );
    case 'not_yet_competent':
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Belum Kompeten
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          Menunggu
        </Badge>
      );
    default:
      return <Badge>{result}</Badge>;
  }
}

