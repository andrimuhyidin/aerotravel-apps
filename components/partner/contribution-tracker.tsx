/**
 * Contribution Tracker Component
 * Track dan record contributions untuk travel circle
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { formatCurrency } from '@/lib/partner/package-utils';
import { Wallet, CreditCard } from 'lucide-react';

type ContributionTrackerProps = {
  circleId: string;
  onContributionSuccess?: () => void;
};

export function ContributionTracker({
  circleId,
  onContributionSuccess,
}: ContributionTrackerProps) {
  const [members, setMembers] = useState<Array<{
    id: string;
    memberName: string;
    targetContribution: number;
    currentContribution: number;
  }>>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'transfer' | 'midtrans'>('wallet');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    loadMembers();
    loadWalletBalance();
  }, [circleId]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch(`/api/partner/travel-circle/${circleId}/members`);

      if (!response.ok) throw new Error('Failed to load members');

      const data = await response.json();
      setMembers(data.members || []);
      
      if (data.members && data.members.length > 0) {
        setSelectedMemberId(data.members[0]!.id);
      }
    } catch (error) {
      logger.error('Failed to load members', error);
      toast.error('Gagal memuat members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const response = await fetch('/api/partner/wallet/balance');
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
      logger.warn('Failed to load wallet balance', error);
    }
  };

  const handleContribute = async () => {
    if (!selectedMemberId || !amount || parseFloat(amount) < 10000) {
      toast.error('Pilih member dan masukkan jumlah minimal Rp 10.000');
      return;
    }

    const amountNum = parseFloat(amount);
    if (paymentMethod === 'wallet' && walletBalance !== null && amountNum > walletBalance) {
      toast.error('Saldo wallet tidak mencukupi');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/partner/travel-circle/${circleId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          amount: amountNum,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record contribution');
      }

      const data = await response.json();
      toast.success(data.message || 'Contribution berhasil dicatat');
      
      setAmount('');
      if (paymentMethod === 'wallet') {
        loadWalletBalance();
      }
      
      if (onContributionSuccess) {
        onContributionSuccess();
      }
    } catch (error) {
      logger.error('Failed to record contribution', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mencatat contribution');
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const remainingForMember = selectedMember
    ? Math.max(0, selectedMember.targetContribution - selectedMember.currentContribution)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Contribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingMembers ? (
          <p className="text-sm text-muted-foreground">Loading members...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada members. Tambahkan members terlebih dahulu.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="member">Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.memberName} (
                      {formatCurrency(member.currentContribution)} /{' '}
                      {formatCurrency(member.targetContribution)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMember && (
                <p className="text-xs text-muted-foreground">
                  Sisa target: {formatCurrency(remainingForMember)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rp) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100000"
                min={10000}
                step="10000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as 'wallet' | 'transfer' | 'midtrans')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Wallet
                      {walletBalance !== null && (
                        <span className="text-xs text-muted-foreground">
                          ({formatCurrency(walletBalance)})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="midtrans">Midtrans Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleContribute}
              disabled={loading || !selectedMemberId || !amount || parseFloat(amount) < 10000}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Record Contribution'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

