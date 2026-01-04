/**
 * Profile Loading State
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Skeleton className="h-8 w-[160px]" />

      {/* Avatar Section */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-[150px]" />
        <Skeleton className="h-4 w-[200px]" />
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-10 w-full bg-muted" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[40px]" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
    </div>
  );
}

