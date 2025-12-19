'use client';

/**
 * Guide Certifications Client Component
 * View and manage certifications (SIM Kapal, First Aid, ALIN)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileText,
    Loader2,
    Plus,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type CertificationsClientProps = {
  locale: string;
};

type Certification = {
  id: string;
  certification_type: 'sim_kapal' | 'first_aid' | 'alin' | 'other';
  certification_name: string;
  certificate_number?: string | null;
  issuing_authority?: string | null;
  issued_date: string;
  expiry_date: string;
  document_url?: string | null;
  status: 'pending' | 'verified' | 'expired' | 'rejected';
  is_active: boolean;
  notes?: string | null;
};

const CERTIFICATION_TYPES = [
  { value: 'sim_kapal', label: 'SIM Kapal' },
  { value: 'first_aid', label: 'First Aid' },
  { value: 'alin', label: 'ALIN' },
  { value: 'other', label: 'Lainnya' },
] as const;

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  rejected: 'bg-slate-100 text-slate-800 border-slate-200',
};

const STATUS_ICONS = {
  pending: Clock,
  verified: CheckCircle2,
  expired: XCircle,
  rejected: AlertCircle,
};

export function CertificationsClient({ locale: _locale }: CertificationsClientProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<{
    certifications: Certification[];
    is_valid: boolean;
  }>({
    queryKey: queryKeys.guide.certifications?.all() || ['certifications'],
    queryFn: async () => {
      const res = await fetch('/api/guide/certifications');
      if (!res.ok) {
        throw new Error('Failed to fetch certifications');
      }
      return res.json();
    },
  });

  const { data: validityData } = useQuery<{
    is_valid: boolean;
    expiring_soon: Array<{ certification_type: string; days_until_expiry: number }>;
  }>({
    queryKey: queryKeys.guide.certifications?.validity() || ['certifications', 'validity'],
    queryFn: async () => {
      const res = await fetch('/api/guide/certifications/check-validity');
      if (!res.ok) {
        throw new Error('Failed to check validity');
      }
      return res.json();
    },
  });

  const certifications = data?.certifications || [];
  const isValid = validityData?.is_valid || false;
  const expiringSoon = validityData?.expiring_soon || [];

  // Add certification form state
  const [formData, setFormData] = useState({
    certification_type: '' as '' | 'sim_kapal' | 'first_aid' | 'alin' | 'other',
    certification_name: '',
    certificate_number: '',
    issuing_authority: '',
    issued_date: '',
    expiry_date: '',
    document_url: '',
    notes: '',
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/guide/certifications/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        throw new Error(error.error || 'Upload failed');
      }

      const data = (await res.json()) as { url: string };
      return data.url;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await fetch('/api/guide/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        throw new Error(error.error || 'Failed to add certification');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.certifications?.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.certifications?.validity() });
      setShowAddDialog(false);
      setFormData({
        certification_type: '',
        certification_name: '',
        certificate_number: '',
        issuing_authority: '',
        issued_date: '',
        expiry_date: '',
        document_url: '',
        notes: '',
      });
      setDocumentFile(null);
      toast.success('Certification berhasil ditambahkan');
    },
    onError: (error) => {
      logger.error('Failed to add certification', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan certification');
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadMutation.mutateAsync(file);
      setFormData((prev) => ({ ...prev, document_url: url }));
      setDocumentFile(file);
      toast.success('Dokumen berhasil diupload');
    } catch (error) {
      logger.error('File upload failed', error);
      toast.error('Gagal upload dokumen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.certification_type || !formData.certification_name || !formData.issued_date || !formData.expiry_date) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    addMutation.mutate(formData);
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return <LoadingState message="Memuat certifications..." />;
  }

  if (error) {
    return <ErrorState message="Gagal memuat certifications" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold leading-tight text-slate-900">My Certifications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola sertifikat Anda (SIM Kapal, First Aid, ALIN)
        </p>
      </div>

      {/* Validity Status */}
      <Card className={cn('border-0 shadow-sm', isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200')}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {isValid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {isValid ? 'Semua sertifikat valid' : 'Sertifikat belum lengkap atau expired'}
              </p>
              {!isValid && (
                <p className="text-xs text-amber-700 mt-1">
                  Anda tidak dapat memulai trip hingga semua sertifikat valid
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiring Soon Alert */}
      {expiringSoon.length > 0 && (
        <Card className="border-0 bg-amber-50 shadow-sm border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Sertifikat akan expired</p>
                <ul className="mt-2 space-y-1">
                  {expiringSoon.map((cert, idx) => (
                    <li key={idx} className="text-xs text-amber-700">
                      {cert.certification_type}: {cert.days_until_expiry} hari lagi
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      <Button
        onClick={() => setShowAddDialog(true)}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        Tambah Sertifikat
      </Button>

      {/* Certifications List */}
      {certifications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada sertifikat"
          description="Tambahkan sertifikat Anda untuk memulai"
        />
      ) : (
        <div className="space-y-3">
          {certifications.map((cert) => {
            const StatusIcon = STATUS_ICONS[cert.status];
            const daysUntilExpiry = getDaysUntilExpiry(cert.expiry_date);
            const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
            const isExpired = daysUntilExpiry < 0;

            return (
              <Card key={cert.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{cert.certification_name}</h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            STATUS_COLORS[cert.status],
                          )}
                        >
                          <StatusIcon className="inline h-3 w-3 mr-1" />
                          {cert.status === 'pending' && 'Menunggu Verifikasi'}
                          {cert.status === 'verified' && 'Terverifikasi'}
                          {cert.status === 'expired' && 'Expired'}
                          {cert.status === 'rejected' && 'Ditolak'}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        {cert.certificate_number && (
                          <p>
                            <span className="font-medium">No. Sertifikat:</span> {cert.certificate_number}
                          </p>
                        )}
                        {cert.issuing_authority && (
                          <p>
                            <span className="font-medium">Dikeluarkan oleh:</span> {cert.issuing_authority}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Diterbitkan:</span>{' '}
                          {new Date(cert.issued_date).toLocaleDateString('id-ID')}
                        </p>
                        <p>
                          <span className="font-medium">Berlaku hingga:</span>{' '}
                          <span className={cn(isExpired && 'text-red-600 font-semibold', isExpiringSoon && 'text-amber-600 font-semibold')}>
                            {new Date(cert.expiry_date).toLocaleDateString('id-ID')}
                            {isExpired && ' (Expired)'}
                            {isExpiringSoon && ` (${daysUntilExpiry} hari lagi)`}
                          </span>
                        </p>
                      </div>

                      {cert.document_url && (
                        <div className="mt-3">
                          <a
                            href={cert.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            Lihat Dokumen
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Certification Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Sertifikat</DialogTitle>
            <DialogDescription>
              Upload sertifikat Anda (SIM Kapal, First Aid, atau ALIN)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Certification Type */}
            <div className="space-y-2">
              <Label>
                Jenis Sertifikat <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.certification_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, certification_type: value as typeof formData.certification_type }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis sertifikat" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Certification Name */}
            <div className="space-y-2">
              <Label>
                Nama Sertifikat <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.certification_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, certification_name: e.target.value }))}
                placeholder="Contoh: SIM Kapal Kelas I"
              />
            </div>

            {/* Certificate Number */}
            <div className="space-y-2">
              <Label>Nomor Sertifikat</Label>
              <Input
                value={formData.certificate_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, certificate_number: e.target.value }))}
                placeholder="Nomor sertifikat (opsional)"
              />
            </div>

            {/* Issuing Authority */}
            <div className="space-y-2">
              <Label>Dikeluarkan oleh</Label>
              <Input
                value={formData.issuing_authority}
                onChange={(e) => setFormData((prev) => ({ ...prev, issuing_authority: e.target.value }))}
                placeholder="Nama lembaga (opsional)"
              />
            </div>

            {/* Issued Date */}
            <div className="space-y-2">
              <Label>
                Tanggal Diterbitkan <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.issued_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, issued_date: e.target.value }))}
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label>
                Tanggal Expiry <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label>Upload Dokumen Sertifikat</Label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                disabled={uploading}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              {uploading && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Mengupload...
                </p>
              )}
              {formData.document_url && !uploading && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Dokumen berhasil diupload
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Catatan tambahan (opsional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={addMutation.isPending || uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
