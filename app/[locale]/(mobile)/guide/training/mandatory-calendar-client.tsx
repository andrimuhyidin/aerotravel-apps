'use client';

/**
 * Mandatory Training Calendar Client Component
 * Calendar view dan list view untuk mandatory trainings
 */

import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

type MandatoryTrainingCalendarClientProps = {
  locale: string;
};

type MandatoryTrainingAssignment = {
  id: string;
  due_date: string;
  completed_at: string | null;
  status: 'pending' | 'completed' | 'overdue';
  mandatory_training: {
    id: string;
    title: string;
    description: string | null;
    training_type: string;
    frequency: string;
  };
};

type MandatoryTrainingData = {
  compliance: {
    percentage: number;
    total_assignments: number;
    completed_count: number;
    pending_count: number;
    overdue_count: number;
  };
  assignments: {
    upcoming: MandatoryTrainingAssignment[];
    overdue: MandatoryTrainingAssignment[];
    completed: MandatoryTrainingAssignment[];
    all: MandatoryTrainingAssignment[];
  };
};

export function MandatoryTrainingCalendarClient({
  locale,
}: MandatoryTrainingCalendarClientProps) {
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const { data, isLoading, error } = useQuery<MandatoryTrainingData>({
    queryKey: ['guide', 'training', 'mandatory'],
    queryFn: async () => {
      const res = await fetch('/api/guide/training/mandatory');
      if (!res.ok) throw new Error('Failed to fetch mandatory trainings');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading mandatory trainings...</div>
      </div>
    );
  }

  if (error) {
    logger.error('Failed to load mandatory trainings', error);
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Failed to load data</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const compliance = data.compliance || {
    percentage: 0,
    total_assignments: 0,
    completed_count: 0,
    pending_count: 0,
    overdue_count: 0,
  };
  const assignments = data.assignments || {
    upcoming: [],
    overdue: [],
    completed: [],
    all: [],
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Compliance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Training Compliance Status</CardTitle>
          <CardDescription>Your mandatory training compliance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{compliance.percentage.toFixed(0)}%</div>
              <div className="text-xs text-slate-600">Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{compliance.completed_count}</div>
              <div className="text-xs text-slate-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{compliance.pending_count}</div>
              <div className="text-xs text-slate-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{compliance.overdue_count}</div>
              <div className="text-xs text-slate-600">Overdue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          {/* Overdue Trainings */}
          {assignments.overdue.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-900">Overdue Trainings</CardTitle>
                <CardDescription>These trainings are past their due date</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments.overdue.map((assignment) => {
                  if (!assignment || !assignment.id || !assignment.mandatory_training) return null;
                  const daysOverdue = Math.abs(getDaysUntilDue(assignment.due_date || new Date().toISOString()));
                  const training = assignment.mandatory_training;
                  return (
                    <div
                      key={assignment.id}
                      className="rounded-lg border border-red-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(assignment.status)}
                            <h4 className="font-semibold text-slate-900">
                              {training.title || 'Training'}
                            </h4>
                          </div>
                          {training.description && (
                            <p className="mt-1 text-sm text-slate-600">
                              {training.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            {training.training_type && (
                              <Badge variant="outline">{training.training_type}</Badge>
                            )}
                            {training.frequency && (
                              <Badge variant="outline">{training.frequency}</Badge>
                            )}
                            <span className="text-xs text-red-600">
                              {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(assignment.status)}
                          <div className="mt-1 text-xs text-slate-500">
                            Due: {formatDate(assignment.due_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Trainings */}
          {assignments.upcoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Trainings</CardTitle>
                <CardDescription>Trainings that need to be completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments.upcoming.map((assignment) => {
                  if (!assignment || !assignment.id || !assignment.mandatory_training) return null;
                  const daysUntil = getDaysUntilDue(assignment.due_date || new Date().toISOString());
                  const training = assignment.mandatory_training;
                  return (
                    <div
                      key={assignment.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(assignment.status)}
                            <h4 className="font-semibold text-slate-900">
                              {training.title || 'Training'}
                            </h4>
                          </div>
                          {training.description && (
                            <p className="mt-1 text-sm text-slate-600">
                              {training.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            {training.training_type && (
                              <Badge variant="outline">{training.training_type}</Badge>
                            )}
                            {training.frequency && (
                              <Badge variant="outline">{training.frequency}</Badge>
                            )}
                            <span
                              className={cn(
                                'text-xs',
                                daysUntil <= 7 ? 'text-red-600 font-semibold' : 'text-slate-600'
                              )}
                            >
                              {daysUntil > 0
                                ? `${daysUntil} day${daysUntil !== 1 ? 's' : ''} remaining`
                                : 'Due today'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(assignment.status)}
                          <div className="mt-1 text-xs text-slate-500">
                            Due: {formatDate(assignment.due_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Completed Trainings */}
          {assignments.completed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Trainings</CardTitle>
                <CardDescription>Trainings you have completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments.completed.slice(0, 5).map((assignment) => {
                  if (!assignment || !assignment.id || !assignment.mandatory_training) return null;
                  const training = assignment.mandatory_training;
                  return (
                    <div
                      key={assignment.id}
                      className="rounded-lg border border-green-200 bg-green-50/50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(assignment.status)}
                            <h4 className="font-semibold text-slate-900">
                              {training.title || 'Training'}
                            </h4>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            {training.training_type && (
                              <Badge variant="outline">{training.training_type}</Badge>
                            )}
                            {training.frequency && (
                              <Badge variant="outline">{training.frequency}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(assignment.status)}
                          {assignment.completed_at && (
                            <div className="mt-1 text-xs text-slate-500">
                              Completed: {formatDate(assignment.completed_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {assignments.all.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                No mandatory trainings assigned
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>View trainings by due date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-slate-500">
                <CalendarIcon className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-4">Calendar view coming soon</p>
                <p className="text-sm">Please use list view for now</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

