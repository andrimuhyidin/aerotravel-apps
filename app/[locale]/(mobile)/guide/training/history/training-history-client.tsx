'use client';

/**
 * Training History Client Component
 * Display training sessions, attendance, and certificates
 */

import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2, Clock, Download, FileText, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type TrainingHistoryClientProps = {
  locale: string;
};

type TrainingSession = {
  id: string;
  title: string;
  description?: string | null;
  session_type: 'sop' | 'safety' | 'drill' | 'other';
  training_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  attendance_status?: string | null;
};

type Certificate = {
  id: string;
  certificate_number: string;
  issued_at: string;
  expires_at?: string | null;
  module: {
    id: string;
    title: string;
    category: string;
  };
};

const SESSION_TYPE_LABELS = {
  sop: 'SOP Update',
  safety: 'Safety Training',
  drill: 'Drill',
  other: 'Other',
};

const ATTENDANCE_STATUS_COLORS = {
  present: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  late: 'bg-amber-100 text-amber-800 border-amber-200',
  excused: 'bg-slate-100 text-slate-800 border-slate-200',
};

const ATTENDANCE_STATUS_ICONS = {
  present: CheckCircle2,
  absent: XCircle,
  late: Clock,
  excused: Clock,
};

export function TrainingHistoryClient({ locale: _locale }: TrainingHistoryClientProps) {
  // Fetch training sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    sessions: TrainingSession[];
  }>({
    queryKey: queryKeys.guide.training.sessions(),
    queryFn: async () => {
      const res = await fetch('/api/guide/training/sessions');
      if (!res.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return res.json();
    },
  });

  // Fetch certificates
  const { data: certificatesData, isLoading: certificatesLoading } = useQuery<{
    certificates: Certificate[];
  }>({
    queryKey: queryKeys.guide.training.certificates(),
    queryFn: async () => {
      const res = await fetch('/api/guide/training/certificates');
      if (!res.ok) {
        throw new Error('Failed to fetch certificates');
      }
      return res.json();
    },
  });

  const sessions = sessionsData?.sessions || [];
  const certificates = certificatesData?.certificates || [];

  // Filter out invalid sessions and certificates
  const validSessions = sessions.filter((s) => s && s.id && s.title);
  const validCertificates = certificates.filter((c) => c && c.id && c.module);

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      const res = await fetch(`/api/guide/training/certificates/${certificateId}`);
      if (!res.ok) {
        throw new Error('Failed to download certificate');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Certificate berhasil didownload');
    } catch (error) {
      toast.error('Gagal download certificate');
    }
  };

  if (sessionsLoading || certificatesLoading) {
    return <LoadingState message="Memuat training history..." />;
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold leading-tight text-slate-900">Training History</h1>
        <p className="mt-1 text-sm text-slate-600">
          Riwayat training dan sertifikat Anda
        </p>
      </div>

      {/* Certificates Section */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Sertifikat</h2>
        {validCertificates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum ada sertifikat"
            description="Selesaikan training untuk mendapatkan sertifikat"
          />
        ) : (
          <div className="space-y-3">
            {validCertificates.map((cert) => {
              if (!cert || !cert.id || !cert.module) return null;
              const module = cert.module;
              const moduleTitle = module.title || 'Training Module';
              const moduleCategory = module.category || 'other';
              const certificateNumber = cert.certificate_number || 'N/A';
              let issuedDate = 'N/A';
              let expiresDate: string | null = null;
              
              try {
                if (cert.issued_at) {
                  issuedDate = new Date(cert.issued_at).toLocaleDateString('id-ID');
                }
                if (cert.expires_at) {
                  expiresDate = new Date(cert.expires_at).toLocaleDateString('id-ID');
                }
              } catch {
                // Invalid date, use default
              }
              
              return (
                <Card key={cert.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{moduleTitle}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {SESSION_TYPE_LABELS[moduleCategory as keyof typeof SESSION_TYPE_LABELS] || moduleCategory}
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <p>
                            <span className="font-medium">No. Sertifikat:</span> {certificateNumber}
                          </p>
                          <p>
                            <span className="font-medium">Diterbitkan:</span> {issuedDate}
                          </p>
                          {expiresDate && (
                            <p>
                              <span className="font-medium">Berlaku hingga:</span> {expiresDate}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadCertificate(cert.id)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Sessions Section */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Training Sessions</h2>
        {validSessions.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Belum ada training session"
            description="Admin akan membuat training session untuk Anda"
          />
        ) : (
          <div className="space-y-3">
            {validSessions.map((session) => {
              if (!session || !session.id) return null;
              const sessionTitle = session.title || 'Training Session';
              const sessionDescription = session.description;
              const sessionDate = session.training_date;
              const StatusIcon = session.attendance_status
                ? ATTENDANCE_STATUS_ICONS[session.attendance_status as keyof typeof ATTENDANCE_STATUS_ICONS]
                : Clock;

              let formattedDate = 'Tanggal tidak tersedia';
              try {
                if (sessionDate) {
                  formattedDate = new Date(sessionDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                }
              } catch {
                // Invalid date, use default
              }

              return (
                <Card key={session.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{sessionTitle}</h3>
                        {sessionDescription && (
                          <p className="mt-1 text-sm text-slate-600">{sessionDescription}</p>
                        )}
                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{formattedDate}</span>
                          </div>
                          {session.start_time && session.end_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                {session.start_time} - {session.end_time}
                              </span>
                            </div>
                          )}
                          {session.location && (
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              <span>{session.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {session.attendance_status && (
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1',
                            ATTENDANCE_STATUS_COLORS[session.attendance_status as keyof typeof ATTENDANCE_STATUS_COLORS] || ATTENDANCE_STATUS_COLORS.present,
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {session.attendance_status === 'present' && 'Hadir'}
                          {session.attendance_status === 'absent' && 'Tidak Hadir'}
                          {session.attendance_status === 'late' && 'Terlambat'}
                          {session.attendance_status === 'excused' && 'Dispensasi'}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
