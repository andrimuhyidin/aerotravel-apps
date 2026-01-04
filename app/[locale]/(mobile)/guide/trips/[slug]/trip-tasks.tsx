'use client';

/**
 * Trip Tasks Component
 * Checklist task per trip dengan progress bar
 */

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type TripTask = {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  completedAt?: string | null;
  category?: string;
};

type TripTasksProps = {
  tripId: string;
};

export function TripTasks({ tripId }: TripTasksProps) {
  const [tasks, setTasks] = useState<TripTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTasks = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/guide/trips/${tripId}/tasks`);
        if (!res.ok) throw new Error('Failed to load tasks');
        const data = (await res.json()) as { tasks: TripTask[] };
        if (mounted) {
          setTasks(data.tasks);
        }
      } catch (error) {
        // Error will be handled by UI (show error state)
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to load tasks');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadTasks();

    return () => {
      mounted = false;
    };
  }, [tripId]);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    setUpdating(taskId);
    try {
      const res = await fetch(`/api/guide/trips/${tripId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: !currentCompleted,
                completedAt: !currentCompleted ? new Date().toISOString() : null,
              }
            : task,
        ),
      );
    } catch (error) {
      logger.error('Failed to update task', error, { tripId, taskId });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Task List Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const requiredCount = tasks.filter((t) => t.required).length;
  const completedRequiredCount = tasks.filter((t) => t.required && t.completed).length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allRequiredCompleted = requiredCount > 0 && completedRequiredCount === requiredCount;

  // Group tasks by category if they have categories
  const groupedTasks = tasks.reduce(
    (acc, task) => {
      const category = task.category || 'Umum';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(task);
      return acc;
    },
    {} as Record<string, TripTask[]>,
  );

  const hasCategories = Object.keys(groupedTasks).length > 1;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">Task List Trip</CardTitle>
          <span className="text-xs font-medium text-slate-500">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="mt-2 space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{progress}% selesai</span>
            {allRequiredCompleted ? (
              <span className="font-medium text-emerald-600">✓ Semua task wajib selesai</span>
            ) : (
              <span className="text-amber-600">
                {requiredCount - completedRequiredCount} task wajib belum selesai
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCategories ? (
          // Grouped by category
          Object.entries(groupedTasks).map(([category, categoryTasks]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    updating={updating === task.id}
                    onToggle={() => handleToggleTask(task.id, task.completed)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat list
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                updating={updating === task.id}
                onToggle={() => handleToggleTask(task.id, task.completed)}
              />
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">
            Belum ada task untuk trip ini
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type TaskItemProps = {
  task: TripTask;
  updating: boolean;
  onToggle: () => void;
};

function TaskItem({ task, updating, onToggle }: TaskItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={updating}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
        task.completed
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white hover:border-slate-300',
        updating && 'opacity-50 cursor-not-allowed',
      )}
    >
      {updating ? (
        <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-emerald-600" />
      ) : task.completed ? (
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
      ) : (
        <Circle className="h-5 w-5 flex-shrink-0 text-slate-400" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              task.completed ? 'text-emerald-900 line-through' : 'text-slate-900',
            )}
          >
            {task.label}
          </span>
          {task.required && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Wajib
            </span>
          )}
        </div>
        {task.completed && task.completedAt && (
          <p className="mt-0.5 text-xs text-slate-500">
            Selesai {new Date(task.completedAt).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </button>
  );
}
