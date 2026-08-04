import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong loading this.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-white px-6 py-8 text-center shadow-card">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/10">
        <AlertCircle className="h-5 w-5 text-danger" />
      </span>
      <p className="text-sm text-text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" fullWidth={false} className="px-6" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
