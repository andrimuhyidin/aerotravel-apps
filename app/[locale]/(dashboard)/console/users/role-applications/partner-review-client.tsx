/**
 * Partner Application Review Client Component
 * Enhanced review UI for partner applications with company data and legal documents
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Building2,
  Check,
  CreditCard,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type PartnerApplication = {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  message: string | null;
  company_data: Record<string, unknown> | null;
  legal_documents: string[] | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
  };
};

type LegalDocument = {
  id: string;
  document_type: string;
  document_number: string | null;
  document_url: string;
  ocr_data: Record<string, unknown> | null;
  ocr_confidence: number | null;
  is_verified: boolean;
  file_name: string | null;
};

type PartnerReviewClientProps = {
  applicationId: string;
  onClose: () => void;
  onReviewed: () => void;
};

async function fetchApplicationReview(id: string) {
  const response = await fetch(`/api/admin/roles/applications/${id}/review`);
  if (!response.ok) {
    throw new Error('Failed to fetch application');
  }
  return response.json() as Promise<{
    application: PartnerApplication;
    legalDocuments: LegalDocument[];
  }>;
}

async function reviewApplication(
  id: string,
  action: 'approve' | 'reject',
  adminNotes?: string,
  verifiedCompanyData?: Record<string, unknown>
) {
  const response = await fetch(`/api/admin/roles/applications/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      adminNotes,
      verifiedCompanyData,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to ${action} application`);
  }
  return response.json();
}

export function PartnerReviewClient({
  applicationId,
  onClose,
  onReviewed,
}: PartnerReviewClientProps) {
  const [adminNotes, setAdminNotes] = useState('');
  const [verifiedCompanyData, setVerifiedCompanyData] = useState<
    Record<string, unknown> | null
  >(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['partner-application-review', applicationId],
    queryFn: () => fetchApplicationReview(applicationId),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      action,
      notes,
      companyData,
    }: {
      action: 'approve' | 'reject';
      notes?: string;
      companyData?: Record<string, unknown>;
    }) => reviewApplication(applicationId, action, notes, companyData),
    onSuccess: (_, variables) => {
      toast.success(
        `Application ${variables.action === 'approve' ? 'approved' : 'rejected'} successfully`
      );
      onReviewed();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setIsReviewing(false);
    },
  });

  if (isLoading) {
    return (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DialogContent>
    );
  }

  if (error || !data) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error</DialogTitle>
          <DialogDescription>
            Failed to load application details
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  const { application, legalDocuments } = data;
  const companyData = (application.company_data ||
    {}) as Record<string, unknown>;

  const handleApprove = () => {
    setIsReviewing(true);
    reviewMutation.mutate({
      action: 'approve',
      notes: adminNotes || undefined,
      companyData: verifiedCompanyData || companyData,
    });
  };

  const handleReject = () => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setIsReviewing(true);
    reviewMutation.mutate({
      action: 'reject',
      notes: adminNotes,
    });
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Review Partner Application</DialogTitle>
        <DialogDescription>
          Review company information and legal documents
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applicant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="font-medium">{application.user.full_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-medium">{application.user.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <p className="font-medium">{application.user.phone || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Verify and correct company data if needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={(verifiedCompanyData?.companyName as string) || (companyData.companyName as string) || ''}
                  onChange={(e) => {
                    setVerifiedCompanyData({
                      ...(verifiedCompanyData || companyData),
                      companyName: e.target.value,
                    });
                  }}
                  placeholder="Company name"
                />
              </div>
              <div>
                <Label>NPWP</Label>
                <Input
                  value={(verifiedCompanyData?.npwp as string) || (companyData.npwp as string) || ''}
                  onChange={(e) => {
                    setVerifiedCompanyData({
                      ...(verifiedCompanyData || companyData),
                      npwp: e.target.value,
                    });
                  }}
                  placeholder="NPWP number"
                />
              </div>
              <div>
                <Label>SIUP Number</Label>
                <Input
                  value={(verifiedCompanyData?.siupNumber as string) || (companyData.siupNumber as string) || ''}
                  onChange={(e) => {
                    setVerifiedCompanyData({
                      ...(verifiedCompanyData || companyData),
                      siupNumber: e.target.value,
                    });
                  }}
                  placeholder="SIUP number"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={(verifiedCompanyData?.phone as string) || (companyData.phone as string) || ''}
                  onChange={(e) => {
                    setVerifiedCompanyData({
                      ...(verifiedCompanyData || companyData),
                      phone: e.target.value,
                    });
                  }}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div>
              <Label>Company Address</Label>
              <Textarea
                value={(verifiedCompanyData?.companyAddress as string) || (companyData.companyAddress as string) || ''}
                onChange={(e) => {
                  setVerifiedCompanyData({
                    ...(verifiedCompanyData || companyData),
                    companyAddress: e.target.value,
                  });
                }}
                placeholder="Company address"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              <div>
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bank Name
                </Label>
                <Input
                  value={(verifiedCompanyData?.bankName as string) || (companyData.bankName as string) || ''}
                  onChange={(e) => {
                    setVerifiedCompanyData({
                      ...(verifiedCompanyData || companyData),
                      bankName: e.target.value,
                    });
                  }}
                  placeholder="Bank name"
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  value={(verifiedCompanyData?.bankAccountNumber as string) || (companyData.bankAccountNumber as string) || ''}
                  onChange={(e) => {
                    setVerifiedCompanyData({
                      ...(verifiedCompanyData || companyData),
                      bankAccountNumber: e.target.value,
                    });
                  }}
                  placeholder="Account number"
                />
              </div>
              <div>
                <Label>Account Name</Label>
                <Input
                  value={(verifiedCompanyData?.bankAccountName as string) || (companyData.bankAccountName as string) || ''}
                  onChange={(e) => {
                    setVerifiedCompanyData({
                      ...(verifiedCompanyData || companyData),
                      bankAccountName: e.target.value,
                    });
                  }}
                  placeholder="Account holder name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Documents */}
        {legalDocuments && legalDocuments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Legal Documents
              </CardTitle>
              <CardDescription>
                Review uploaded documents and OCR extraction results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {legalDocuments.map((doc: LegalDocument) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{doc.document_type}</p>
                      {doc.document_number && (
                        <p className="text-sm text-muted-foreground">
                          Number: {doc.document_number}
                        </p>
                      )}
                      {doc.ocr_confidence !== null && (
                        <Badge variant="outline" className="mt-1">
                          OCR Confidence: {doc.ocr_confidence}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.is_verified && (
                        <Badge variant="default" className="bg-green-600">
                          Verified
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.document_url, '_blank')}
                      >
                        View Document
                      </Button>
                    </div>
                  </div>
                  {doc.ocr_data && Object.keys(doc.ocr_data).length > 0 && (
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-2">OCR Extracted Data:</p>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(doc.ocr_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Admin Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Notes</CardTitle>
            <CardDescription>
              Add notes for this review (required for rejection)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add review notes..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose} disabled={isReviewing}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleReject}
          disabled={isReviewing}
        >
          {isReviewing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Rejecting...
            </>
          ) : (
            <>
              <X className="mr-2 h-4 w-4" />
              Reject
            </>
          )}
        </Button>
        <Button onClick={handleApprove} disabled={isReviewing}>
          {isReviewing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Approving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

