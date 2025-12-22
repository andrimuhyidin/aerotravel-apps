'use client';

/**
 * Trip Timeline View Component
 * Tab-based trip detail yang mengikuti best practices industry
 * Menampilkan fase-fase trip dari awal sampai akhir dengan tab navigation
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ClipboardList,
    FileText,
    Info,
    MapPin,
    MessageSquare,
    Package,
    Play,
    Receipt,
    ShieldCheck,
    Trash2,
    Users
} from 'lucide-react';
import * as React from 'react';

import { AddOnsSection } from './add-ons-section';
import { CompletionChecklistWidget } from './completion-checklist-widget';
import { CrewNotesSection } from './crew-notes-section';
import { CrewSection } from './crew-section';
import { DocumentationSection } from './documentation-section';
import { ExpensesClient } from './expenses/expenses-client';
import { GuestEngagementSection } from './guest-engagement-section';
import { LogisticsHandoverSection } from './logistics-handover-section';
import { ManifestSection } from './manifest-section';
import { PassengerConsentSection } from './passenger-consent-section';
import { PaymentSplitSection } from './payment-split-section';
import { PhaseSectionHeader } from './phase-section-header';
import { EquipmentChecklistSection, RiskAssessmentSection } from './pre-trip-sections';
import { StartTripWidget } from './start-trip-widget';
import { TippingSection } from './tipping-section';
import { TripInfoSection } from './trip-info-section';
import { TripItineraryTimeline } from './trip-itinerary-timeline';
import { TripReadinessWidget } from './trip-readiness-widget';
import { TripSpecialNotesSection } from './trip-special-notes-section';
import { TripSummarySection } from './trip-summary-section';
import { TripTasks } from './trip-tasks';
import { WasteLogButton } from './waste-log-button';
import { VideoBriefingPlayer } from '@/components/guide/video-briefing-player';

type TripPhase = 
  | 'pre_trip'           // Konfirmasi, persiapan
  | 'before_departure'   // Check-in, manifest, equipment
  | 'during_trip'        // Start trip, itinerary, guest management
  | 'post_trip';         // Return, completion, documentation

type Passenger = {
  id: string;
  name: string;
  phone?: string;
  status: 'pending' | 'boarded' | 'returned';
};

type TripTimelineViewProps = {
  tripId: string;
  locale: string;
  isLeadGuide: boolean;
  crewRole: string | null;
  manifest: {
    tripName: string;
    tripCode?: string;
    date: string;
    totalPax: number;
    boardedCount: number;
    returnedCount: number;
    documentationUrl?: string | null;
    passengers?: Passenger[];
  };
  assignmentStatus?: 'pending_confirmation' | 'confirmed' | 'rejected' | null;
  currentPhase: TripPhase;
  onStartTrip?: () => void;
  onEndTrip?: () => void;
  onOpenReadinessDialog?: () => void;
};

type PhaseConfig = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'active' | 'upcoming';
};

export function TripTimelineView({
  tripId,
  locale,
  isLeadGuide,
  crewRole,
  manifest,
  assignmentStatus,
  currentPhase,
  onStartTrip,
  onEndTrip,
  onOpenReadinessDialog,
}: TripTimelineViewProps) {
  // Get trip identifier for URLs (use tripCode if available, fallback to tripId)
  const tripIdentifier = manifest.tripCode || tripId;
  // Map current phase to tab value
  const getDefaultTab = (phase: TripPhase): string => {
    const phaseMap: Record<TripPhase, string> = {
      pre_trip: 'pre_trip',
      before_departure: 'before_departure',
      during_trip: 'during_trip',
      post_trip: 'post_trip',
    };
    return phaseMap[phase] || 'pre_trip';
  };

  const [activeTab, setActiveTab] = React.useState<string>(getDefaultTab(currentPhase));

  const phases: Record<TripPhase, PhaseConfig> = {
    pre_trip: {
      title: 'Persiapan Trip',
      description: 'Konfirmasi assignment, review info trip, dan persiapan',
      icon: Calendar,
      status: currentPhase === 'pre_trip' ? 'active' : currentPhase === 'before_departure' || currentPhase === 'during_trip' || currentPhase === 'post_trip' ? 'completed' : 'upcoming',
    },
    before_departure: {
      title: 'Sebelum Keberangkatan',
      description: 'Check-in, manifest tamu, dan cek perlengkapan',
      icon: MapPin,
      status: currentPhase === 'before_departure' ? 'active' : currentPhase === 'during_trip' || currentPhase === 'post_trip' ? 'completed' : 'upcoming',
    },
    during_trip: {
      title: 'Selama Trip',
      description: 'Itinerary, manajemen tamu, dan aktivitas trip',
      icon: Users,
      status: currentPhase === 'during_trip' ? 'active' : currentPhase === 'post_trip' ? 'completed' : 'upcoming',
    },
    post_trip: {
      title: 'Selesai Trip',
      description: 'Return, dokumentasi, dan penyelesaian administrasi',
      icon: CheckCircle2,
      status: currentPhase === 'post_trip' ? 'active' : 'upcoming',
    },
  };

  return (
    <div className="space-y-6">
      {/* Tab-based Phase Navigation - Premium Design */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-50 to-slate-100 p-1.5 h-auto rounded-xl shadow-sm border border-slate-200/50 gap-1">
          <TabsTrigger
            value="pre_trip"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-1.5 text-[10px] font-semibold transition-all rounded-lg min-h-[60px]',
              activeTab === 'pre_trip'
                ? phases.pre_trip.status === 'completed'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/50'
                  : phases.pre_trip.status === 'active'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200/50'
                  : 'bg-white text-slate-900 shadow-sm'
                : phases.pre_trip.status === 'completed'
                ? 'text-emerald-600 hover:bg-emerald-50/50'
                : phases.pre_trip.status === 'active'
                ? 'text-blue-600 hover:bg-blue-50/50'
                : 'text-slate-500 hover:bg-white/50'
            )}
          >
            <phases.pre_trip.icon className={cn(
              'h-3.5 w-3.5 transition-transform flex-shrink-0',
              activeTab === 'pre_trip' && phases.pre_trip.status !== 'completed' && phases.pre_trip.status !== 'active' && 'scale-110'
            )} />
            <span className="text-center leading-tight whitespace-nowrap">Persiapan</span>
          </TabsTrigger>
          
          <TabsTrigger
            value="before_departure"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-1.5 text-[10px] font-semibold transition-all rounded-lg min-h-[60px]',
              activeTab === 'before_departure'
                ? phases.before_departure.status === 'completed'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/50'
                  : phases.before_departure.status === 'active'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200/50'
                  : 'bg-white text-slate-900 shadow-sm'
                : phases.before_departure.status === 'completed'
                ? 'text-emerald-600 hover:bg-emerald-50/50'
                : phases.before_departure.status === 'active'
                ? 'text-blue-600 hover:bg-blue-50/50'
                : 'text-slate-500 hover:bg-white/50'
            )}
          >
            <phases.before_departure.icon className={cn(
              'h-3.5 w-3.5 transition-transform flex-shrink-0',
              activeTab === 'before_departure' && phases.before_departure.status !== 'completed' && phases.before_departure.status !== 'active' && 'scale-110'
            )} />
            <span className="text-center leading-[1.2] px-0.5">
              <span className="block">Sebelum</span>
              <span className="block">Berangkat</span>
            </span>
          </TabsTrigger>
          
          <TabsTrigger
            value="during_trip"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-1.5 text-[10px] font-semibold transition-all rounded-lg min-h-[60px]',
              activeTab === 'during_trip'
                ? phases.during_trip.status === 'completed'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/50'
                  : phases.during_trip.status === 'active'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200/50'
                  : 'bg-white text-slate-900 shadow-sm'
                : phases.during_trip.status === 'completed'
                ? 'text-emerald-600 hover:bg-emerald-50/50'
                : phases.during_trip.status === 'active'
                ? 'text-blue-600 hover:bg-blue-50/50'
                : 'text-slate-500 hover:bg-white/50'
            )}
          >
            <phases.during_trip.icon className={cn(
              'h-3.5 w-3.5 transition-transform flex-shrink-0',
              activeTab === 'during_trip' && phases.during_trip.status !== 'completed' && phases.during_trip.status !== 'active' && 'scale-110'
            )} />
            <span className="text-center leading-tight whitespace-nowrap">Selama Trip</span>
          </TabsTrigger>
          
          <TabsTrigger
            value="post_trip"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-1.5 text-[10px] font-semibold transition-all rounded-lg min-h-[60px]',
              activeTab === 'post_trip'
                ? phases.post_trip.status === 'completed'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/50'
                  : phases.post_trip.status === 'active'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200/50'
                  : 'bg-white text-slate-900 shadow-sm'
                : phases.post_trip.status === 'completed'
                ? 'text-emerald-600 hover:bg-emerald-50/50'
                : phases.post_trip.status === 'active'
                ? 'text-blue-600 hover:bg-blue-50/50'
                : 'text-slate-500 hover:bg-white/50'
            )}
          >
            <phases.post_trip.icon className={cn(
              'h-3.5 w-3.5 transition-transform flex-shrink-0',
              activeTab === 'post_trip' && phases.post_trip.status !== 'completed' && phases.post_trip.status !== 'active' && 'scale-110'
            )} />
            <span className="text-center leading-tight whitespace-nowrap">Selesai</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content - Pre-Trip */}
        <TabsContent value="pre_trip" className="mt-4 space-y-4">
          <PhaseContent
            phase="pre_trip"
            tripId={tripId}
            locale={locale}
            isLeadGuide={isLeadGuide}
            manifest={manifest}
            assignmentStatus={assignmentStatus}
            onOpenReadinessDialog={onOpenReadinessDialog}
          />
        </TabsContent>

        {/* Tab Content - Before Departure */}
        <TabsContent value="before_departure" className="mt-4 space-y-4">
          <PhaseContent
            phase="before_departure"
            tripId={tripId}
            locale={locale}
            isLeadGuide={isLeadGuide}
            crewRole={crewRole}
            manifest={manifest}
            passengers={manifest.passengers}
            onStartTrip={onStartTrip}
            onOpenReadinessDialog={onOpenReadinessDialog}
          />
        </TabsContent>

        {/* Tab Content - During Trip */}
        <TabsContent value="during_trip" className="mt-4 space-y-4">
          <PhaseContent
            phase="during_trip"
            tripId={tripId}
            locale={locale}
            isLeadGuide={isLeadGuide}
            onEndTrip={onEndTrip}
          />
        </TabsContent>

        {/* Tab Content - Post-Trip */}
        <TabsContent value="post_trip" className="mt-4 space-y-4">
          <PhaseContent
            phase="post_trip"
            tripId={tripId}
            locale={locale}
            isLeadGuide={isLeadGuide}
            manifest={manifest}
            onEndTrip={onEndTrip}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type PhaseContentProps = {
  phase: TripPhase;
  tripId: string;
  locale: string;
  isLeadGuide: boolean;
  crewRole?: string | null;
  manifest?: {
    totalPax: number;
    boardedCount: number;
    returnedCount: number;
    documentationUrl?: string | null;
    tripName?: string;
  };
  passengers?: Passenger[];
  assignmentStatus?: 'pending_confirmation' | 'confirmed' | 'rejected' | null;
  onStartTrip?: () => void;
  onEndTrip?: () => void;
  onOpenReadinessDialog?: () => void;
};

function PhaseContent({
  phase,
  tripId,
  locale,
  isLeadGuide,
  crewRole,
  manifest,
  passengers,
  assignmentStatus,
  onStartTrip,
  onEndTrip,
  onOpenReadinessDialog,
}: PhaseContentProps) {
  return (
    <>
      {phase === 'pre_trip' && (
        <>
          {/* Pending Confirmation Alert - Top (conditional) */}
          {assignmentStatus === 'pending_confirmation' && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">Perlu Konfirmasi</p>
                    <p className="mt-1 text-sm text-amber-800">Silakan konfirmasi apakah Anda bisa mengambil trip ini sebelum deadline.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section A: Trip Information (read-only) */}
          <PhaseSectionHeader
            title="Informasi Trip"
            description="Detail trip, add-ons, dan catatan khusus"
            icon={Info}
            className="!pt-0"
          />
          <div className="space-y-4">
            <TripInfoSection tripId={tripId} locale={locale} />
            <AddOnsSection tripId={tripId} locale={locale} />
            <TripSpecialNotesSection tripId={tripId} locale={locale} />
          </div>

          {/* Section B: Team & Communication */}
          <PhaseSectionHeader
            title="Team & Komunikasi"
            description="Informasi crew dan catatan internal"
            icon={Users}
          />
          <div className="space-y-4">
            <CrewSection tripId={tripId} locale={locale} />
            <CrewNotesSection tripId={tripId} locale={locale} />
          </div>

          {/* Section C: Pre-Trip Checklist (required actions) */}
          <PhaseSectionHeader
            title="Checklist Persiapan"
            description="Risk assessment dan equipment checklist wajib dilakukan sebelum trip"
            icon={ShieldCheck}
            required
          />
          <div className="space-y-4">
            {/* Risk Assessment FIRST (risk evaluation before equipment) */}
            <RiskAssessmentSection tripId={tripId} locale={locale} isLeadGuide={isLeadGuide} />
            {/* Equipment Checklist AFTER risk assessment */}
            <EquipmentChecklistSection tripId={tripId} locale={locale} />
          </div>

          {/* Section D: Safety Briefing Video */}
          <PhaseSectionHeader
            title="Safety Briefing Video"
            description="Tonton video briefing keselamatan sebelum memulai trip"
            icon={Play}
          />
          <VideoBriefingPlayer tripId={tripId} language={locale === 'en' ? 'en' : 'id'} />

          {/* Section D: Readiness Status (summary - LAST) */}
          {isLeadGuide && (
            <div className="pt-4 border-t border-slate-200">
              <TripReadinessWidget
                tripId={tripId}
                locale={locale}
                isLeadGuide={isLeadGuide}
                onOpenDialog={onOpenReadinessDialog}
              />
            </div>
          )}
        </>
      )}

      {phase === 'before_departure' && (
        <>
          {/* Section A: Passenger Management */}
          <PhaseSectionHeader
            title="Manajemen Penumpang"
            description="Konsensus penumpang dan manifest check-in"
            icon={Users}
            className="!pt-0"
          />
          <div className="space-y-4">
            {/* Passenger Consent FIRST (legal requirement) */}
            <PassengerConsentSection tripId={tripId} locale={locale} />
            {/* Manifest AFTER consent */}
            <div id="manifest-section">
              <ManifestSection 
                tripId={tripId} 
                locale={locale} 
                crewRole={crewRole}
                isLeadGuide={isLeadGuide}
              />
            </div>
          </div>

          {/* Section B: Pre-Departure Tasks */}
          <PhaseSectionHeader
            title="Pre-Departure Tasks"
            description="Task checklist sebelum keberangkatan"
            icon={ClipboardList}
          />
          <div id="tasks-section">
            <TripTasks tripId={tripId} />
          </div>

          {/* Section C: Start Trip (Lead Guide only) */}
          {isLeadGuide && (
            <>
              <PhaseSectionHeader
                title="Mulai Trip"
                description="Pastikan semua requirement sudah terpenuhi sebelum memulai trip"
                icon={Play}
                required
              />
              <StartTripWidget
                tripId={tripId}
                locale={locale}
                onStart={onStartTrip}
                isLeadGuide={isLeadGuide}
              />
            </>
          )}
        </>
      )}

      {phase === 'during_trip' && (
        <>
          {/* Section A: Trip Navigation */}
          <PhaseSectionHeader
            title="Navigasi Trip"
            description="Itinerary dan timeline aktivitas trip"
            icon={MapPin}
            className="!pt-0"
          />
          <TripItineraryTimeline tripId={tripId} locale={locale} />

          {/* Section B: Guest Management */}
          <PhaseSectionHeader
            title="Manajemen Tamu"
            description="Engagement dan tipping untuk tamu"
            icon={Users}
          />
          <div className="space-y-4">
            <GuestEngagementSection tripId={tripId} locale={locale} />
            <TippingSection tripId={tripId} locale={locale} />
          </div>

          {/* Section C: Quick Actions (Lead Guide only) */}
          {isLeadGuide && (
            <>
              <PhaseSectionHeader
                title="Quick Actions"
                description="Akses cepat ke fungsi penting selama trip"
                icon={AlertCircle}
              />
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Scroll to manifest section
                    const element = document.querySelector('#manifest-section');
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="h-12"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Update Manifest
                </Button>
                <Button
                  variant="outline"
                  onClick={onEndTrip}
                  className="h-12 border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  End Trip
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {phase === 'post_trip' && (
        <>
          {/* Section A: Completion Status (summary - top) */}
          {isLeadGuide && (
            <div className="!pt-0">
              <CompletionChecklistWidget
                tripId={tripId}
                locale={locale}
                isLeadGuide={isLeadGuide}
                onEndTrip={onEndTrip}
              />
            </div>
          )}

          {/* Section B: Required Actions (must complete) */}
          <PhaseSectionHeader
            title="Tindakan Wajib"
            description="Semua item ini harus diselesaikan sebelum trip dapat di-mark complete"
            icon={CheckCircle2}
            required
            className={isLeadGuide ? undefined : '!pt-0'}
          />
          <div className="space-y-4">
            <div id="documentation-section">
              <DocumentationSection 
                tripId={tripId} 
                locale={locale}
                tripCode={(manifest as { tripCode?: string }).tripCode || tripId}
                isLeadGuide={isLeadGuide}
              />
            </div>
            <div id="handover-section">
              <LogisticsHandoverSection tripId={tripId} locale={locale} />
            </div>
            <div id="waste-log-section">
              <WasteLogButton tripId={tripId} locale={locale} />
            </div>
          </div>

          {/* Section C: Optional Actions (can skip) */}
          <PhaseSectionHeader
            title="Tindakan Opsional"
            description="Item ini dapat dilewati, namun disarankan untuk diselesaikan"
            icon={Receipt}
          />
          <div className="space-y-4">
            <div id="expenses-section">
              <ExpensesClient tripId={tripId} locale={locale} />
            </div>
            {isLeadGuide && (
              <div id="payment-split-section">
                <PaymentSplitSection tripId={tripId} locale={locale} />
              </div>
            )}
          </div>

          {/* Section D: Summary (read-only - bottom) */}
          <PhaseSectionHeader
            title="Ringkasan Trip"
            description="Informasi trip dan pembayaran (read-only)"
            icon={FileText}
          />
          <div id="trip-summary-section">
            <TripSummarySection tripId={tripId} locale={locale} />
          </div>
        </>
      )}
    </>
  );
}
