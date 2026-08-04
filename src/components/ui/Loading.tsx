import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LoadingProps {
  fullScreen?: boolean;
  label?: string;
  className?: string;
}

export function Loading({ fullScreen = false, label = 'Loading...', className }: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-text-muted',
        fullScreen ? 'h-screen w-full' : 'py-12',
        className
      )}
    >
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
