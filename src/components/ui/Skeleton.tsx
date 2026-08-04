import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-xl bg-gray-200/70', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-card bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="w-2/3 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card bg-card p-5 shadow-card">
          <Skeleton className="mb-2.5 h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
