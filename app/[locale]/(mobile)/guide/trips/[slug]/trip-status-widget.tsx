'use client';

/**
 * Trip Status Widget
 * Interactive status widget dengan quick actions
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Play,
    PlayCircle,
    XCircle
} from 'lucide-react';

type TripStatusWidgetProps = {
  tripStatus: 'scheduled' | 'preparing' | 'on_the_way' | 'on_trip' | 'completed' | 'cancelled';
  assignmentStatus?: 'pending_confirmation' | 'confirmed' | 'rejected' | null;
  isLeadGuide: boolean;
  canStartTrip?: boolean;
  canEndTrip?: boolean;
  onStartTrip?: () => void;
  onEndTrip?: () => void;
  onConfirmTrip?: () => void;
  confirmationDeadline?: string | null;
};

export function TripStatusWidget({
  tripStatus,
  assignmentStatus,
  isLeadGuide,
  canStartTrip = false,
  canEndTrip = false,
  onStartTrip,
  onEndTrip,
  onConfirmTrip,
  confirmationDeadline,
}: TripStatusWidgetProps) {
  // Determine status config
  const getStatusConfig = () => {
    if (assignmentStatus === 'pending_confirmation') {
      return {
        label: 'Butuh Konfirmasi',
        description: 'Silakan konfirmasi sebelum deadline',
        icon: AlertCircle,
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-900',
        iconColor: 'text-amber-600',
        buttonText: 'Konfirmasi Trip',
        buttonAction: onConfirmTrip,
        showButton: true,
      };
    }

    if (tripStatus === 'cancelled') {
      return {
        label: 'Dibatalkan',
        description: 'Trip ini telah dibatalkan',
        icon: XCircle,
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900',
        iconColor: 'text-red-600',
        buttonText: undefined,
        buttonAction: undefined,
        showButton: false,
      };
    }

    if (tripStatus === 'completed') {
      return {
        label: 'Selesai',
        description: 'Trip telah selesai',
        icon: CheckCircle2,
        color: 'from-emerald-500 to-teal-500',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-900',
        iconColor: 'text-emerald-600',
        buttonText: undefined,
        buttonAction: undefined,
        showButton: false,
      };
    }

    if (tripStatus === 'on_trip' || tripStatus === 'on_the_way') {
      return {
        label: 'Berlangsung',
        description: isLeadGuide ? 'Trip sedang berlangsung' : 'Anda sedang dalam trip',
        icon: PlayCircle,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        iconColor: 'text-blue-600',
        buttonText: isLeadGuide && canEndTrip ? 'Selesaikan Trip' : undefined,
        buttonAction: isLeadGuide && canEndTrip ? onEndTrip : undefined,
        showButton: isLeadGuide && canEndTrip,
      };
    }

    if (tripStatus === 'preparing' || tripStatus === 'scheduled') {
      return {
        label: 'Mendatang',
        description: isLeadGuide ? 'Persiapkan trip dengan baik' : 'Trip akan segera dimulai',
        icon: Clock,
        color: 'from-slate-500 to-slate-600',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-900',
        iconColor: 'text-slate-600',
        buttonText: isLeadGuide && canStartTrip ? 'Mulai Trip' : undefined,
        buttonAction: isLeadGuide && canStartTrip ? onStartTrip : undefined,
        showButton: isLeadGuide && canStartTrip,
      };
    }

    // Default
    return {
      label: 'Scheduled',
      description: 'Trip telah dijadwalkan',
      icon: Clock,
      color: 'from-slate-500 to-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      iconColor: 'text-slate-600',
      buttonText: undefined,
      buttonAction: undefined,
      showButton: false,
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Get time remaining for confirmation
  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff < 0) return 'Lewat deadline';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} menit lagi`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} jam lagi`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} hari lagi`;
  };

  return (
    <Card
      className={cn(
        'border-2 transition-all',
        config.bgColor,
        config.borderColor,
        config.showButton && 'cursor-pointer hover:shadow-md',
      )}
      onClick={config.buttonAction && config.showButton ? config.buttonAction : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          <div
            className={cn(
              'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
              config.color,
            )}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>

          {/* Status Info */}
          <div className="flex-1 min-w-0">
            <h3 className={cn('text-base font-bold', config.textColor)}>{config.label}</h3>
            <p className={cn('mt-0.5 text-sm', config.textColor, 'opacity-80')}>
              {config.description}
            </p>
            {assignmentStatus === 'pending_confirmation' && confirmationDeadline && (
              <p className="mt-1.5 text-xs font-semibold text-amber-700">
                ⏰ {getTimeRemaining(confirmationDeadline)}
              </p>
            )}
          </div>

          {/* Action Button */}
          {config.showButton && config.buttonText && config.buttonAction && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                config.buttonAction?.();
              }}
              className={cn(
                'flex-shrink-0 font-semibold',
                tripStatus === 'on_trip' || tripStatus === 'on_the_way'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white',
              )}
              size="sm"
            >
              {tripStatus === 'on_trip' || tripStatus === 'on_the_way' ? (
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
              ) : (
                <Play className="mr-1.5 h-4 w-4" />
              )}
              {config.buttonText}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
