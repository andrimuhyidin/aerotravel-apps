'use client';

/**
 * AI Manifest Suggestions Component
 * Auto-suggest notes, safety alerts, grouping suggestions
 */

import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Lightbulb, RefreshCw, Sparkles, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ManifestAiSuggestionsProps = {
  tripId: string;
  passengerId?: string;
  onSuggestionApplied?: (suggestion: {
    notes?: string;
    alerts?: string[];
  }) => void;
  autoLoadAlerts?: boolean; // Auto-load high-priority alerts on mount
};

export function ManifestAiSuggestions({
  tripId,
  passengerId,
  onSuggestionApplied,
  autoLoadAlerts = true,
}: ManifestAiSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<{
    suggestedNotes?: string;
    safetyAlerts?: string[];
    priority?: 'high' | 'medium' | 'low';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groupings, setGroupings] = useState<Array<{
    groupName: string;
    passengerNames: string[];
    reason: string;
  }>>([]);
  const [alerts, setAlerts] = useState<Array<{
    type: string;
    message: string;
    affectedPassengers: string[];
    priority?: 'high' | 'medium' | 'low';
  }>>([]);
  const [autoLoaded, setAutoLoaded] = useState(false);

  const suggestMutation = useMutation({
    mutationFn: async (type: 'notes' | 'grouping' | 'alerts') => {
      const res = await fetch('/api/guide/manifest/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          type,
          passengerId: passengerId || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to get suggestions');
      return (await res.json()) as {
        suggestedNotes?: string;
        safetyAlerts?: string[];
        groupings?: Array<{
          groupName: string;
          passengerNames: string[];
          reason: string;
        }>;
        alerts?: Array<{
          type: string;
          message: string;
          affectedPassengers: string[];
        }>;
      };
    },
    onSuccess: (data, type) => {
      if (type === 'notes') {
        setSuggestions(data);
      } else if (type === 'grouping') {
        setGroupings(data.groupings || []);
      } else if (type === 'alerts') {
        setAlerts(data.alerts || []);
      }
    },
  });

  // Auto-load all suggestions on mount (alerts + grouping)
  useEffect(() => {
    if (autoLoadAlerts && !autoLoaded) {
      setIsLoading(true);
      const loadAllSuggestions = async () => {
        try {
          // Load alerts and grouping in parallel
          const [alertsRes, groupingRes] = await Promise.all([
            fetch('/api/guide/manifest/suggest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tripId,
                type: 'alerts',
              }),
            }),
            fetch('/api/guide/manifest/suggest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tripId,
                type: 'grouping',
              }),
            }),
          ]);

          // Process alerts
          if (alertsRes.ok) {
            const alertsData = await alertsRes.json();
            const allAlerts = (alertsData.alerts || []) as Array<{
              type: string;
              message: string;
              affectedPassengers: string[];
              priority?: 'high' | 'medium' | 'low';
            }>;
            if (allAlerts.length > 0) {
              // Sort: high priority first
              const sorted = allAlerts.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return (priorityOrder[a.priority || 'low'] || 2) - (priorityOrder[b.priority || 'low'] || 2);
              });
              setAlerts(sorted);
            }
          }

          // Process grouping
          if (groupingRes.ok) {
            const groupingData = await groupingRes.json();
            const allGroupings = (groupingData.groupings || []) as Array<{
              groupName: string;
              passengerNames: string[];
              reason: string;
            }>;
            if (allGroupings.length > 0) {
              setGroupings(allGroupings);
            }
          }

          setAutoLoaded(true);
        } catch (error) {
          console.error('Failed to load suggestions:', error);
        } finally {
          setIsLoading(false);
        }
      };
      void loadAllSuggestions();
    }
  }, [autoLoadAlerts, autoLoaded, tripId]);

  // Show loading state for auto-load
  if (isLoading && !autoLoaded) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Sparkles className="h-4 w-4 animate-pulse text-emerald-600" />
            <span>Memuat AI suggestions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRefresh = () => {
    setAutoLoaded(false);
    setAlerts([]);
    setGroupings([]);
    setSuggestions(null);
  };

  return (
    <div className="space-y-3">
      {/* Header with refresh button - Always visible */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">AI Suggestions</p>
              {autoLoaded && (alerts.length > 0 || groupings.length > 0) && (
                <span className="text-xs text-slate-500">(Auto-generated)</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-600 hover:text-emerald-600 hover:bg-white/80 active:scale-95 transition-all"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh AI suggestions"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Notes Suggestions */}
      {suggestions && (
        <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <Lightbulb className="h-4 w-4 text-emerald-600" />
              Suggested Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-emerald-800 leading-relaxed">{suggestions.suggestedNotes}</p>
            {suggestions.safetyAlerts && suggestions.safetyAlerts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200 space-y-1.5">
                <p className="text-xs font-medium text-emerald-700 mb-1">Safety Notes:</p>
                {suggestions.safetyAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-emerald-700">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{alert}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Display Grouping Suggestions - Auto-loaded */}
      {groupings.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-900">
              <Users className="h-4 w-4 text-blue-600" />
              Suggested Passenger Groups
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {groupings.map((group, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-blue-100 border border-blue-200"
                >
                  <p className="font-semibold text-sm text-blue-900 mb-1">{group.groupName}</p>
                  <p className="text-xs text-blue-700 mb-2 leading-relaxed">{group.reason}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.passengerNames.map((name, nameIdx) => (
                      <span
                        key={nameIdx}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Alerts - Show prominently if auto-loaded or manually loaded */}
      {alerts.length > 0 && (
        <Card className={`${alerts.some(a => a.priority === 'high') ? 'border-red-300 bg-red-50 shadow-sm' : 'border-amber-200 bg-amber-50 shadow-sm'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 text-sm font-semibold ${alerts.some(a => a.priority === 'high') ? 'text-red-900' : 'text-amber-900'}`}>
                <AlertTriangle className={`h-4 w-4 ${alerts.some(a => a.priority === 'high') ? 'text-red-600' : 'text-amber-600'}`} />
                Safety Alerts
              </CardTitle>
              {alerts.some(a => a.priority === 'high') && (
                <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  High Priority
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.priority === 'high'
                      ? 'bg-red-100 border-red-200'
                      : alert.priority === 'medium'
                        ? 'bg-amber-100 border-amber-200'
                        : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <AlertTriangle
                    className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      alert.priority === 'high'
                        ? 'text-red-600'
                        : alert.priority === 'medium'
                          ? 'text-amber-600'
                          : 'text-slate-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium leading-relaxed ${
                        alert.priority === 'high'
                          ? 'text-red-900'
                          : alert.priority === 'medium'
                            ? 'text-amber-900'
                            : 'text-slate-900'
                      }`}
                    >
                      {alert.message}
                    </p>
                    {alert.affectedPassengers && alert.affectedPassengers.length > 0 && (
                      <p
                        className={`text-xs mt-1.5 ${
                          alert.priority === 'high'
                            ? 'text-red-700'
                            : alert.priority === 'medium'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                        }`}
                      >
                        <span className="font-medium">Terdampak:</span>{' '}
                        {alert.affectedPassengers.length <= 3
                          ? alert.affectedPassengers.join(', ')
                          : `${alert.affectedPassengers.slice(0, 3).join(', ')} dan ${alert.affectedPassengers.length - 3} lainnya`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state if no suggestions */}
      {!isLoading && autoLoaded && alerts.length === 0 && !suggestions && groupings.length === 0 && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-4 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 mb-1">Tidak ada suggestions</p>
            <p className="text-xs text-slate-500">
              Semua penumpang sudah aman dan tidak memerlukan perhatian khusus.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Manual action buttons - Only show for notes (if passengerId) */}
      {passengerId && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-emerald-600" />
              Suggest Notes for Passenger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => suggestMutation.mutate('notes')}
              disabled={suggestMutation.isPending}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              {suggestMutation.isPending ? 'Generating...' : 'Get AI Notes Suggestion'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
