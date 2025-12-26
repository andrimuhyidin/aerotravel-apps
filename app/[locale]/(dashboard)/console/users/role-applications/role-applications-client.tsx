/**
 * Role Applications Management Client Component
 * Admin interface for managing role applications
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PartnerReviewClient } from './partner-review-client';

type RoleApplication = {
  id: string;
  user_id: string;
  requested_role: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  admin_notes: string | null;
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
  };
};

type RoleApplicationsClientProps = {
  locale: string;
};

async function fetchApplications(status: string, role: string | null) {
  const params = new URLSearchParams({ status });
  if (role) params.append('role', role);

  const response = await fetch(`/api/admin/roles/applications?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }
  return response.json() as Promise<{ applications: RoleApplication[] }>;
}

async function approveApplication(id: string, adminNotes?: string) {
  const response = await fetch(`/api/admin/roles/applications/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminNotes }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve application');
  }
  return response.json();
}

async function rejectApplication(
  id: string,
  rejectionReason: string,
  adminNotes?: string
) {
  const response = await fetch(`/api/admin/roles/applications/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectionReason, adminNotes }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reject application');
  }
  return response.json();
}

export function RoleApplicationsClient({ locale: _locale }: RoleApplicationsClientProps) {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<RoleApplication | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showPartnerReview, setShowPartnerReview] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'role-applications', statusFilter, roleFilter],
    queryFn: () => fetchApplications(statusFilter, roleFilter),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      approveApplication(id, notes),
    onSuccess: () => {
      toast.success('Application approved successfully');
      queryClient.invalidateQueries({
        queryKey: ['admin', 'role-applications'],
      });
      setSelectedApp(null);
      setActionType(null);
      setAdminNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve application');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      notes,
    }: {
      id: string;
      reason: string;
      notes?: string;
    }) => rejectApplication(id, reason, notes),
    onSuccess: () => {
      toast.success('Application rejected');
      queryClient.invalidateQueries({
        queryKey: ['admin', 'role-applications'],
      });
      setSelectedApp(null);
      setActionType(null);
      setRejectionReason('');
      setAdminNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject application');
    },
  });

  const applications = data?.applications || [];

  const handleApprove = (app: RoleApplication) => {
    // For partner (mitra) applications, use enhanced review UI
    if (app.requested_role === 'mitra') {
      setSelectedApp(app);
      setShowPartnerReview(true);
      return;
    }
    // For other roles, use simple approve dialog
    setSelectedApp(app);
    setActionType('approve');
    setAdminNotes('');
  };

  const handleReject = (app: RoleApplication) => {
    setSelectedApp(app);
    setActionType('reject');
    setRejectionReason('');
    setAdminNotes('');
  };

  const confirmApprove = () => {
    if (!selectedApp) return;
    approveMutation.mutate({
      id: selectedApp.id,
      notes: adminNotes || undefined,
    });
  };

  const confirmReject = () => {
    if (!selectedApp || !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    rejectMutation.mutate({
      id: selectedApp.id,
      reason: rejectionReason,
      notes: adminNotes || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Role Applications</h1>
        <p className="text-muted-foreground">
          Manage role applications and approvals
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={roleFilter || 'all'}
          onValueChange={(value) => setRoleFilter(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="guide">Guide</SelectItem>
            <SelectItem value="mitra">Mitra</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="kol">Influencer / KOL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load applications</p>
        </div>
      )}

      {!isLoading && !error && applications.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No applications found</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {app.user.full_name || app.user.email}
                      <Badge
                        variant={
                          app.status === 'approved'
                            ? 'default'
                            : app.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {app.status}
                      </Badge>
                      <Badge variant="outline">{app.requested_role}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {app.user.email} • Applied{' '}
                      {new Date(app.applied_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(app)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(app)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {app.message && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Message:</p>
                    <p className="text-sm text-muted-foreground">{app.message}</p>
                  </div>
                )}
                {app.admin_notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Admin Notes:</p>
                    <p className="text-sm text-muted-foreground">
                      {app.admin_notes}
                    </p>
                  </div>
                )}
                {app.rejection_reason && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Rejection Reason:</p>
                    <p className="text-sm text-destructive">
                      {app.rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog
        open={actionType === 'approve' && selectedApp !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedApp(null);
            setActionType(null);
            setAdminNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Role Application</DialogTitle>
            <DialogDescription>
              Approve {selectedApp?.user.full_name || selectedApp?.user.email}'s
              application for {selectedApp?.requested_role} role?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedApp(null);
                setActionType(null);
                setAdminNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={actionType === 'reject' && selectedApp !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedApp(null);
            setActionType(null);
            setRejectionReason('');
            setAdminNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Role Application</DialogTitle>
            <DialogDescription>
              Reject {selectedApp?.user.full_name || selectedApp?.user.email}'s
              application for {selectedApp?.requested_role} role?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Rejection Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this application is being rejected..."
                rows={3}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedApp(null);
                setActionType(null);
                setRejectionReason('');
                setAdminNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={
                rejectMutation.isPending || !rejectionReason.trim()
              }
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner Review Dialog */}
      {showPartnerReview && selectedApp && (
        <PartnerReviewClient
          applicationId={selectedApp.id}
          onClose={() => {
            setShowPartnerReview(false);
            setSelectedApp(null);
          }}
          onReviewed={() => {
            queryClient.invalidateQueries({
              queryKey: ['admin', 'role-applications'],
            });
          }}
        />
      )}
    </div>
  );
}

