/**
 * Component: Permenparekraf Self-Assessment Dashboard
 * Purpose: Display and manage Permenparekraf self-assessments
 */

'use client';

import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/utils/logger';

type Assessment = {
  id: string;
  assessment_type: string;
  assessment_date: string;
  assessment_year: number;
  total_score: number;
  grade: string;
  status: string;
  section_legalitas: number;
  section_sdm: number;
  section_sarana_prasarana: number;
  section_pelayanan: number;
  section_keuangan: number;
  section_lingkungan: number;
  created_at: string;
};

type PermenparekrafDashboardProps = {
  userId: string;
};

const BUSINESS_TYPES = [
  { value: 'agen_perjalanan_wisata', label: 'Agen Perjalanan Wisata' },
  { value: 'biro_perjalanan_wisata', label: 'Biro Perjalanan Wisata' },
  { value: 'penyelenggara_perjalanan_wisata', label: 'Penyelenggara Perjalanan Wisata' },
  { value: 'usaha_daya_tarik_wisata', label: 'Usaha Daya Tarik Wisata' },
];

export function PermenparekrafDashboard({ userId }: PermenparekrafDashboardProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    assessmentType: 'agen_perjalanan_wisata',
    assessmentDate: new Date().toISOString().split('T')[0] ?? '',
    assessmentYear: new Date().getFullYear(),
    legalitas: 0,
    sdm: 0,
    saranaPrasarana: 0,
    pelayanan: 0,
    keuangan: 0,
    lingkungan: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  async function fetchAssessments() {
    try {
      const res = await fetch('/api/admin/compliance/permenparekraf');
      const data = await res.json();
      if (data.assessments) {
        setAssessments(data.assessments);
      }
    } catch (error) {
      logger.error('Failed to fetch assessments', error, { userId });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        assessmentType: formData.assessmentType,
        assessmentDate: formData.assessmentDate,
        assessmentYear: formData.assessmentYear,
        sectionScores: {
          legalitas: formData.legalitas,
          sdm: formData.sdm,
          sarana_prasarana: formData.saranaPrasarana,
          pelayanan: formData.pelayanan,
          keuangan: formData.keuangan,
          lingkungan: formData.lingkungan,
        },
      };

      const res = await fetch('/api/admin/compliance/permenparekraf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchAssessments();
        // Reset form
        setFormData({
          assessmentType: 'agen_perjalanan_wisata',
          assessmentDate: new Date().toISOString().split('T')[0] ?? '',
          assessmentYear: new Date().getFullYear(),
          legalitas: 0,
          sdm: 0,
          saranaPrasarana: 0,
          pelayanan: 0,
          keuangan: 0,
          lingkungan: 0,
        });
      }
    } catch (error) {
      logger.error('Failed to submit assessment', error);
    } finally {
      setSubmitting(false);
    }
  }

  const latestAssessment = assessments[0];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Ringkasan</TabsTrigger>
        <TabsTrigger value="history">Riwayat</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        {/* Current Status Card */}
        {latestAssessment ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Assessment Terbaru</CardTitle>
                  <CardDescription>
                    {new Date(latestAssessment.assessment_date).toLocaleDateString('id-ID')}
                  </CardDescription>
                </div>
                <StatusBadge status={latestAssessment.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
                <div>
                  <div className="text-sm text-muted-foreground">Nilai Total</div>
                  <div className="text-3xl font-bold">{latestAssessment.total_score}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Grade</div>
                  <div className="text-3xl font-bold">{latestAssessment.grade}</div>
                </div>
              </div>

              {/* Section Scores */}
              <div className="grid grid-cols-2 gap-3">
                <ScoreItem label="Legalitas" score={latestAssessment.section_legalitas} />
                <ScoreItem label="SDM" score={latestAssessment.section_sdm} />
                <ScoreItem
                  label="Sarana & Prasarana"
                  score={latestAssessment.section_sarana_prasarana}
                />
                <ScoreItem label="Pelayanan" score={latestAssessment.section_pelayanan} />
                <ScoreItem label="Keuangan" score={latestAssessment.section_keuangan} />
                <ScoreItem label="Lingkungan" score={latestAssessment.section_lingkungan} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada assessment</p>
            </CardContent>
          </Card>
        )}

        {/* Create New Assessment Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Buat Assessment Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assessment Baru</DialogTitle>
              <DialogDescription>
                Isi skor untuk setiap section (0-100)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipe Usaha</Label>
                <Select
                  value={formData.assessmentType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, assessmentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tanggal Assessment</Label>
                <Input
                  type="date"
                  value={formData.assessmentDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, assessmentDate: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Legalitas (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.legalitas}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, legalitas: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <Label>SDM (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.sdm}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sdm: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <Label>Sarana & Prasarana (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.saranaPrasarana}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, saranaPrasarana: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <Label>Pelayanan (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.pelayanan}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pelayanan: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <Label>Keuangan (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.keuangan}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, keuangan: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <Label>Lingkungan (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.lingkungan}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lingkungan: Number(e.target.value) }))
                  }
                />
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? 'Menyimpan...' : 'Simpan Assessment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </TabsContent>

      {/* History Tab */}
      <TabsContent value="history" className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Memuat...</div>
        ) : assessments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Belum ada riwayat assessment</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          assessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Assessment {assessment.assessment_year}
                    </CardTitle>
                    <CardDescription>
                      {new Date(assessment.assessment_date).toLocaleDateString('id-ID')}
                    </CardDescription>
                  </div>
                  <StatusBadge status={assessment.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nilai: {assessment.total_score}</span>
                  <span className="text-lg font-bold">Grade: {assessment.grade}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function ScoreItem({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <div className="text-lg font-bold">{score}</div>
        <TrendingUp className="h-4 w-4 text-success" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return (
        <Badge className="bg-success/10 text-success hover:bg-success/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          Disetujui
        </Badge>
      );
    case 'submitted':
    case 'under_review':
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          Review
        </Badge>
      );
    case 'revision_required':
      return (
        <Badge variant="outline">
          <AlertCircle className="mr-1 h-3 w-3" />
          Perlu Revisi
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Ditolak
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

